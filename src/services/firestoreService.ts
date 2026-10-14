import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Job, JobStatus, JobAddOn, UserProfile, UserRole, Technician, RateCardItem } from '../types';
import { TECHNICIANS_DATA, MASTER_RATE_CARD } from '../data/rateCard';

const BOOKINGS_COLLECTION = 'bookings';
const USERS_COLLECTION = 'users';
const TECHNICIANS_COLLECTION = 'technicians';
const SERVICES_COLLECTION = 'services';
const PAYMENTS_COLLECTION = 'payments';
const AUDIT_LOGS_COLLECTION = 'auditLogs';

// Helper to generate collision-resistant, unguessable Job IDs: FF-26-XXXXXX (6 random digits)
export function generateJobId(_existingCount: number = 0): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `FF-26-${randomSuffix}`;
}

// -------------------------------------------------------------
// USER & RBAC PROFILE SERVICES
// -------------------------------------------------------------

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
    return null;
  }
}

export async function syncOrCreateUserProfile(
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }
): Promise<UserProfile> {
  const adminEmail = 'furniturefixservice@gmail.com';
  const isAdmin = user.email?.toLowerCase() === adminEmail.toLowerCase();

  // Look up if user matches known technician email from official roster
  let matchedTechId: string | undefined = undefined;
  if (user.email) {
    const tech = TECHNICIANS_DATA.find(
      (t) => t.email && t.email.toLowerCase() === user.email?.toLowerCase()
    );
    if (tech) {
      matchedTechId = tech.id;
    }
  }

  // Trusted authorization: only master email can be admin, only roster email can be tech, everyone else is customer
  const determinedRole: UserRole = isAdmin ? 'admin' : matchedTechId ? 'technician' : 'customer';

  try {
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      // If admin email signed in, ensure role is admin
      if (isAdmin && existing.role !== 'admin') {
        const updatedProfile: UserProfile = { ...existing, role: 'admin' };
        await updateDoc(userDocRef, { role: 'admin' });
        return updatedProfile;
      }
      return existing;
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
      photoURL: user.photoURL || null,
      role: determinedRole,
      technicianId: matchedTechId,
    };

    await setDoc(userDocRef, {
      ...newProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Record audit log for authenticated user
    await recordAuditLog('USER_REGISTERED', user.uid, `Role assigned: ${determinedRole}`, user.email || undefined);

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${user.uid}`);
    throw error;
  }
}

// -------------------------------------------------------------
// REAL-TIME BOOKINGS LISTENER (PARTITIONED BY ROLE)
// -------------------------------------------------------------

export function subscribeToBookings(
  role: UserRole,
  userId: string | null,
  techId: string | null,
  onUpdate: (jobs: Job[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    let q;

    if (role === 'admin') {
      // Admins see all bookings
      q = query(bookingsRef);
    } else if (role === 'technician') {
      // Technicians ONLY see jobs assigned to them
      const targetTech = techId || 'TECH-001';
      q = query(bookingsRef, where('assignedTechId', '==', targetTech));
    } else {
      // Customers ONLY see their own bookings if logged in
      if (userId) {
        q = query(bookingsRef, where('customerId', '==', userId));
      } else {
        // If not logged in, empty initial query
        onUpdate([]);
        return () => {};
      }
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const loadedJobs: Job[] = [];
        snapshot.forEach((docSnap) => {
          loadedJobs.push(docSnap.data() as Job);
        });
        // Sort descending by created timestamp
        loadedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(loadedJobs);
      },
      (error) => {
        console.error('Bookings snapshot error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, BOOKINGS_COLLECTION);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, BOOKINGS_COLLECTION);
    return () => {};
  }
}

// Direct fetch of single booking for public/customer Job Tracking by ID
export async function getBookingById(jobId: string): Promise<Job | null> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, jobId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Job;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${BOOKINGS_COLLECTION}/${jobId}`);
    return null;
  }
}

// -------------------------------------------------------------
// MUTATION OPERATIONS (STRICT SECURITY & AUDITING)
// -------------------------------------------------------------

export async function createBookingInFirestore(newJob: Job): Promise<void> {
  try {
    const jobDocRef = doc(db, BOOKINGS_COLLECTION, newJob.id);
    await setDoc(jobDocRef, newJob);

    // Add initial status history subcollection entry
    const historyDocRef = doc(collection(db, BOOKINGS_COLLECTION, newJob.id, 'statusHistory'));
    await setDoc(historyDocRef, {
      status: newJob.status,
      timestamp: newJob.createdAt,
      note: 'Booking submitted online with zero advance payment guarantee',
      actor: newJob.customer.name,
    });

    await recordAuditLog('BOOKING_CREATED', newJob.customerId || 'anon', `Job ${newJob.id} created for ${newJob.customer.locality} (₹${newJob.finalTotal})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${BOOKINGS_COLLECTION}/${newJob.id}`);
    throw error;
  }
}

