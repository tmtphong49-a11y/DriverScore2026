
export interface Employee {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  score: number;
  baseSalary: number;
  positionAllowance: number;
  avatarUrl: string;
  signatureUrl?: string;
  noPositionAllowance?: boolean;
  pendingDeductionPoints?: number;
  password?: string;
}

export interface MasterSignatures {
    supervisor: string | null;
    asstManager: string | null;
    srManager: string | null;
    hrManager: string | null;
    evpHr: string | null;
}

export interface AppConfig {
    logoUrl: string | null;
    masterSignatures: MasterSignatures;
}

export interface DeductionCode {
  id: string;
  code: string;
  category: string;
  description: string;
  points: number;
}

export interface DeductionRecord {
  id: string;
  employeeId: string;
  deductionCodeId: string;
  deductionCodeCode: string;
  deductionDescription: string;
  date: string;
  points: number;
  fineAmount: number;
  remark: string;
  carriedOverPoints?: number;
}

export interface IncentiveTier {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  amount: number;
}

export interface UserSession {
  role: 'admin' | 'employee';
  employeeId?: string;
  name: string;
}
