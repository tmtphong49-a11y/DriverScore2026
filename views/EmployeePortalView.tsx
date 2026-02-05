
import React, { useState, useMemo } from 'react';
import { 
  Users, DollarSign, ShieldAlert, PenTool, TrendingDown, CheckCircle, 
  AlertCircle, Check, HelpCircle, LogOut, X, RefreshCw
} from 'lucide-react';
import { Employee, DeductionRecord, IncentiveTier, DeductionCode } from '../types';

interface EmployeePortalViewProps {
  currentEmployee: Employee;
  records: DeductionRecord[];
  incentiveTiers: IncentiveTier[];
  deductionCodes: DeductionCode[];
  onLogout: () => void;
  onRefresh: () => void;
}

interface SignatureData {
    employeeId: string;
    month: string;
    signatureImage: string;
    timestamp: string;
}

export const EmployeePortalView = ({ 
  currentEmployee, 
  records, 
  incentiveTiers, 
  deductionCodes, 
  onLogout,
  onRefresh
}: EmployeePortalViewProps) => {
    
  const [activeTab, setActiveTab] = useState<'info' | 'criteria' | 'codes'>('info');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load signatures
  const [signatures, setSignatures] = useState<SignatureData[]>(() => {
    const saved = localStorage.getItem('employee_signatures');
    return saved ? JSON.parse(saved) : [];
  });

  // Derived Data
  const hasSignatureForMonth = signatures.some(s => s.employeeId === currentEmployee.id && s.month === selectedMonth);
  const userSignatureInSystem = currentEmployee.signatureUrl;

  const monthRecords = useMemo(() => {
      return records.filter(r => r.employeeId === currentEmployee.id && r.date.startsWith(selectedMonth));
  }, [records, currentEmployee.id, selectedMonth]);

  const totalDeductions = monthRecords.reduce((sum, r) => sum + r.points, 0);

  // Calculate Incentive (Real-time based on current score - *Note: In a real app, this should be snapshot based on month end*)
  // For this view, we show "Current Potential" based on current score if viewing current month
  const currentTier = incentiveTiers.find(t => currentEmployee.score >= t.minScore && currentEmployee.score <= t.maxScore);
  const incentiveAmount = currentEmployee.noPositionAllowance ? 0 : (currentTier ? currentTier.amount : 0);

  const formatMoney = (amount: number) => new Intl.NumberFormat('th-TH').format(amount);

  const getThaiMonthInfo = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return {
        monthName: months[parseInt(month) - 1],
        yearCE: parseInt(year),
        yearBE: parseInt(year) + 543
    };
  };
  const { monthName, yearCE } = getThaiMonthInfo(selectedMonth);

  // Handlers
  const handleSignClick = () => {
    if (!userSignatureInSystem) {
        // This case is largely handled by UI rendering logic, but kept for safety
        return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSign = () => {
    const newSignature: SignatureData = {
        employeeId: currentEmployee.id,
        month: selectedMonth,
        signatureImage: userSignatureInSystem!,
        timestamp: new Date().toISOString()
    };
    const updated = [...signatures.filter(s => !(s.employeeId === currentEmployee.id && s.month === selectedMonth)), newSignature];
    setSignatures(updated);
    localStorage.setItem('employee_signatures', JSON.stringify(updated));
    setShowConfirmModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <div className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
         <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <PenTool className="text-yellow-400" />
                <div>
                    <h1 className="font-bold text-lg leading-tight">Driver Portal</h1>
                    <p className="text-xs text-blue-200">จุดบริการพนักงาน</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{currentEmployee.firstName} {currentEmployee.lastName}</p>
                    <p className="text-xs text-blue-300">{currentEmployee.id}</p>
                </div>

                <button 
                    onClick={onRefresh} 
                    className="bg-blue-800/50 hover:bg-blue-700 p-2 rounded-lg transition-colors text-blue-200 hover:text-white" 
                    title="รีเฟรชข้อมูลล่าสุด"
                >
                    <RefreshCw size={18} />
                </button>

                <img src={currentEmployee.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/20" />
                <button onClick={onLogout} className="bg-red-500/80 hover:bg-red-600 p-2 rounded-lg transition-colors text-white" title="ออกจากระบบ">
                    <LogOut size={18} />
                </button>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        
        {/* Month Selector */}
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <span className="text-slate-600 font-bold">เลือกเดือนที่ต้องการตรวจสอบ:</span>
             <input 
                type="month" 
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
             />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="flex border-b border-slate-200 bg-slate-50">
                <button 
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Users size={18} />
                    ข้อมูล & ลงนาม
                </button>
                <button 
                    onClick={() => setActiveTab('criteria')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'criteria' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <DollarSign size={18} />
                    เกณฑ์รายได้
                </button>
                <button 
                    onClick={() => setActiveTab('codes')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeTab === 'codes' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <ShieldAlert size={18} />
                    กฎระเบียบ
                </button>
            </div>

            <div className="p-6">
                
                {/* 1. INFO TAB */}
                {activeTab === 'info' && (
                    <div className="space-y-6 animate-fadeIn">
                        
                        {/* Status Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute right-0 top-0 opacity-10 p-4"><DollarSign size={120} /></div>
                                <p className="text-blue-100 text-sm mb-1">เงินรางวัลคาดการณ์ ({monthName})</p>
                                <div className="text-4xl font-bold mb-4">{formatMoney(incentiveAmount)} <span className="text-lg font-normal">บาท</span></div>
                                <div className="flex gap-4">
                                    <div className="bg-white/20 rounded px-3 py-1 backdrop-blur-sm">
                                        <span className="block text-xs text-blue-200">เกรด</span>
                                        <span className="font-bold">{currentTier?.name || '-'}</span>
                                    </div>
                                    <div className="bg-white/20 rounded px-3 py-1 backdrop-blur-sm">
                                        <span className="block text-xs text-blue-200">คะแนน</span>
                                        <span className="font-bold">{currentEmployee.score}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
                                <p className="text-slate-500 text-sm mb-2">สถานะการลงนามประจำเดือนนี้</p>
                                {hasSignatureForMonth ? (
                                    <div className="text-green-600 flex flex-col items-center animate-in zoom-in duration-300">
                                        <CheckCircle size={48} className="mb-2" />
                                        <span className="font-bold text-lg">ลงนามเรียบร้อยแล้ว</span>
                                        <span className="text-xs text-slate-400">เมื่อ {new Date(signatures.find(s => s.employeeId === currentEmployee.id && s.month === selectedMonth)?.timestamp || '').toLocaleString('th-TH')}</span>
                                    </div>
                                ) : (
                                    <div className="text-orange-500 flex flex-col items-center">
                                        <AlertCircle size={48} className="mb-2" />
                                        <span className="font-bold text-lg">ยังไม่ลงนาม</span>
                                        <span className="text-xs text-slate-400">กรุณาตรวจสอบข้อมูลและกดยืนยันด้านล่าง</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deductions Table */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <TrendingDown size={18} className="text-red-500" />
                                    รายการหักคะแนนประจำเดือน
                                </h3>
                            </div>
                            {monthRecords.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-500">
                                        <tr>
                                            <th className="p-3">วันที่</th>
                                            <th className="p-3">รายการ</th>
                                            <th className="p-3 text-center">คะแนน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthRecords.map(rec => (
                                            <tr key={rec.id} className="border-b last:border-b-0 border-slate-100">
                                                <td className="p-3 whitespace-nowrap text-slate-600">{new Date(rec.date).toLocaleDateString('th-TH')}</td>
                                                <td className="p-3 text-slate-800">
                                                    <div className="font-medium">{rec.deductionDescription}</div>
                                                    {rec.remark && <div className="text-xs text-slate-500">"{rec.remark}"</div>}
                                                </td>
                                                <td className="p-3 text-center text-red-600 font-bold">-{rec.points}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-red-50 font-bold">
                                            <td colSpan={2} className="p-3 text-right text-slate-600">รวมคะแนนที่ถูกหัก</td>
                                            <td className="p-3 text-center text-red-600">-{totalDeductions}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                    <CheckCircle size={32} className="mb-2 text-green-500 opacity-50" />
                                    <p>ไม่มีประวัติการหักคะแนนในเดือนนี้</p>
                                </div>
                            )}
                        </div>

                        {/* Action Area */}
                        {!hasSignatureForMonth && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                                <h4 className="font-bold text-slate-800 mb-4">ยืนยันความถูกต้องของข้อมูล</h4>
                                {userSignatureInSystem ? (
                                    <div className="flex flex-col items-center">
                                        <img src={userSignatureInSystem} alt="Signature" className="h-16 mb-4 border border-slate-200 bg-white p-2 rounded" />
                                        <button 
                                            onClick={handleSignClick}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all flex items-center gap-2"
                                        >
                                            <PenTool size={20} />
                                            ข้าพเจ้าขอรับรองว่าข้อมูลถูกต้อง และขอยืนยันการลงนาม
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-100">
                                        <AlertCircle size={24} className="mx-auto mb-2" />
                                        <p className="font-bold">ไม่พบข้อมูลลายเซ็นในระบบ</p>
                                        <p className="text-sm">กรุณาแจ้ง HR เพื่อทำการเพิ่มลายเซ็นก่อนทำรายการ</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. CRITERIA TAB */}
                {activeTab === 'criteria' && (
                    <div className="animate-fadeIn">
                        <div className="mb-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex gap-3">
                            <HelpCircle size={20} className="shrink-0" />
                            <div>
                                <p className="font-bold">หลักการ:</p>
                                <p>บริษัทจะจ่ายเงินรางวัลพิเศษ (Incentive) ให้แก่พนักงานขับรถที่มีความประพฤติดี โดยวัดจากคะแนนความประพฤติคงเหลือ ณ สิ้นเดือน</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-semibold">
                                    <tr>
                                        <th className="p-3 border-b">เกรด</th>
                                        <th className="p-3 border-b text-center">ช่วงคะแนน</th>
                                        <th className="p-3 border-b text-right">เงินรางวัล</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incentiveTiers.sort((a,b) => b.minScore - a.minScore).map(tier => (
                                        <tr key={tier.id} className={`border-b last:border-b-0 ${currentTier?.id === tier.id ? 'bg-blue-50/50' : ''}`}>
                                            <td className="p-3 font-bold text-slate-800">
                                                {tier.name}
                                                {currentTier?.id === tier.id && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">ปัจจุบัน</span>}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs font-bold">
                                                    {tier.minScore} - {tier.maxScore}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-bold text-green-700">{formatMoney(tier.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. CODES TAB */}
                {activeTab === 'codes' && (
                    <div className="animate-fadeIn">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ShieldAlert className="text-red-600" />
                            ข้อควรระวังและบทลงโทษ
                        </h3>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                                        <tr>
                                            <th className="p-3 border-b">รหัส</th>
                                            <th className="p-3 border-b">ความผิด</th>
                                            <th className="p-3 border-b text-center">คะแนนที่ตัด</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deductionCodes.map(code => (
                                            <tr key={code.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                                <td className="p-3 font-mono font-bold text-slate-600">{code.code}</td>
                                                <td className="p-3 text-slate-800">
                                                    <div className="font-medium">{code.description}</div>
                                                    <div className="text-xs text-slate-500">{code.category}</div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-xs">
                                                        -{code.points}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8 pb-8">
            &copy; 2024 Driver Score System. All rights reserved.
        </p>

        {/* --- Custom Confirm Modal --- */}
        {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                 <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PenTool size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลงนาม</h3>
                        <p className="text-slate-600 mb-6">
                            ข้าพเจ้าขอรับรองว่าข้อมูลคะแนนและเงินรางวัลประจำเดือน <span className="font-bold text-blue-700">{monthName} {yearCE}</span> ถูกต้องครบถ้วน
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleConfirmSign}
                                className="flex-1 py-3 bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <PenTool size={18} />
                                ยืนยันการลงนาม
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};