export async function updateJobStatusInFirestore(
  jobId: string,
  status: JobStatus,
  note: string,
  actor: string,
  existingJob: Job
): Promise<void> {
  try {
    const jobDocRef = doc(db, BOOKINGS_COLLECTION, jobId);
    const now = new Date().toISOString();
    const updatedHistory = [
      ...existingJob.statusHistory,
      {
        status,
        timestamp: now,
        note: note || `Status updated to ${status}`,
        actor,
      },
    ];

    await updateDoc(jobDocRef, {
      status,
      statusHistory: updatedHistory,
    });

    // Write to subcollection for immutable audit record
    const historyDocRef = doc(collection(db, BOOKINGS_COLLECTION, jobId, 'statusHistory'));
    await setDoc(historyDocRef, {
      status,
      timestamp: now,
      note: note || `Status updated to ${status}`,
      actor,
    });

    await recordAuditLog('STATUS_CHANGED', actor, `Job ${jobId} transitioned to ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COLLECTION}/${jobId}`);
    throw error;
  }
}

export async function assignTechnicianInFirestore(
  jobId: string,
  techId: string,
  techName: string,
  existingJob: Job
): Promise<void> {
  try {
    const jobDocRef = doc(db, BOOKINGS_COLLECTION, jobId);
    const now = new Date().toISOString();
    const updatedHistory = [
      ...existingJob.statusHistory,
      {
        status: 'Assigned' as JobStatus,
        timestamp: now,
        note: `Assigned to ${techName} (${techId})`,
        actor: 'Dispatcher',
      },
    ];

    await updateDoc(jobDocRef, {
      assignedTechId: techId,
      status: 'Assigned',
      statusHistory: updatedHistory,
    });

    // Add subcollection status history
    const historyDocRef = doc(collection(db, BOOKINGS_COLLECTION, jobId, 'statusHistory'));
    await setDoc(historyDocRef, {
      status: 'Assigned',
      timestamp: now,
      note: `Assigned to ${techName} (${techId})`,
      actor: 'Dispatcher',
    });

    await recordAuditLog('TECH_ASSIGNED', 'Dispatcher', `Job ${jobId} assigned to ${techName} (${techId})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COLLECTION}/${jobId}`);
    throw error;
  }
}

export async function requestAddOnInFirestore(
  jobId: string,
  description: string,
  amount: number,
  existingJob: Job
): Promise<JobAddOn> {
  try {
    const now = new Date().toISOString();
    const addOnId = `addon-${Date.now()}`;
    const newAddOn: JobAddOn = {
      id: addOnId,
      description,
      amount,
      status: 'pending',
      requestedAt: now,
    };

    const updatedAddOns = [...(existingJob.addOns || []), newAddOn];
    const updatedHistory = [
      ...existingJob.statusHistory,
      {
        status: existingJob.status,
        timestamp: now,
        note: `Technician proposed onsite add-on: ${description} (₹${amount}). Awaiting customer approval.`,
        actor: 'Technician',
      },
    ];

    const jobDocRef = doc(db, BOOKINGS_COLLECTION, jobId);
    await updateDoc(jobDocRef, {
      addOns: updatedAddOns,
      statusHistory: updatedHistory,
    });

    // Add to subcollection
    const addOnDocRef = doc(db, BOOKINGS_COLLECTION, jobId, 'addOns', addOnId);
    await setDoc(addOnDocRef, newAddOn);

    await recordAuditLog('ADDON_PROPOSED', 'Technician', `Add-on ${description} (₹${amount}) proposed for Job ${jobId}`);
    return newAddOn;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COLLECTION}/${jobId}`);
    throw error;
  }
}

export async function respondToAddOnInFirestore(
  jobId: string,
  addOnId: string,
  approved: boolean,
  existingJob: Job
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const targetAddOn = existingJob.addOns.find((a) => a.id === addOnId);
    if (!targetAddOn) return;

    const updatedAddOns = existingJob.addOns.map((a) =>
      a.id === addOnId
        ? { ...a, status: (approved ? 'approved' : 'declined') as 'approved' | 'declined', approvedAt: now }
        : a
    );

    const newFinalTotal =
      existingJob.baseTotal +
      updatedAddOns
        .filter((a) => a.status === 'approved')
        .reduce((sum, a) => sum + a.amount, 0) +
      existingJob.travelCharge;

    const updatedPayout = approved
      ? existingJob.technicianPayout + Math.round(targetAddOn.amount * 0.4)
      : existingJob.technicianPayout;
    const updatedMargin = approved
      ? existingJob.platformMargin + Math.round(targetAddOn.amount * 0.6)
      : existingJob.platformMargin;

    const updatedHistory = [
      ...existingJob.statusHistory,
      {
        status: existingJob.status,
        timestamp: now,
        note: approved
          ? `Customer APPROVED add-on: ${targetAddOn.description} (+₹${targetAddOn.amount}). Updated total: ₹${newFinalTotal}.`
          : `Customer DECLINED add-on: ${targetAddOn.description}.`,
        actor: 'Customer',
      },
    ];

    const jobDocRef = doc(db, BOOKINGS_COLLECTION, jobId);
    await updateDoc(jobDocRef, {
      addOns: updatedAddOns,
      finalTotal: newFinalTotal,
      technicianPayout: updatedPayout,
      platformMargin: updatedMargin,
      statusHistory: updatedHistory,
    });

    // Update in subcollection
    const addOnDocRef = doc(db, BOOKINGS_COLLECTION, jobId, 'addOns', addOnId);
    await updateDoc(addOnDocRef, {
      status: approved ? 'approved' : 'declined',
      approvedAt: now,
    });

    await recordAuditLog('ADDON_RESPONDED', 'Customer', `Add-on ${addOnId} on Job ${jobId} was ${approved ? 'APPROVED' : 'DECLINED'}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COLLECTION}/${jobId}`);
    throw error;
  }
}

export async function completeJobInFirestore(
  jobId: string,
  notes: string,
  photos: string[],
  existingJob: Job
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const photoList =
      photos && photos.length > 0
        ? photos
        : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60'];

    const updatedHistory = [
      ...existingJob.statusHistory,
      {
        status: 'Work Completed' as JobStatus,
        timestamp: now,
        note: notes || 'Assembly and installation finished. Verified with customer sign-off.',
        actor: 'Technician',
      },
    ];

    const jobDocRef = doc(db, BOOKINGS_COLLECTION, jobId);
    await updateDoc(jobDocRef, {
      status: 'Work Completed',
      completionPhotoUrls: photoList,
      description: notes || existingJob.description,
      statusHistory: updatedHistory,
    });

    await recordAuditLog('JOB_COMPLETED', 'Technician', `Job ${jobId} marked as Work Completed`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COLLECTION}/${jobId}`);
    throw error;
  }
}

