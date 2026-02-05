
import { Employee, DeductionCode, DeductionRecord, IncentiveTier, AppConfig } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '65020007',
    prefix: 'นาย',
    firstName: 'ประกอบ',
    lastName: 'นรินทร์นอก',
    position: 'Forklift Driver',
    department: 'Warehouse 1',
    score: 100,
    baseSalary: 12000,
    positionAllowance: 0,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=65020007',
    signatureUrl: '',
    pendingDeductionPoints: 0,
    password: '' // ใช้ ID เป็นรหัสผ่าน
  },
  {
    id: '58044306',
    prefix: 'นาย',
    firstName: 'สถาพร',
    lastName: 'ช้างสาร',
    position: 'Forklift Driver',
    department: 'Warehouse 1',
    score: 85,
    baseSalary: 0,
    positionAllowance: 1500,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=58044306',
    signatureUrl: '',
    pendingDeductionPoints: 0,
    password: '' // เพิ่มเพื่อให้โครงสร้างข้อมูลเหมือนกัน
  },
  {
      id: '60070027',
      prefix: 'นาย',
      firstName: 'ชญานนท์',
      lastName: 'คำทองเที่ยง',
      position: 'Forklift Driver',
      department: 'Warehouse 1',
      score: 95,
      baseSalary: 0,
      positionAllowance: 1500,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=60070027',
      signatureUrl: '',
      pendingDeductionPoints: 0,
      password: '' // เพิ่มเพื่อให้โครงสร้างข้อมูลเหมือนกัน
  },
  {
      id: '61020006',
      prefix: 'นาย',
      firstName: 'ลิขิต',
      lastName: 'อุ่นดวง',
      position: 'Forklift Driver',
      department: 'Warehouse 1',
      score: 100,
      baseSalary: 12000,
      positionAllowance: 0,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=61020006',
      signatureUrl: '',
      pendingDeductionPoints: 0,
      password: '' // เพิ่มเพื่อให้โครงสร้างข้อมูลเหมือนกัน
  }
];

export const INITIAL_CONFIG: AppConfig = {
    logoUrl: null,
    masterSignatures: {
        supervisor: null,
        asstManager: null,
        srManager: null,
        hrManager: null,
        evpHr: null
    }
};

// Updated with CSV Data from user prompt
export const INITIAL_DEDUCTION_CODES: DeductionCode[] = [
  { id: 'D-1770100953029', code: 'M-001', category: 'ทั่วไป', description: 'ตัวอย่าง001', points: 5 },
  { id: 'D-1770109052648', code: 'A002', category: 'ทั่วไป', description: 'หัวข้อการหักคะแนน', points: 30 },
  { id: 'D-1770109424477', code: '111', category: 'ทั่วไป', description: '111', points: 51 },
  { id: 'D-1770109811218', code: '1212', category: 'ทั่วไป', description: '12', points: 5 },
  { id: 'D-1770109977766', code: '666', category: 'ทั่วไป', description: '666', points: 6 }
];

export const INITIAL_RECORDS: DeductionRecord[] = [
    {
        id: 'REC-MOCK-1',
        employeeId: '58044306',
        deductionCodeId: 'D-001',
        deductionCodeCode: 'SAFE01',
        deductionDescription: 'ไม่สวมหมวกนิรภัยขณะปฏิบัติงาน',
        date: new Date().toISOString().split('T')[0], // วันนี้
        points: 10,
        fineAmount: 0,
        remark: 'เตือนครั้งที่ 1',
        carriedOverPoints: 0
    },
    {
        id: 'REC-MOCK-2',
        employeeId: '58044306',
        deductionCodeId: 'D-002',
        deductionCodeCode: 'OPS01',
        deductionDescription: 'วางสินค้าไม่ตรงตามพื้นที่กำหนด (5ส)',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // เมื่อวาน
        points: 5,
        fineAmount: 0,
        remark: '',
        carriedOverPoints: 0
    },
    {
        id: 'REC-MOCK-3',
        employeeId: '60070027',
        deductionCodeId: 'D-003',
        deductionCodeCode: 'TIME01',
        deductionDescription: 'มาสายเกิน 15 นาทีโดยไม่แจ้งล่วงหน้า',
        date: new Date().toISOString().split('T')[0],
        points: 5,
        fineAmount: 0,
        remark: 'แจ้งด้วยวาจาแล้ว',
        carriedOverPoints: 0
    }
];

export const INITIAL_INCENTIVE_TIERS: IncentiveTier[] = [
  { id: 'T-001', name: 'เกรด A', minScore: 90, maxScore: 100, amount: 2000 },
  { id: 'T-002', name: 'เกรด B', minScore: 80, maxScore: 89, amount: 1500 },
  { id: 'T-003', name: 'เกรด C', minScore: 70, maxScore: 79, amount: 1000 },
  { id: 'T-004', name: 'เกรด D', minScore: 0, maxScore: 69, amount: 0 }
];
