export type ServiceCategory =
  | 'Chairs & Tables'
  | 'Beds & Mattresses'
  | 'Wardrobes & Storage'
  | 'Living & Media'
  | 'Mounting & Wall Installation'
  | 'Repairs, Fittings & Relocation'
  | 'Fitness & Misc';

export interface RateCardItem {
  id: string;
  category: ServiceCategory;
  name: string;
  customerPrice: number;
  priceType: 'fixed' | 'from' | 'quote';
  technicianPayoutBand: 'XS' | 'Standard' | 'Medium' | 'Large' | 'XL' | 'XXL' | 'Cycle' | 'Treadmill' | 'Visit';
  technicianPayoutAmount: number;
  includedScope: string;
  notes?: string;
  popular?: boolean;
}

export type JobStatus =
  | 'New'
  | 'Scheduled'
  | 'Assigned'
  | 'Accepted'
  | 'En Route'
  | 'In Progress'
  | 'Work Completed'
  | 'Customer Confirmed'
  | 'Paid'
  | 'Settled'
  | 'Cancelled';

export interface JobItem {
  serviceId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface JobAddOn {
  id: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  approvedAt?: string;
}

export interface Job {
  id: string; // e.g., "FF-26-04287"
  customerId?: string; // Auth UID or client token
  customer: {
    name: string;
    mobile: string;
    email?: string;
    address: string;
    locality: string;
    pincode: string;
  };
  items: JobItem[];
  addOns: JobAddOn[];
  status: JobStatus;
  statusHistory: Array<{
    status: JobStatus;
    timestamp: string;
    note: string;
    actor: string;
  }>;
  assignedTechId?: string;
  appointmentDate: string;
  appointmentSlot: string; // e.g. "10:00 AM – 12:00 PM"
  description?: string;
  customerPhotoUrl?: string;
  completionPhotoUrls?: string[];
  travelCharge: number;
  baseTotal: number;
  finalTotal: number;
  paymentMethod?: 'Cash' | 'UPI';
  paymentStatus: 'Pending' | 'Paid';
  paymentReference?: string;
  technicianPayout: number;
  platformMargin: number;
  createdAt: string;
}

export interface Technician {
  id: string; // e.g. "TECH-001"
  name: string;
  role: string;
  phone: string;
  email?: string;
  baseLocality: string;
  skills: string[];
  activeJobsCount: number;
  rating: number;
  totalEarnings: number;
  status: 'Available' | 'On Job' | 'Offline';
}

export interface ServiceZone {
  name: string;
  pincode: string;
  zone: string;
  lat: number;
  lng: number;
  distanceKm: number;
  travelCharge: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  groundingLinks?: Array<{ title: string; uri: string }>;
  suggestedAction?: {
    type: 'add_quote' | 'view_area' | 'book_now';
    label: string;
    payload?: any;
  };
}

export interface CommissionEntry {
  id: string;
  jobId: string;
  timestamp: string;
  customerAmount: number;
  techPayout: number;
  platformCommission: number;
  taxTcsReserve: number;
  status: 'Pending' | 'Reconciled' | 'Settled';
}

export type UserRole = 'customer' | 'technician' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  technicianId?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  userEmail?: string;
  details: string;
  timestamp: string;
}
