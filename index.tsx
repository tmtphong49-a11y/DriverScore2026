
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  Menu, 
  ChevronRight, 
  Users, 
  BarChart2, 
  List, 
  Settings, 
  LogOut, 
  RefreshCw, 
  UploadCloud, 
  WifiOff,
  CheckCircle2,
  X,
  LayoutDashboard,
  ClipboardCheck
} from 'lucide-react';

import { Employee, DeductionCode, DeductionRecord, IncentiveTier, UserSession, AppConfig } from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_DEDUCTION_CODES, 
  INITIAL_RECORDS, 
  INITIAL_INCENTIVE_TIERS, 
  INITIAL_CONFIG 
} from './data';

import { RecordDeductionView } from './views/RecordDeductionView';
import { EmployeeListView } from './views/EmployeeListView';
import { DeductionCodeListView } from './views/DeductionCodeListView';
import { IncentiveSettingsView } from './views/IncentiveSettingsView';
import { FinanceView } from './views/FinanceView';
import { LoginView } from './views/LoginView';
import { EmployeePortalView } from './views/EmployeePortalView';
import { DashboardView } from './views/DashboardView';
import { MonthlyReportView } from './views/MonthlyReportView';

const API_URL = 'https://script.google.com/macros/s/AKfycbweIktVpIc-LxBZNABAmAjcXTiZ03DHElabkAk6mvCQcfSBP_lQmG8WSuJLh41dRzzO/exec';
const PRESERVE_ID = 'PRESERVE_HEADER';

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

