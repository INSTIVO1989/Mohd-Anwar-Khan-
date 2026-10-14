import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { Job, JobStatus, RateCardItem, Technician, ServiceZone, UserProfile, UserRole } from '../types';
import { INITIAL_SAMPLE_JOBS, TECHNICIANS_DATA, MMR_ZONES } from '../data/rateCard';
import { auth, testFirestoreConnection } from '../services/firebase';
import { googleSignIn } from '../services/googleAuth';
import {
  subscribeToBookings,
  createBookingInFirestore,
  updateJobStatusInFirestore,
  assignTechnicianInFirestore,
  requestAddOnInFirestore,
  respondToAddOnInFirestore,
  completeJobInFirestore,
  recordPaymentInFirestore,
  syncOrCreateUserProfile,
  getUserProfile,
  generateJobId,
  bootstrapFirestoreDataIfEmpty,
} from '../services/firestoreService';

interface CartItem {
  item: RateCardItem;
  quantity: number;
}

interface AppContextType {
  // Mode & RBAC State
  isDemoMode: boolean;
  setIsDemoMode: (demo: boolean) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedTechId: string;
  setSelectedTechId: (id: string) => void;
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  isAuthLoading: boolean;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  signOutUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTargetRole: UserRole | null;
  setAuthModalTargetRole: (role: UserRole | null) => void;
  switchDemoRole: (role: UserRole, techId?: string) => void;

