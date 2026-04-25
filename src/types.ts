export type UserRole = 'employee' | 'admin' | 'chief' | 'sysadmin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  phoneNumber?: string;
  photoURL?: string;
  profileCompleted?: boolean;
  isApproved?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export type RequestStatus = 'pending' | 'admin_approved' | 'approved' | 'rejected';

export interface DTRCorrectionRequest {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requesterName: string;
  requesterPhotoURL?: string;
  date: any;
  correctionType: 'in' | 'out' | 'both';
  requestedTime?: string;
  requestedTimeIn?: string;
  requestedTimeOut?: string;
  reason: string;
  status: RequestStatus;
  adminId?: string;
  chiefId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface LeaveApplication {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requesterName: string;
  requesterPhotoURL?: string;
  startDate: any;
  endDate: any;
  leaveType: string;
  reason: string;
  status: RequestStatus;
  adminId?: string;
  chiefId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  date: any;
  timeIn: any;
  timeOut?: any;
}

export interface ExchangeRequest {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requesterName: string;
  requesterPhotoURL?: string;
  exchangeWithId: string;
  exchangeWithName: string;
  originalDate: any;
  exchangeDate: any;
  reason: string;
  status: RequestStatus;
  adminId?: string;
  chiefId?: string;
  createdAt: any;
  updatedAt: any;
}