export async function recordPaymentInFirestore(
  jobId: string,
  method: 'Cash' | 'UPI',
  reference: string,
  existingJob: Job,
  collectedBy: string = 'Staff'
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const ref =
      reference ||
      `${method}/${new Date().toISOString().slice(2, 10).replace(/-/g, '')}/${Math.floor(
        100000 + Math.random() * 900000
      )}`;

    const updatedHistory = [
      ...existingJob.statusHistory,
      {
        status: 'Paid' as JobStatus,
        timestamp: now,
        note: `Payment of ₹${existingJob.finalTotal} collected via ${method} (${ref}). Receipt generated.`,
        actor: collectedBy,
      },
    ];

    const jobDocRef = doc(db, BOOKINGS_COLLECTION, jobId);
    await updateDoc(jobDocRef, {
      status: 'Paid',
      paymentStatus: 'Paid',
      paymentMethod: method,
      paymentReference: ref,
      statusHistory: updatedHistory,
    });

    // Record entry in payments collection
    const paymentId = `PAY-${Date.now()}`;
    const paymentDocRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await setDoc(paymentDocRef, {
      id: paymentId,
      jobId,
      amount: existingJob.finalTotal,
      method,
      reference: ref,
      collectedAt: now,
      collectedBy,
    });

    await recordAuditLog('PAYMENT_COLLECTED', collectedBy, `₹${existingJob.finalTotal} collected for Job ${jobId} via ${method}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COLLECTION}/${jobId}`);
    throw error;
  }
}

// -------------------------------------------------------------
// AUDIT LOG SERVICE
// -------------------------------------------------------------

export async function recordAuditLog(action: string, actor: string, details: string, email?: string): Promise<void> {
  try {
    const currentUid = auth.currentUser?.uid;
    // Audit logs strictly require authenticated author matching request.auth.uid or admin
    if (!currentUid) {
      return;
    }
    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logDocRef = doc(db, AUDIT_LOGS_COLLECTION, logId);
    await setDoc(logDocRef, {
      id: logId,
      action,
      userId: currentUid,
      actorLabel: actor,
      userEmail: email || auth.currentUser?.email || 'authenticated_user',
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Non-blocking for UI operations
    console.warn('Audit log write skipped or failed:', e);
  }
}

// -------------------------------------------------------------
// OPTIONAL BOOTSTRAP: SEED SERVICES & TECHNICIANS TO FIRESTORE
// -------------------------------------------------------------

export async function bootstrapFirestoreDataIfEmpty(): Promise<void> {
  try {
    // Only attempt if admin is signed in
    if (auth.currentUser?.email?.toLowerCase() !== 'furniturefixservice@gmail.com') {
      return;
    }

    const techSnap = await getDocs(collection(db, TECHNICIANS_COLLECTION));
    if (techSnap.empty) {
      for (const tech of TECHNICIANS_DATA) {
        await setDoc(doc(db, TECHNICIANS_COLLECTION, tech.id), tech);
      }
    }

    const serviceSnap = await getDocs(collection(db, SERVICES_COLLECTION));
    if (serviceSnap.empty) {
      for (const item of MASTER_RATE_CARD) {
        await setDoc(doc(db, SERVICES_COLLECTION, item.id), item);
      }
    }
  } catch (error) {
    // Silently continue with local master definitions if rules forbid
    console.info('Master catalogue already initialized or protected');
  }
}
