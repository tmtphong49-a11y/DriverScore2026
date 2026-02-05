
import React, { useState } from 'react';
// Added Clock and TrendingDown to imports
import { FileText, ChevronDown, Save, Users, AlertTriangle, CheckCircle, X, Clock, TrendingDown } from 'lucide-react';
import { Employee, DeductionCode, DeductionRecord } from '../types';

interface RecordDeductionViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  deductionCodes: DeductionCode[];
  records: DeductionRecord[];
  setRecords: React.Dispatch<React.SetStateAction<DeductionRecord[]>>;
}

interface AlertModalState {
  isOpen: boolean;
  type: 'success' | 'warning';
  title: string;
  message: string;
}

export const RecordDeductionView = ({ employees, setEmployees, deductionCodes, records, setRecords }: RecordDeductionViewProps) => {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedCodeId, setSelectedCodeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  
  // SweetAlert State
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Use String() for loose comparison in case IDs are numbers in JSON
  const selectedEmployee = employees.find(e => String(e.id) === String(selectedEmpId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (!selectedEmpId || !selectedCodeId || !date) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    // 2. Find Data with Type Safety (String/Number conversion)
    const emp = employees.find(e => String(e.id) === String(selectedEmpId));
    const code = deductionCodes.find(c => String(c.id) === String(selectedCodeId));
    
    // 3. Deep Validation
    if (!emp) {
        alert(`ไม่พบข้อมูลพนักงาน (ID: ${selectedEmpId}) ในระบบ`);
        return;
    }
    if (!code) {
        alert(`ไม่พบรหัสความผิด (ID: ${selectedCodeId}) ในระบบ`);
        return;
    }

    // 4. Robust Calculation
    const pointsToDeduct = Number(code.points) || 0;
    let newScore = Number(emp.score) || 0; // Ensure number
    let newPending = Number(emp.pendingDeductionPoints) || 0;
    let carriedOver = 0;

    // ถ้าคะแนนปัจจุบันมีพอให้หัก
    if (newScore >= pointsToDeduct) {
        newScore -= pointsToDeduct;
    } else {
        // ถ้าคะแนนไม่พอ หักจนเหลือ 0 แล้วส่วนต่างโยกไป Pending
        carriedOver = pointsToDeduct - newScore;
        newScore = 0;
        newPending += carriedOver;
    }

    const newRecord: DeductionRecord = {
      id: `REC-${Date.now()}`,
      employeeId: emp.id,
      deductionCodeId: code.id,
      deductionCodeCode: code.code,
      deductionDescription: code.description,
      date,
      points: pointsToDeduct,
      fineAmount: 0, 
      remark,
      carriedOverPoints: carriedOver
    };

    // Update Records
    setRecords([newRecord, ...records]);

    // Update Employee Score & Pending Deduction
    setEmployees(employees.map(e => String(e.id) === String(emp.id) ? { 
        ...e, 
        score: newScore,
        pendingDeductionPoints: newPending 
    } : e));

    // Prepare SweetAlert Message
    if (carriedOver > 0) {
        setAlertModal({
            isOpen: true,
            type: 'warning',
            title: 'บันทึกเรียบร้อย (มียอดค้าง)',
            message: `หักคะแนนปัจจุบันจนเหลือ 0 และยกยอด ${carriedOver} คะแนน ไปหักในเดือนหน้าเรียบร้อยแล้ว`
        });
    } else {
        setAlertModal({
            isOpen: true,
            type: 'success',
            title: 'บันทึกสำเร็จ!',
            message: 'ข้อมูลการหักคะแนนถูกบันทึกลงในระบบเรียบร้อยแล้ว'
        });
    }

    // Reset Form (Optional: keep date?)
    setSelectedEmpId('');
    setSelectedCodeId('');
    setRemark('');
  };

  const handleToggleStatus = (checked: boolean) => {
    if (selectedEmpId) {
        setEmployees(prev => prev.map(e => String(e.id) === String(selectedEmpId) ? { ...e, noPositionAllowance: checked } : e));
    }
  };

  const closeAlert = () => setAlertModal(prev => ({ ...prev, isOpen: false }));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 bg-white border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="text-blue-600" />
          บันทึกการหักคะแนน
        </h2>
        <p className="text-slate-500 text-sm">บันทึกความผิดและตัดคะแนนพนักงานขับรถ</p>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">เลือกชื่อพนักงาน</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                    value={selectedEmpId}
                    onChange={e => setSelectedEmpId(e.target.value)}
                    required
                  >
                    <option value="">เลือกพนักงาน...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.prefix} {emp.firstName} {emp.lastName} ({emp.score} คะแนน)</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                    <ChevronDown size={16} />
                  </div>
                </div>

                {selectedEmployee && (selectedEmployee.pendingDeductionPoints || 0) > 0 && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <strong>คำเตือน:</strong> พนักงานคนนี้มียอดติดลบรอหักเดือนหน้าอยู่ 
                            <span className="font-bold underline mx-1">{selectedEmployee.pendingDeductionPoints}</span>
                            คะแนน
                        </div>
                    </div>
                )}

                {selectedEmployee && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-300">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Users size={16} className="text-slate-500" />
                            สถานะพนักงาน
                        </h4>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center mt-0.5">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                                    checked={selectedEmployee.noPositionAllowance || false}
                                    onChange={(e) => handleToggleStatus(e.target.checked)}
                                />
                            </div>
                            <div>
                                <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">ไม่ได้รับค่าตำแหน่ง</span>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    พนักงานที่ไม่ได้รับค่าตำแหน่งจะได้รับเงิน 0 บาท แต่คะแนนยังคำนวณปกติ
                                </p>
                            </div>
                        </label>
                    </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">วันที่เกิดเหตุ</label>
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">หัวข้อความผิด (รหัสการหักคะแนน)</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  value={selectedCodeId}
                  onChange={e => setSelectedCodeId(e.target.value)}
                  required
                >
                  <option value="">เลือกหัวข้อความผิด...</option>
                  {deductionCodes.map(code => (
                    <option key={code.id} value={code.id}>[{code.code}] {code.description} (-{code.points} คะแนน)</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">รายละเอียดเพิ่มเติม / หมายเหตุ</label>
              <textarea 
                className="w-full bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-lg focus:outline-none focus:border-blue-500 h-24 resize-none transition-all"
                placeholder="ระบุรายละเอียดเหตุการณ์..."
                value={remark}
                onChange={e => setRemark(e.target.value)}
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-red-900/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <Save size={20} />
                บันทึกการตัดคะแนน
              </button>
            </div>
          </form>
        </div>

        <div className="max-w-3xl mx-auto mt-8">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              ประวัติการบันทึกล่าสุด
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b">วันที่</th>
                  <th className="p-4 border-b">พนักงาน</th>
                  <th className="p-4 border-b">ความผิด</th>
                  <th className="p-4 border-b text-center">หักคะแนน</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {records.slice(0, 5).map(rec => {
                  const emp = employees.find(e => String(e.id) === String(rec.employeeId));
                  return (
                    <tr key={rec.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500 font-medium">{new Date(rec.date).toLocaleDateString('th-TH')}</td>
                      <td className="p-4 font-bold text-slate-800">
                        {emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'}
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase">{rec.deductionCodeCode}</span>
                        <div className="font-medium">{rec.deductionDescription}</div>
                        {rec.carriedOverPoints ? (
                             <span className="inline-flex items-center gap-1 text-[10px] text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded-full font-bold">
                                 <TrendingDown size={10} /> ยกยอด {rec.carriedOverPoints} ไปเดือนหน้า
                             </span>
                        ) : null}
                      </td>
                      <td className="p-4 text-center text-red-600 font-black text-base">-{rec.points}</td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                   <tr><td colSpan={4} className="p-12 text-center text-slate-300 font-bold italic">ยังไม่มีประวัติการบันทึก</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SweetAlert Custom Modal */}
      {alertModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                  <div className="p-8 text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                          alertModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                          {alertModal.type === 'success' ? <CheckCircle size={48} /> : <AlertTriangle size={48} />}
                      </div>
                      
                      <h3 className="text-2xl font-black text-slate-800 mb-2">{alertModal.title}</h3>
                      <p className="text-slate-500 leading-relaxed mb-8">{alertModal.message}</p>
                      
                      <button 
                        onClick={closeAlert}
                        className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-95 ${
                            alertModal.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/20'
                        }`}
                      >
                          ตกลง
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
    