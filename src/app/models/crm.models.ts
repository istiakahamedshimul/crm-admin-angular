export type AuthResponse = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  permissions?: string[];
};

export type DashboardSummary = {
  leads?: number;
  customers?: number;
  projects?: number;
  pendingPayments?: number;
  approvedPayments?: number;
  totalCollection?: number;
  pendingCollection?: number;
  collectionCount?: number;
  totalCommission?: number;
  totalCollectible?: number;
  totalCollected?: number;
  totalOutstanding?: number;
  totalDue?: number;
  totalOverdue?: number;
  salesTargetProgress?: { month: string; unitTarget: number; unitsCompleted: number; unitVariance: number; collectionTarget: number; collectionCompleted: number; collectionVariance: number };
};

export type UserSummary = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  designation?: string | null;
  role: string;
  isActive: boolean;
};

export type SalesExecutive = Pick<UserSummary, 'id' | 'fullName' | 'email' | 'phone'>;

export type Lead = {
  id: number;
  customerName: string;
  phone: string;
  alternativePhone?: string | null;
  email?: string;
  address?: string | null;
  budgetRange?: string | null;
  preferredLocation?: string | null;
  source: number;
  referrerName?: string | null;
  referrerPhone?: string | null;
  referrerEmail?: string | null;
  previousCustomerId?: number | null;
  status: number;
  assignedToId?: number;
  assignedToName?: string;
  projectId?: number;
  projectName?: string;
  projectType?: number;
  nextFollowUpAt?: string;
  remarks?: string | null;
  assignedAt?: string | null;
  createdAt: string;
};

export type LeadAutomationSettings = {
  unassignAfterHours: number;
  reminderIntervalHours: number;
};

export type ReturnedLead = {
  id: number;
  leadId: number;
  customerName: string;
  phone: string;
  salesExecutive: string;
  assignedAt: string;
  returnedAt: string;
  notificationCount: number;
  currentStatus: number;
  currentAssignedTo?: string | null;
};

export type CreateLeadRequest = {
  customerId?: number | null;
  customerName: string;
  phone: string;
  alternativePhone?: string | null;
  email?: string | null;
  address?: string | null;
  budgetRange?: string | null;
  preferredLocation?: string | null;
  projectId?: number | null;
  source: number;
  assignedToId: number | null;
  remarks?: string | null;
  referrerName?: string | null;
  referrerPhone?: string | null;
  referrerEmail?: string | null;
};

export type AvailableLeadCustomer = Pick<Customer, 'id' | 'name' | 'phone' | 'email'> & {
  alternativePhone?: string | null;
  address?: string | null;
  projectId?: number | null;
  assignedToId?: number | null;
  assignedToName?: string | null;
};

export type CreateSalesExecutiveRequest = {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  password: string;
};

export type UpdateSalesExecutiveRequest = {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  isActive: boolean;
  password?: string | null;
  minimumSalesUnits: number;
  minimumCollectionAmount: number;
  targetMonth?: string | null;
};

export type TargetProgress = {
  month: string;
  salesUnitTarget: number;
  salesUnitsAchieved: number;
  salesUnitVariance: number;
  collectionTarget: number;
  collectionAchieved: number;
  collectionVariance: number;
};

export type SalesPerformanceMonth = {
  month: string; wins: number; lost: number; statusCounts: Record<string, number>;
  unitTarget: number; unitsAchieved: number; unitVariance: number;
  collectionTarget: number; collectionAchieved: number; collectionVariance: number; commission: number;
};

export type SalesPerformanceReport = {
  employee: { fullName: string; email: string };
  from: string; to: string; generatedAt: string; assignedLeads: number; returnedLeads: number;
  assignedStage: number; followingUp: number; bookedClients: number; lost: number; notInterested: number;
  totalCollection: number; collectionCount: number; totalCommission: number; months: SalesPerformanceMonth[];
};

export type SalesExecutiveDetail = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  currentTarget: TargetProgress;
  targetHistory: TargetProgress[];
  metrics: {
    totalAssignedLeads: number;
    returnedLeads: number;
    assignedStage: number;
    followingUp: number;
    positiveCustomers: number;
    lost: number;
    notInterested: number;
    approvedCollectionCount: number;
    approvedCollectionAmount: number;
    commission: number;
  };
  recentLeads: Array<{
    id: number;
    customerName: string;
    phone: string;
    status: number;
    projectId?: number | null;
    project?: string | null;
    nextFollowUpAt?: string | null;
    createdAt: string;
  }>;
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
  leadId?: number | null;
  name: string;
  phone: string;
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

export type Payment = {
  id: number;
  customer: string;
  collectionNumber: string;
  salesExecutive: string;
  amount: number;
  paymentDate: string;
  method: number;
  status: number;
  isReversed: boolean;
  reversalReason?: string;
  proofUrl?: string;
  rejectReason?: string;
  createdAt: string;
};

export type FollowUpProof = {
  proofType: number;
  fileUrl: string;
};

export type FollowUp = {
  id: number;
  leadId: number;
  customerId?: number;
  customer: string;
  lead: string;
  salesExecutive: string;
  type: number;
  resultingStatus?: number | null;
  summary: string;
  nextFollowUpAt?: string;
  createdAt: string;
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
  vehicleId?: number | null; vehicle?: string | null; driver?: string | null; driverPhone?: string | null;
  status: number;
  adminRemarks?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
};

export type Vehicle = { id: number; registrationNumber: string; vehicleType: string; brand: string; model: string; color?: string; seatingCapacity: number; isActive: boolean; };

export type LocationPoint = { latitude: number; longitude: number; accuracyMeters: number; speedMetersPerSecond?: number | null; isMocked: boolean; recordedAtUtc: string; };
export type LiveEmployeeLocation = {
  employeeId: number; fullName: string; phone: string; isOnline: boolean; hasLocation: boolean;
  trackingEnabled: boolean; trackingChangedAtUtc?: string | null;
  latitude?: number | null; longitude?: number | null; accuracyMeters?: number | null;
  speedMetersPerSecond?: number | null; isMocked: boolean; recordedAtUtc?: string | null;
};
export type TravelHistory = {
  employee: { id: number; fullName: string; phone: string };
  date: string;
  points: LocationPoint[];
  summary: { pointCount: number; distanceKm: number; startedAtUtc?: string | null; endedAtUtc?: string | null };
};