// Custom Modal Component to replace native confirm/alert
const CustomModal = ({ isOpen, title, message, type, onConfirm, onClose, isLoading }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            type === 'success' ? 'bg-green-100 text-green-600' : 
            type === 'error' ? 'bg-red-100 text-red-600' : 
            'bg-orange-100 text-orange-600'
          }`}>
             {type === 'success' ? <CheckCircle2 size={32} /> : 
              type === 'error' ? <X size={32} /> : 
              <AlertTriangle size={32} />}
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm mb-6 whitespace-pre-line leading-relaxed">{message}</p>
          
          <div className="flex gap-3">
            {onConfirm && (
              <button 
                onClick={onClose} 
                disabled={isLoading}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                ยกเลิก
              </button>
            )}
            <button 
              onClick={onConfirm ? onConfirm : onClose}
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl text-white font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                 type === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                 type === 'error' ? 'bg-red-600 hover:bg-red-700' : 
                 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading && <RefreshCw size={16} className="animate-spin" />}
              {onConfirm ? (isLoading ? 'กำลังบันทึก...' : 'ยืนยัน') : 'ตกลง'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [deductionCodes, setDeductionCodes] = useState<DeductionCode[]>(INITIAL_DEDUCTION_CODES);
  const [deductionRecords, setDeductionRecords] = useState<DeductionRecord[]>(INITIAL_RECORDS);
  const [incentiveTiers, setIncentiveTiers] = useState<IncentiveTier[]>(INITIAL_INCENTIVE_TIERS);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert' | 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '' });

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      // 1. Process Deduction Records First
      let fetchedRecords: DeductionRecord[] = [];
      if (data.records) {
         fetchedRecords = data.records.filter((r: any) => r.id !== PRESERVE_ID);
         setDeductionRecords(fetchedRecords);
      }

      // 2. Calculate Current Month String (Local Time)
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // 3. Process Employees & Recalculate Score for Current Month
      if (data.employees) {
          const sanitizedEmployees = data.employees
              .filter((e: any) => e.id !== PRESERVE_ID)
              .map((e: any) => {
                // AUTO-RESET LOGIC:
                // We calculate the score dynamically based on the current month's records.
                // This ignores the 'score' value stored in the Google Sheet if it belongs to a past month.
                // The new score will be written back to the sheet when the user clicks "Save".
                const empMonthRecords = fetchedRecords.filter(r => 
                    String(r.employeeId).trim() === String(e.id).trim() && 
                    r.date.startsWith(currentMonth)
                );
                
                // Calculate total deductions for THIS month only
                const currentMonthDeductions = empMonthRecords.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
                
                // Score = 100 - Month Deductions (Floored at 0)
                const calculatedScore = Math.max(0, 100 - currentMonthDeductions);

                return {
                  ...e,
                  id: String(e.id).trim(),
                  password: e.password ? String(e.password).trim() : '',
                  score: calculatedScore, // Use Calculated Score
                  baseSalary: Number(e.baseSalary) || 0,
                  positionAllowance: Number(e.positionAllowance) || 0,
                  pendingDeductionPoints: Number(e.pendingDeductionPoints) || 0,
                };
            });
          setEmployees(sanitizedEmployees);
      }

      if (data.deductionCodes) setDeductionCodes(data.deductionCodes.filter((d: any) => d.id !== PRESERVE_ID));
      if (data.incentiveTiers) setIncentiveTiers(data.incentiveTiers.filter((t: any) => t.id !== PRESERVE_ID));
      if (data.config) setConfig(data.config);
      
      setIsOfflineMode(false);
    } catch (error) {
      console.warn("Failed to fetch data, switching to Offline Mode:", error);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initiateSync = () => {
      // Collect warnings for empty data sets instead of blocking
      const warnings = [];
      if (employees.length === 0) warnings.push("ข้อมูลพนักงาน");
      if (deductionCodes.length === 0) warnings.push("รหัสการหักคะแนน");
      if (incentiveTiers.length === 0) warnings.push("เกณฑ์รายได้");
      if (deductionRecords.length === 0) warnings.push("ประวัติการหักคะแนน");

      let title = "ยืนยันการบันทึกข้อมูล";
      let message = "ข้อมูลทั้งหมดใน Google Sheets จะถูกแทนที่ด้วยข้อมูลปัจจุบัน\n(คะแนนพนักงานจะถูกอัปเดตเป็นคะแนนปัจจุบัน)\nคุณแน่ใจหรือไม่ที่จะทำการบันทึก?";
      let type = 'confirm';

      if (isOfflineMode) {
          title = "⚠️ ยืนยันการบันทึก (Offline Mode)";
          message = "ระบบทำงานใน Offline Mode การบันทึกอาจทำให้ข้อมูลที่ไม่ได้รับโหลดสูญหายได้";
          type = 'alert';
      } else if (warnings.length > 0) {
          title = "ยืนยันการล้างข้อมูล";
          message = `⚠️ รายการต่อไปนี้ไม่มีข้อมูล (ว่างเปล่า):\n- ${warnings.join('\n- ')}\n\nการบันทึกจะทำให้เนื้อหาในส่วนนี้บน Google Sheets ถูกลบออก (แต่หัวคอลัมน์จะยังคงอยู่)\nคุณต้องการยืนยันหรือไม่?`;
          type = 'alert';
      }

      // Check Config Structure (Minimum safety)
      if (!config || Object.keys(config).length === 0) {
         setModalState({
            isOpen: true,
            type: 'error',
            title: 'ข้อผิดพลาด',
            message: '⚠️ ตรวจพบข้อมูลการตั้งค่า (Config) ผิดพลาด กรุณารีเฟรชหน้าเว็บแล้วลองใหม่อีกครั้ง',
            onConfirm: undefined
        });
        return;
      }

      setModalState({
          isOpen: true,
          type: type as any,
          title,
          message,
          onConfirm: executeSync
      });
  };

  const executeSync = async () => {
    setIsSyncing(true);
    try {
      // -----------------------------------------------------------------------
      // HEADER PROTECTION STRATEGY:
      // If any array is empty, we inject a "Placeholder Row" with the ID 'PRESERVE_HEADER'.
      // This ensures that when the backend script writes the data, it sees at least one row
      // and thus creates/preserves the column headers (keys).
      // The `fetchData` function is updated to filter out these placeholder rows.
      // -----------------------------------------------------------------------

      const safeEmployees = employees.length > 0 ? employees : [{
          id: PRESERVE_ID, prefix: '', firstName: '', lastName: '', position: '', department: '',
          score: 0, baseSalary: 0, positionAllowance: 0, avatarUrl: '', signatureUrl: '',
          noPositionAllowance: false, pendingDeductionPoints: 0, password: ''
      }];

      const safeCodes = deductionCodes.length > 0 ? deductionCodes : [{
          id: PRESERVE_ID, code: '', category: '', description: '', points: 0
      }];

      const safeTiers = incentiveTiers.length > 0 ? incentiveTiers : [{
          id: PRESERVE_ID, name: '', minScore: 0, maxScore: 0, amount: 0
      }];

      const safeRecords = deductionRecords.length > 0 ? deductionRecords : [{
          id: PRESERVE_ID, employeeId: '', deductionCodeId: '', deductionCodeCode: '', 
          deductionDescription: '', date: new Date().toISOString().split('T')[0], 
          points: 0, fineAmount: 0, remark: '', carriedOverPoints: 0
      }];

      // Create payload with extensive key mapping to ensure compatibility with Google Apps Script
      const payload = {
          action: 'saveAll',
          data: {
            Employees: safeEmployees,
            DeductionCodes: safeCodes,
            Records: safeRecords,
            IncentiveTiers: safeTiers,
            Config: config,
            // Fallback keys for older script versions
            employees: safeEmployees,
            deductionCodes: safeCodes,
            records: safeRecords,
            incentiveTiers: safeTiers,
            config: config,
            codes: safeCodes, 
            tiers: safeTiers
          }
      };

      console.log("Sending Payload to Sheet:", payload); 

      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let result;
      try {
          result = JSON.parse(text);
      } catch (e) {
          throw new Error(`Server Response Error: ${text.substring(0, 100)}...`);
      }
      
      if (result.status === 'success') {
          setIsOfflineMode(false);
          setModalState({
              isOpen: true,
              type: 'success',
              title: 'บันทึกสำเร็จ',
              message: 'ข้อมูลทั้งหมดถูกอัปเดตลงฐานข้อมูลเรียบร้อยแล้ว\n(คะแนนพนักงานถูกรีเซ็ตและบันทึกตามเดือนปัจจุบันแล้ว)',
              onConfirm: undefined // Show only OK button
          });
      } else {
          throw new Error(result.message || 'Server returned error status');
      }
    } catch (error: any) {
      console.error("Sync failed:", error);
      setModalState({
          isOpen: true,
          type: 'error',
          title: 'บันทึกไม่สำเร็จ',
          message: `เกิดข้อผิดพลาด: ${error.message}\n\nกรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือลองใหม่อีกครั้ง`,
          onConfirm: undefined
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNavigate = (menu: string) => {
    setActiveMenu(menu);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setActiveMenu('record');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold">กำลังโหลดข้อมูลจาก Google Sheets...</h2>
        <p className="text-slate-400 text-sm mt-2">ระบบกำลังดึงข้อมูลและคำนวณคะแนนประจำเดือนนี้</p>
      </div>
    );
  }

  if (!currentUser) {
      return <LoginView employees={employees} onLogin={setCurrentUser} />;
  }

  if (currentUser.role === 'employee') {
      const currentEmp = employees.find(e => e.id === currentUser.employeeId);
      if (!currentEmp) return <div className="p-10 text-center text-red-500">Error: Employee data not found</div>;

      return (
          <EmployeePortalView 
             currentEmployee={currentEmp}
             records={deductionRecords}
             incentiveTiers={incentiveTiers}
             deductionCodes={deductionCodes}
             onLogout={handleLogout}
             onRefresh={fetchData}
          />
      );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen sticky top-0">
        <div className="p-6 bg-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">Driver Score</h1>
            <p className="text-xs text-slate-400">System Admin</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="ภาพรวมระบบ" active={activeMenu === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
          <NavItem icon={<FileText size={20} />} label="บันทึกการหักคะแนน" active={activeMenu === 'record'} onClick={() => handleNavigate('record')} />
          <NavItem icon={<Users size={20} />} label="รายชื่อพนักงาน" active={activeMenu === 'employees'} onClick={() => handleNavigate('employees')} />
          <NavItem icon={<List size={20} />} label="รหัสการหักคะแนน" active={activeMenu === 'codes'} onClick={() => handleNavigate('codes')} />
          <NavItem icon={<DollarSign size={20} />} label="รายการรายรับเงิน" active={activeMenu === 'finance'} onClick={() => handleNavigate('finance')} />
          <NavItem icon={<ClipboardCheck size={20} />} label="รายงานประจำเดือน" active={activeMenu === 'monthlyReport'} onClick={() => handleNavigate('monthlyReport')} />
          <NavItem icon={<Settings size={20} />} label="ตั้งค่าเกณฑ์รายได้" active={activeMenu === 'settings'} onClick={() => handleNavigate('settings')} />
        </nav>
        
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
           {isOfflineMode && (
              <div className="mb-3 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-bold flex items-center gap-2 border border-orange-500/30">
                  <WifiOff size={14} /> Offline Mode
              </div>
           )}
           
           <button 
              onClick={fetchData} 
              disabled={isSyncing}
              className="w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-all border border-slate-600 hover:border-slate-500 active:scale-95"
           >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
           </button>

           <button 
              onClick={initiateSync}
              disabled={isSyncing}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                isSyncing
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20 active:scale-95'
              }`}
           >
              {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              {isSyncing ? 'กำลังบันทึก...' : 'บันทึกลงฐานข้อมูล'}
           </button>
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">AD</div>
            <div>
              <p className="text-sm text-white">Administrator</p>
              <p className="text-xs text-slate-500">Online</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 py-2 rounded-lg text-sm transition-colors">
              <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {activeMenu === 'dashboard' && (
          <DashboardView 
            employees={employees} 
            records={deductionRecords} 
            deductionCodes={deductionCodes}
            incentiveTiers={incentiveTiers}
            onNavigate={handleNavigate}
          />
        )}
        {activeMenu === 'monthlyReport' && (
            <MonthlyReportView 
                employees={employees} 
                records={deductionRecords} 
                incentiveTiers={incentiveTiers} 
                deductionCodes={deductionCodes}
                config={config}
                setConfig={setConfig}
            />
        )}
        {activeMenu === 'record' && <RecordDeductionView employees={employees} setEmployees={setEmployees} deductionCodes={deductionCodes} records={deductionRecords} setRecords={setDeductionRecords} />}
        {activeMenu === 'employees' && <EmployeeListView employees={employees} setEmployees={setEmployees} records={deductionRecords} />}
        {activeMenu === 'codes' && <DeductionCodeListView codes={deductionCodes} setCodes={setDeductionCodes} />}
        {/* FIX: Changed `setTiers={setTiers}` to `setTiers={setIncentiveTiers}` to pass the correct state setter function. */}
        {activeMenu === 'settings' && <IncentiveSettingsView tiers={incentiveTiers} setTiers={setIncentiveTiers} />}
        {activeMenu === 'finance' && <FinanceView employees={employees} records={deductionRecords} incentiveTiers={incentiveTiers} />}
      </main>

      {/* Global Custom Modal for Sync/Alerts */}
      <CustomModal 
         isOpen={modalState.isOpen}
         title={modalState.title}
         message={modalState.message}
         type={modalState.type}
         onConfirm={modalState.onConfirm}
         onClose={closeModal}
         isLoading={isSyncing}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