  // Operational State
  jobs: Job[];
  technicians: Technician[];
  cart: CartItem[];
  addToCart: (item: RateCardItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  selectedZone: ServiceZone | null;
  setSelectedZone: (zone: ServiceZone | null) => void;

  // Workflows / Mutations
  createBooking: (data: Omit<Job, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'addOns'>) => Promise<Job>;
  updateJobStatus: (jobId: string, status: JobStatus, note?: string, actor?: string) => Promise<void>;
  assignTechnician: (jobId: string, techId: string) => Promise<void>;
  requestAddOn: (jobId: string, description: string, amount: number) => Promise<void>;
  respondToAddOn: (jobId: string, addOnId: string, approved: boolean) => Promise<void>;
  completeJob: (jobId: string, notes?: string, photos?: string[]) => Promise<void>;
  recordPayment: (jobId: string, method: 'Cash' | 'UPI', reference?: string) => Promise<void>;

  // Modals & Drawers
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  isTrackingModalOpen: boolean;
  setIsTrackingModalOpen: (open: boolean) => void;
  activeTrackingJobId: string | null;
  setActiveTrackingJobId: (id: string | null) => void;
  isChatDrawerOpen: boolean;
  setIsChatDrawerOpen: (open: boolean) => void;

  // KPIs
  kpis: {
    todaysJobs: number;
    newLeads: number;
    pendingJobs: number;
    revenueReceived: number;
    outstanding: number;
    payoutDue: number;
    expenses: number;
    netCash: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Demo Mode toggle: defaults to false (Live Cloud Mode)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('furniture_fix_mode');
      return stored === 'demo';
    } catch {
      return false;
    }
  });

  // Current Active Role & Tech Selection
  const [role, setRole] = useState<UserRole>('customer');
  const [selectedTechId, setSelectedTechId] = useState<string>('TECH-001');

  // Firebase Auth & User Profile State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTargetRole, setAuthModalTargetRole] = useState<UserRole | null>(null);

  // In-Memory & LocalStorage persistence for Demo Mode jobs
  const [demoJobs, setDemoJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('furniture_fix_jobs_demo_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SAMPLE_JOBS;
  });

  // Live Cloud jobs from Firestore
  const [liveJobs, setLiveJobs] = useState<Job[]>([]);

  // Master lists
  const [technicians, setTechnicians] = useState<Technician[]>(TECHNICIANS_DATA);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(MMR_ZONES[0]);

  // Modal controls
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [activeTrackingJobId, setActiveTrackingJobId] = useState<string | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Unsubscribe ref for Firestore listener
  const unsubscribeBookingsRef = useRef<(() => void) | null>(null);

  // Synchronize Demo Mode toggle to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('furniture_fix_mode', isDemoMode ? 'demo' : 'live');
    } catch (e) {
      console.error(e);
    }
  }, [isDemoMode]);

  // Save Demo jobs changes
  useEffect(() => {
    if (isDemoMode) {
      try {
        localStorage.setItem('furniture_fix_jobs_demo_v1', JSON.stringify(demoJobs));
      } catch (e) {
        console.error(e);
      }
    }
  }, [demoJobs, isDemoMode]);

  // Connection validation on startup as required by Firebase skill
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // -------------------------------------------------------------
  // FIREBASE AUTHENTICATION LISTENER & RBAC PROFILE SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          const profile = await syncOrCreateUserProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
          setCurrentUser(profile);

          if (!isDemoMode) {
            // In Live mode, synchronize active role to user's verified role
            setRole(profile.role);
            if (profile.role === 'technician' && profile.technicianId) {
              setSelectedTechId(profile.technicianId);
            }
          }

          // If admin, optionally ensure master catalogue is initialized
          if (profile.role === 'admin') {
            bootstrapFirestoreDataIfEmpty();
          }
        } catch (err) {
          console.error('Error synchronizing user profile:', err);
        }
      } else {
        setFirebaseUser(null);
        setCurrentUser(null);
        if (!isDemoMode) {
          setRole('customer');
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubAuth();
  }, [isDemoMode]);

  // -------------------------------------------------------------
  // FIRESTORE REAL-TIME BOOKINGS SYNCHRONIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (isDemoMode) {
      // In Demo Mode, detach Firestore listener
      if (unsubscribeBookingsRef.current) {
        unsubscribeBookingsRef.current();
        unsubscribeBookingsRef.current = null;
      }
      return;
    }

    // Attach real-time listener partitioned by current verified role
    if (unsubscribeBookingsRef.current) {
      unsubscribeBookingsRef.current();
      unsubscribeBookingsRef.current = null;
    }

    const currentUid = firebaseUser?.uid || null;
    const currentTech = role === 'technician' ? (currentUser?.technicianId || selectedTechId) : null;

    unsubscribeBookingsRef.current = subscribeToBookings(
      role,
      currentUid,
      currentTech,
      (fetchedJobs) => {
        setLiveJobs(fetchedJobs);
      },
      (error) => {
        console.warn('Real-time listener notice:', error?.message);
      }
    );

    return () => {
      if (unsubscribeBookingsRef.current) {
        unsubscribeBookingsRef.current();
        unsubscribeBookingsRef.current = null;
      }
    };
  }, [isDemoMode, role, firebaseUser?.uid, currentUser?.technicianId, selectedTechId]);

  // Active jobs array based on active mode
  const jobs = isDemoMode ? demoJobs : liveJobs;

  // Update technician active job counts dynamically
  useEffect(() => {
    setTechnicians((prev) =>
      prev.map((tech) => {
        const active = jobs.filter(
          (j) => j.assignedTechId === tech.id && !['Completed', 'Paid', 'Cancelled'].includes(j.status)
        ).length;
        const totalEarnings = jobs
          .filter((j) => j.assignedTechId === tech.id && j.paymentStatus === 'Paid')
          .reduce((sum, j) => sum + j.technicianPayout, 0);

        return {
          ...tech,
          activeJobsCount: active,
          totalEarnings: 8000 + totalEarnings,
          status: active > 0 ? 'On Job' : 'Available',
        };
      })
    );
  }, [jobs]);

  // -------------------------------------------------------------
  // AUTH ACTIONS
  // -------------------------------------------------------------
  const signInWithGoogle = async (preferredRole: UserRole = 'customer') => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const profile = await syncOrCreateUserProfile(
          {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
            photoURL: res.user.photoURL,
          },
          preferredRole
        );
        setCurrentUser(profile);
        setRole(profile.role);
        if (profile.role === 'technician' && profile.technicianId) {
          setSelectedTechId(profile.technicianId);
        }
        setIsAuthModalOpen(false);
      }
    } catch (e) {
      console.error('Google Sign-in failed:', e);
      throw e;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setCurrentUser(null);
      setRole('customer');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const switchDemoRole = (targetRole: UserRole, techId?: string) => {
    setRole(targetRole);
    if (techId) {
      setSelectedTechId(techId);
    }
  };

  // -------------------------------------------------------------
  // CART ACTIONS
  // -------------------------------------------------------------
  const addToCart = (item: RateCardItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) => (i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.item.id === itemId ? { ...i, quantity: qty } : i)));
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((sum, i) => sum + i.item.customerPrice * i.quantity, 0);

  // -------------------------------------------------------------
  // BUSINESS WORKFLOWS & MUTATIONS (DEMO + LIVE FIRESTORE)
  // -------------------------------------------------------------

  // 1. Create Booking
  const createBooking = async (
    data: Omit<Job, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'addOns'>
  ): Promise<Job> => {
    const jobId = generateJobId(jobs.length);
    const now = new Date().toISOString();
    const customerUid = firebaseUser?.uid || undefined;

    const newJob: Job = {
      ...data,
      id: jobId,
      customerId: customerUid,
      createdAt: now,
      status: 'New',
      addOns: [],
      statusHistory: [
        {
          status: 'New',
          timestamp: now,
          note: 'Booking submitted online with zero advance payment guarantee',
          actor: data.customer.name,
        },
      ],
    };

    if (isDemoMode) {
      setDemoJobs((prev) => [newJob, ...prev]);
    } else {
      // Optimistic update + Firestore sync
      setLiveJobs((prev) => [newJob, ...prev]);
      try {
        await createBookingInFirestore(newJob);
      } catch (err) {
        console.error('Failed to create booking in Firestore:', err);
      }
    }

    clearCart();
    setActiveTrackingJobId(jobId);
    setIsBookingModalOpen(false);
    setIsTrackingModalOpen(true);
    return newJob;
  };

  // 2. Update Job Status
  const updateJobStatus = async (jobId: string, status: JobStatus, note = '', actor = 'Staff') => {
    const now = new Date().toISOString();
    const targetJob = jobs.find((j) => j.id === jobId);

    if (isDemoMode || !targetJob) {
      setDemoJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            status,
            statusHistory: [
              ...j.statusHistory,
              {
                status,
                timestamp: now,
                note: note || `Status updated to ${status}`,
                actor,
              },
            ],
          };
        })
      );
    } else {
      // Optimistic live update
      setLiveJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            status,
            statusHistory: [
              ...j.statusHistory,
              {
                status,
                timestamp: now,
                note: note || `Status updated to ${status}`,
                actor,
              },
            ],
          };
        })
      );
      try {
        await updateJobStatusInFirestore(jobId, status, note, actor, targetJob);
      } catch (err) {
        console.error('Error updating status in Firestore:', err);
      }
    }
  };

  // 3. Assign Technician (Admin Dispatch)
  const assignTechnician = async (jobId: string, techId: string) => {
    const tech = technicians.find((t) => t.id === techId);
    const techName = tech ? tech.name : techId;
    const now = new Date().toISOString();
    const targetJob = jobs.find((j) => j.id === jobId);

    if (isDemoMode || !targetJob) {
      setDemoJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            assignedTechId: techId,
            status: 'Assigned',
            statusHistory: [
              ...j.statusHistory,
              {
                status: 'Assigned',
                timestamp: now,
                note: `Assigned to ${techName} (${techId})`,
                actor: 'Dispatcher',
              },
            ],
          };
        })
      );
    } else {
      // Optimistic update
      setLiveJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            assignedTechId: techId,
            status: 'Assigned',
            statusHistory: [
              ...j.statusHistory,
              {
                status: 'Assigned',
                timestamp: now,
                note: `Assigned to ${techName} (${techId})`,
                actor: 'Dispatcher',
              },
            ],
          };
        })
      );
      try {
        await assignTechnicianInFirestore(jobId, techId, techName, targetJob);
      } catch (err) {
        console.error('Error assigning technician in Firestore:', err);
      }
    }
  };

  // 4. Request Onsite Add-On (Technician)
  const requestAddOn = async (jobId: string, description: string, amount: number) => {
    const now = new Date().toISOString();
    const addOnId = `addon-${Date.now()}`;
    const targetJob = jobs.find((j) => j.id === jobId);

    if (isDemoMode || !targetJob) {
      setDemoJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            addOns: [
              ...j.addOns,
              {
                id: addOnId,
                description,
                amount,
                status: 'pending',
                requestedAt: now,
              },
            ],
            statusHistory: [
              ...j.statusHistory,
              {
                status: j.status,
                timestamp: now,
                note: `Technician proposed onsite add-on: ${description} (₹${amount}). Awaiting customer approval.`,
                actor: 'Technician',
              },
            ],
          };
        })
      );
    } else {
      // Optimistic update
      setLiveJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            addOns: [
              ...j.addOns,
              {
                id: addOnId,
                description,
                amount,
                status: 'pending',
                requestedAt: now,
              },
            ],
            statusHistory: [
              ...j.statusHistory,
              {
                status: j.status,
                timestamp: now,
                note: `Technician proposed onsite add-on: ${description} (₹${amount}). Awaiting customer approval.`,
                actor: 'Technician',
              },
            ],
          };
        })
      );
      try {
        await requestAddOnInFirestore(jobId, description, amount, targetJob);
      } catch (err) {
        console.error('Error proposing add-on in Firestore:', err);
      }
    }
  };

  // 5. Customer Responds to Add-On
  const respondToAddOn = async (jobId: string, addOnId: string, approved: boolean) => {
    const now = new Date().toISOString();
    const targetJob = jobs.find((j) => j.id === jobId);

    const updateJobData = (j: Job): Job => {
      const addOn = j.addOns.find((a) => a.id === addOnId);
      if (!addOn) return j;

      const updatedAddOns = j.addOns.map((a) =>
        a.id === addOnId
          ? { ...a, status: (approved ? 'approved' : 'declined') as 'approved' | 'declined', approvedAt: now }
          : a
      );

      const newFinalTotal =
        j.baseTotal +
        updatedAddOns
          .filter((a) => a.status === 'approved')
          .reduce((sum, a) => sum + a.amount, 0) +
        j.travelCharge;

      return {
        ...j,
        addOns: updatedAddOns,
        finalTotal: newFinalTotal,
        technicianPayout: approved ? j.technicianPayout + Math.round(addOn.amount * 0.4) : j.technicianPayout,
        platformMargin: approved ? j.platformMargin + Math.round(addOn.amount * 0.6) : j.platformMargin,
        statusHistory: [
          ...j.statusHistory,
          {
            status: j.status,
            timestamp: now,
            note: approved
              ? `Customer APPROVED add-on: ${addOn.description} (+₹${addOn.amount}). Updated total: ₹${newFinalTotal}.`
              : `Customer DECLINED add-on: ${addOn.description}.`,
            actor: 'Customer',
          },
        ],
      };
    };

    if (isDemoMode || !targetJob) {
      setDemoJobs((prev) => prev.map((j) => (j.id === jobId ? updateJobData(j) : j)));
    } else {
      setLiveJobs((prev) => prev.map((j) => (j.id === jobId ? updateJobData(j) : j)));
      try {
        await respondToAddOnInFirestore(jobId, addOnId, approved, targetJob);
      } catch (err) {
        console.error('Error responding to add-on in Firestore:', err);
      }
    }
  };

  // 6. Complete Job (Technician)
  const completeJob = async (jobId: string, notes = '', photos: string[] = []) => {
    const now = new Date().toISOString();
    const targetJob = jobs.find((j) => j.id === jobId);
    const photoList =
      photos.length > 0
        ? photos
        : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60'];

    if (isDemoMode || !targetJob) {
      setDemoJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            status: 'Work Completed',
            completionPhotoUrls: photoList,
            statusHistory: [
              ...j.statusHistory,
              {
                status: 'Work Completed',
                timestamp: now,
                note: notes || 'Assembly and installation finished. Verified with customer sign-off.',
                actor: 'Technician',
              },
            ],
          };
        })
      );
    } else {
      setLiveJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            status: 'Work Completed',
            completionPhotoUrls: photoList,
            statusHistory: [
              ...j.statusHistory,
              {
                status: 'Work Completed',
                timestamp: now,
                note: notes || 'Assembly and installation finished. Verified with customer sign-off.',
                actor: 'Technician',
              },
            ],
          };
        })
      );
      try {
        await completeJobInFirestore(jobId, notes, photoList, targetJob);
      } catch (err) {
        console.error('Error marking completed in Firestore:', err);
      }
    }
  };

  // 7. Record Payment (Cash or UPI)
  const recordPayment = async (jobId: string, method: 'Cash' | 'UPI', reference = '') => {
    const now = new Date().toISOString();
    const targetJob = jobs.find((j) => j.id === jobId);
    const ref =
      reference ||
      `${method}/${new Date().toISOString().slice(2, 10).replace(/-/g, '')}/${Math.floor(
        100000 + Math.random() * 900000
      )}`;

    if (isDemoMode || !targetJob) {
      setDemoJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            status: 'Paid',
            paymentStatus: 'Paid',
            paymentMethod: method,
            paymentReference: ref,
            statusHistory: [
              ...j.statusHistory,
              {
                status: 'Paid',
                timestamp: now,
                note: `Payment of ₹${j.finalTotal} collected via ${method} (${ref}). Receipt generated.`,
                actor: 'System',
              },
            ],
          };
        })
      );
    } else {
      setLiveJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            status: 'Paid',
            paymentStatus: 'Paid',
            paymentMethod: method,
            paymentReference: ref,
            statusHistory: [
              ...j.statusHistory,
              {
                status: 'Paid',
                timestamp: now,
                note: `Payment of ₹${j.finalTotal} collected via ${method} (${ref}). Receipt generated.`,
                actor: 'System',
              },
            ],
          };
        })
      );
      try {
        await recordPaymentInFirestore(jobId, method, ref, targetJob, role === 'technician' ? selectedTechId : 'Staff');
      } catch (err) {
        console.error('Error recording payment in Firestore:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // KPIS CALCULATIONS (EXACT 8 METRICS FROM BUSINESS CHECKLIST)
  // -------------------------------------------------------------
  const kpis = {
    todaysJobs: jobs.filter((j) => j.appointmentDate === new Date().toISOString().slice(0, 10)).length,
    newLeads: jobs.filter((j) => j.status === 'New').length,
    pendingJobs: jobs.filter((j) => ['Scheduled', 'Assigned', 'Accepted', 'In Progress'].includes(j.status)).length,
    revenueReceived: jobs.filter((j) => j.paymentStatus === 'Paid').reduce((sum, j) => sum + j.finalTotal, 0),
    outstanding: jobs
      .filter((j) => j.paymentStatus === 'Pending' && j.status !== 'Cancelled')
      .reduce((sum, j) => sum + j.finalTotal, 0),
    payoutDue: jobs
      .filter((j) => j.paymentStatus === 'Paid' && j.status !== 'Settled')
      .reduce((sum, j) => sum + j.technicianPayout, 0),
    expenses: 1250,
    netCash: jobs.filter((j) => j.paymentStatus === 'Paid').reduce((sum, j) => sum + j.finalTotal, 0) - 1250,
  };

  return (
    <AppContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        role,
        setRole,
        selectedTechId,
        setSelectedTechId,
        currentUser,
        firebaseUser,
        isAuthLoading,
        signInWithGoogle,
        signOutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTargetRole,
        setAuthModalTargetRole,
        switchDemoRole,
        jobs,
        technicians,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        selectedZone,
        setSelectedZone,
        createBooking,
        updateJobStatus,
        assignTechnician,
        requestAddOn,
        respondToAddOn,
        completeJob,
        recordPayment,
        isBookingModalOpen,
        setIsBookingModalOpen,
        isTrackingModalOpen,
        setIsTrackingModalOpen,
        activeTrackingJobId,
        setActiveTrackingJobId,
        isChatDrawerOpen,
        setIsChatDrawerOpen,
        kpis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
