import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, JobStatus, RateCardItem, Technician, ServiceZone } from '../types';
import { INITIAL_SAMPLE_JOBS, TECHNICIANS_DATA, MMR_ZONES } from '../data/rateCard';

interface CartItem {
  item: RateCardItem;
  quantity: number;
}

interface AppContextType {
  role: 'customer' | 'technician' | 'admin';
  setRole: (role: 'customer' | 'technician' | 'admin') => void;
  selectedTechId: string;
  setSelectedTechId: (id: string) => void;
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
  createBooking: (data: Omit<Job, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'addOns'>) => Job;
  updateJobStatus: (jobId: string, status: JobStatus, note?: string, actor?: string) => void;
  assignTechnician: (jobId: string, techId: string) => void;
  requestAddOn: (jobId: string, description: string, amount: number) => void;
  respondToAddOn: (jobId: string, addOnId: string, approved: boolean) => void;
  completeJob: (jobId: string, notes?: string, photos?: string[]) => void;
  recordPayment: (jobId: string, method: 'Cash' | 'UPI', reference?: string) => void;
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  isTrackingModalOpen: boolean;
  setIsTrackingModalOpen: (open: boolean) => void;
  activeTrackingJobId: string | null;
  setActiveTrackingJobId: (id: string | null) => void;
  isChatDrawerOpen: boolean;
  setIsChatDrawerOpen: (open: boolean) => void;
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
  const [role, setRole] = useState<'customer' | 'technician' | 'admin'>('customer');
  const [selectedTechId, setSelectedTechId] = useState<string>('TECH-001');

  // Persistence for jobs
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem('furniture_fix_jobs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SAMPLE_JOBS;
  });

  const [technicians, setTechnicians] = useState<Technician[]>(TECHNICIANS_DATA);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(MMR_ZONES[0]);

  // Modal controls
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [activeTrackingJobId, setActiveTrackingJobId] = useState<string | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Save jobs on changes
  useEffect(() => {
    try {
      localStorage.setItem('furniture_fix_jobs_v1', JSON.stringify(jobs));
    } catch (e) {
      console.error(e);
    }
  }, [jobs]);

  // Update technicians active job count
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

  // Cart actions
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

  // Create new booking
  const createBooking = (data: Omit<Job, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'addOns'>): Job => {
    const nextNum = 4289 + jobs.length;
    const jobId = `FF-26-0${nextNum}`;
    const now = new Date().toISOString();

    const newJob: Job = {
      ...data,
      id: jobId,
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

    setJobs((prev) => [newJob, ...prev]);
    clearCart();
    setActiveTrackingJobId(jobId);
    setIsBookingModalOpen(false);
    setIsTrackingModalOpen(true);
    return newJob;
  };

  // Status transitions
  const updateJobStatus = (jobId: string, status: JobStatus, note = '', actor = 'Staff') => {
    const now = new Date().toISOString();
    setJobs((prev) =>
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
  };

  // Assign Technician
  const assignTechnician = (jobId: string, techId: string) => {
    const tech = technicians.find((t) => t.id === techId);
    const techName = tech ? tech.name : techId;
    const now = new Date().toISOString();

    setJobs((prev) =>
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
  };

  // Add-on request by technician
  const requestAddOn = (jobId: string, description: string, amount: number) => {
    const now = new Date().toISOString();
    const addOnId = `addon-${Date.now()}`;

    setJobs((prev) =>
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
  };

  // Customer responds to add-on
  const respondToAddOn = (jobId: string, addOnId: string, approved: boolean) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
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
      })
    );
  };

  // Complete job
  const completeJob = (jobId: string, notes = '', photos: string[] = []) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          status: 'Work Completed',
          completionPhotoUrls: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60'],
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
  };

  // Record payment
  const recordPayment = (jobId: string, method: 'Cash' | 'UPI', reference = '') => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          status: 'Paid',
          paymentStatus: 'Paid',
          paymentMethod: method,
          paymentReference: reference || `${method}/${new Date().toISOString().slice(2, 10).replace(/-/g, '')}/${Math.floor(100000 + Math.random() * 900000)}`,
          statusHistory: [
            ...j.statusHistory,
            {
              status: 'Paid',
              timestamp: now,
              note: `Payment of ₹${j.finalTotal} collected via ${method} (${reference || 'Verified'}). Receipt generated.`,
              actor: 'System',
            },
          ],
        };
      })
    );
  };

  // 8 Metric summary from Owner Checklist
  const kpis = {
    todaysJobs: jobs.filter((j) => j.appointmentDate === new Date().toISOString().slice(0, 10)).length,
    newLeads: jobs.filter((j) => j.status === 'New').length,
    pendingJobs: jobs.filter((j) => ['Scheduled', 'Assigned', 'Accepted', 'In Progress'].includes(j.status)).length,
    revenueReceived: jobs.filter((j) => j.paymentStatus === 'Paid').reduce((sum, j) => sum + j.finalTotal, 0),
    outstanding: jobs.filter((j) => j.paymentStatus === 'Pending' && j.status !== 'Cancelled').reduce((sum, j) => sum + j.finalTotal, 0),
    payoutDue: jobs.filter((j) => j.paymentStatus === 'Paid' && j.status !== 'Settled').reduce((sum, j) => sum + j.technicianPayout, 0),
    expenses: 1250, // Recorded hosting, transport & consumables base
    netCash: jobs.filter((j) => j.paymentStatus === 'Paid').reduce((sum, j) => sum + j.finalTotal, 0) - 1250,
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        selectedTechId,
        setSelectedTechId,
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
