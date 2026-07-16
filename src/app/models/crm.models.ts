export type AuthResponse = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
};

export type DashboardSummary = {
  leads?: number;
  customers?: number;
  projects?: number;
  invoices?: number;
  unpaidInvoices?: number;
  pendingPayments?: number;
  approvedPayments?: number;
  totalCollection?: number;
  pendingCommission?: number;
  paidCommission?: number;
};

export type UserSummary = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
};

export type SalesExecutive = Pick<UserSummary, 'id' | 'fullName' | 'email' | 'phone'>;

export type Lead = {
  id: number;
  customerName: string;
  phone: string;
  email?: string;
  source: number;
  priority: number;
  status: number;
  assignedToId?: number;
  assignedToName?: string;
  nextFollowUpAt?: string;
};

export type CreateLeadRequest = {
  customerName: string;
  phone: string;
  alternativePhone?: string | null;
  email?: string | null;
  address?: string | null;
  budgetRange?: string | null;
  preferredLocation?: string | null;
  interestedProject?: string | null;
  source: number;
  priority: number;
  assignedToId: number | null;
  remarks?: string | null;
};

export type CreateSalesExecutiveRequest = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export type Customer = {
  id: number;
  leadId?: number;
  name: string;
  phone: string;
  email?: string;
  paymentStatus: string;
  salesExecutive?: string;
};

export type CreateCustomerRequest = {
  leadId: number;
  name?: string | null;
  phone?: string | null;
  alternativePhone?: string | null;
  email?: string | null;
  address?: string | null;
  occupation?: string | null;
  nidOrPassport?: string | null;
  nomineeName?: string | null;
  nomineePhone?: string | null;
};

export type Project = {
  id: number;
  name: string;
  subGroupId: number;
  subGroup: string;
  companyName: string;
  type: number;
  location: string;
  status: number;
};

export type SubGroup = {
  id: number;
  name: string;
  companyName: string;
  description?: string | null;
  projectCount: number;
};

export type CreateSubGroupRequest = {
  name: string;
  description?: string | null;
};

export type CreateProjectRequest = {
  name: string;
  subGroupId: number;
  type: number;
  location: string;
  address?: string | null;
  description?: string | null;
  status: number;
};

export type Invoice = {
  id: number;
  invoiceNumber: string;
  customer: string;
  salesExecutive: string;
  finalAmount: number;
  status: number;
  dueDate: string;
};

export type Payment = {
  id: number;
  customer: string;
  invoiceNumber: string;
  salesExecutive: string;
  amount: number;
  method: number;
  status: number;
  proofUrl?: string;
  rejectReason?: string;
};

export type FollowUpProof = {
  proofType: number;
  fileUrl: string;
};

export type FollowUp = {
  id: number;
  lead: string;
  salesExecutive: string;
  type: number;
  summary: string;
  customerResponse?: string;
  nextFollowUpAt?: string;
  proofs: FollowUpProof[];
};

export type Commission = {
  id: number;
  salesExecutive: string;
  paymentId: number;
  paymentAmount: number;
  percentage: number;
  amount: number;
  status: number;
  createdAt: string;
};

export type ReportGroup = {
  status?: number;
  source?: number;
  count: number;
  amount?: number;
};

export type ReportSummary = {
  leadStatus: ReportGroup[];
  leadSource: ReportGroup[];
  paymentStatus: ReportGroup[];
  invoiceStatus: ReportGroup[];
};

export type VehicleBooking = {
  id: number;
  salesExecutiveId: number;
  salesExecutive: string;
  customerId: number; customer: string; customerPhone: string;
  projectId: number; project: string;
  visitDate: string;
  visitTime: string;
  personCount: number;
  visitPlace: string;
  pickupPlace: string;
  purpose: string; additionalInformation?: string | null;
  vehicleId?: number | null; vehicle?: string | null; driver?: string | null;
  status: number;
  adminRemarks?: string | null;
  createdAt: string;
};

export type Vehicle = { id: number; registrationNumber: string; vehicleType: string; brand: string; model: string; color?: string; seatingCapacity: number; isActive: boolean; };
