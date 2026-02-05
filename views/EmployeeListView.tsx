
import React, { useState, useMemo, useEffect } from 'react';
// Added Lock to the imports from lucide-react to avoid conflict with global Lock interface
import { Users, Plus, X, Edit, Trash2, Calendar, FileText, AlertCircle, AlertTriangle, CheckCircle, Clock, TrendingDown, Upload, PenTool, RefreshCw, Eye, EyeOff, Lock, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Employee, DeductionRecord } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbweIktVpIc-LxBZNABAmAjcXTiZ03DHElabkAk6mvCQcfSBP_lQmG8WSuJLh41dRzzO/exec';

interface EmployeeListViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  records: DeductionRecord[];
}

export const EmployeeListView = ({ employees, setEmployees, records }: EmployeeListViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState<Employee | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [isUploading, setIsUploading] = useState<string | null>(null); // 'avatar' | 'signature' | null
    const [showPassword, setShowPassword] = useState(false);
    const [fullNameInput, setFullNameInput] = useState('');
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

    const handleUploadToDrive = async (file: File, type: 'avatar' | 'signature') => {
        setIsUploading(type);
        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
            const base64 = await base64Promise;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'uploadImage',
                    base64: base64,
                    mimeType: file.type,
                    fileName: `${type}_${formData.id || Date.now()}_${file.name}`
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                if (type === 'avatar') setFormData({ ...formData, avatarUrl: result.url });
                else setFormData({ ...formData, signatureUrl: result.url });
            } else {
                if (result.message?.includes('getFolderById')) {
                    alert('❌ ข้อผิดพลาดที่ Google Drive: ตรวจสอบว่าใน AppScript คุณได้ใส่ Folder ID ของคุณแล้วหรือยัง? (อย่าใช้ ID ตัวอย่างที่ผมให้ไป)');
                } else {
                    alert('อัปโหลดล้มเหลว: ' + result.message);
                }
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert('อัปโหลดรูปภาพไม่สำเร็จ: โปรดตรวจสอบสิทธิ์การเข้าถึง AppScript');
        } finally {
            setIsUploading(null);
        }
    };

    const handleOpenModal = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData(employee);
            setFullNameInput(`${employee.prefix}${employee.firstName} ${employee.lastName}`.trim());
        } else {
            setEditingEmployee(null);
            setFormData({
                id: `EMP-${Math.floor(Date.now() % 10000).toString().padStart(4, '0')}`,
                prefix: 'นาย',
                firstName: '',
                lastName: '',
                position: 'Forklift Driver',
                department: 'Warehouse 1',
                score: 100,
                baseSalary: 0,
                positionAllowance: 0,
                avatarUrl: '',
                signatureUrl: '',
                pendingDeductionPoints: 0,
                password: ''
            });
            setFullNameInput('');
        }
        setIsModalOpen(true);
    };

    const handleNameChange = (val: string) => {
        setFullNameInput(val);
        const input = val.trim();
        const prefixes = ['นาย', 'นางสาว', 'นาง', 'ด.ช.', 'ด.ญ.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'ว่าที่ร้อยตรี'];
        const sortedPrefixes = [...prefixes].sort((a, b) => b.length - a.length);
        let prefix = 'นาย';
        let remaining = input;
        for (const p of sortedPrefixes) {
            if (input.startsWith(p)) {
                prefix = p;
                remaining = input.substring(p.length).trim();
                break;
            }
        }
        const parts = remaining.split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        setFormData(prev => ({ ...prev, prefix, firstName, lastName }));
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
        setFormData({});
        setShowPassword(false);
        setFullNameInput('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation Checks
        if (!formData.id || !formData.id.trim()) {
            alert('กรุณากรอกรหัสพนักงาน');
            return;
        }
        if (!formData.firstName || !formData.firstName.trim()) {
            alert('กรุณากรอกชื่อพนักงาน');
            return;
        }
        if (!formData.lastName || !formData.lastName.trim()) {
            alert('กรุณากรอกนามสกุลพนักงาน (โดยการเว้นวรรคหลังชื่อ)');
            return;
        }

        const avatar = formData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.id}`;
        
        // Construct complete Employee object
        const employeeData: Employee = {
            id: formData.id.trim(),
            prefix: formData.prefix || 'นาย',
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            position: formData.position || 'Forklift Driver',
            department: formData.department || 'Warehouse 1',
            score: formData.score ?? 100,
            baseSalary: 0, // Force 0 as user requested removal
            positionAllowance: formData.positionAllowance ?? 0,
            avatarUrl: avatar,
            signatureUrl: formData.signatureUrl || '',
            pendingDeductionPoints: formData.pendingDeductionPoints ?? 0,
            password: formData.password || '',
            noPositionAllowance: formData.noPositionAllowance || false
        };

        if (editingEmployee) {
            setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? employeeData : emp));
        } else {
            // Check for duplicate ID
            if (employees.some(e => e.id === employeeData.id)) {
                alert(`รหัสพนักงาน ${employeeData.id} มีอยู่แล้วในระบบ กรุณาใช้รหัสอื่น`);
                return;
            }
            setEmployees(prev => [...prev, employeeData]);
        }
        handleCloseModal();
    };

    const handleConfirmDelete = () => {
        if (deleteTarget) {
            setEmployees(prev => prev.filter(emp => emp.id !== deleteTarget.id));
            setDeleteTarget(null);
        }
    };

    const handleViewHistory = (employee: Employee) => {
        setSelectedHistoryEmployee(employee);
        setIsHistoryModalOpen(true);
    };

    // Fixed: Ensure type-safe comparison for IDs (String vs Number issue)
    const historyRecords = useMemo(() => selectedHistoryEmployee 
        ? records.filter(r => String(r.employeeId).trim() === String(selectedHistoryEmployee.id).trim())
                 .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [], [selectedHistoryEmployee, records]);

    const groupedHistory = useMemo(() => {
        const groups: { [key: string]: DeductionRecord[] } = {};
        historyRecords.forEach(rec => {
            const date = new Date(rec.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(rec);
        });

        return Object.entries(groups)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([key, recs]) => ({
                key,
                label: new Date(recs[0].date).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
                records: recs,
                totalPoints: recs.reduce((sum, r) => sum + r.points, 0)
            }));
    }, [historyRecords]);

    useEffect(() => {
        if (isHistoryModalOpen && groupedHistory.length > 0) {
            // Default expand all
            setExpandedMonths(groupedHistory.map(g => g.key));
        }
    }, [isHistoryModalOpen, groupedHistory.length, selectedHistoryEmployee?.id]);

    const toggleMonth = (key: string) => {
        setExpandedMonths(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Users className="text-blue-600" />
             รายชื่อพนักงาน
           </h2>
           <p className="text-slate-500 text-sm">จัดการข้อมูลพนักงานในฐานข้อมูล Google Sheets</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors">
          <Plus size={18} />
          เพิ่มพนักงาน
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
               <div className="p-6 flex items-start gap-4">
                 <img src={emp.avatarUrl} alt={emp.firstName} className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 object-cover" />
                 <div className="flex-1 min-w-0">
                   <h3 className="font-bold text-lg text-slate-800 truncate">{emp.prefix} {emp.firstName} {emp.lastName}</h3>
                   <p className="text-slate-500 text-sm mb-2">{emp.position}</p>
                   <div className="flex flex-wrap items-center gap-2 text-xs">
                     <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">{emp.department}</span>
                     {!emp.noPositionAllowance ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200 font-medium">
                            <CheckCircle size={12} />
                            ได้รับค่าตำแหน่ง
                        </span>
                     ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded border border-orange-200 font-medium">
                            <Clock size={12} />
                            ไม่ได้รับค่าตำแหน่ง
                        </span>
                     )}
                   </div>
                   <div className="mt-2 flex flex-wrap gap-1">
                        {emp.signatureUrl && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100">
                                <PenTool size={10} />
                                มีลายเซ็น
                            </div>
                        )}
                        {emp.password && (
                            <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded w-fit border border-green-100">
                                <Lock size={10} className="w-2.5 h-2.5" />
                                ตั้งรหัสผ่านแล้ว
                            </div>
                        )}
                   </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <button onClick={() => handleOpenModal(emp)} className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors">
                        <Edit size={16}/>
                    </button>
                    <button onClick={() => setDeleteTarget(emp)} className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 size={16}/>
                    </button>
                 </div>
               </div>
               <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 <div className="flex flex-col">
                    <div className="text-sm">
                        <span className="text-slate-500">คะแนน:</span>
                        <span className={`ml-2 font-bold ${emp.score >= 80 ? 'text-green-600' : emp.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {emp.score} / 100
                        </span>
                    </div>
                    {(emp.pendingDeductionPoints || 0) > 0 && (
                         <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1 bg-red-50 px-2 py-0.5 rounded-full w-fit">
                             <TrendingDown size={12} />
                             รอหัก: -{emp.pendingDeductionPoints}
                         </div>
                    )}
                 </div>
                 <button onClick={() => handleViewHistory(emp)} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center gap-1">
                    ประวัติ <ChevronRight size={14} />
                 </button>
               </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <Users size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">ไม่พบข้อมูลพนักงานในฐานข้อมูล</p>
                <button onClick={() => handleOpenModal()} className="mt-4 text-blue-600 font-bold flex items-center gap-2 mx-auto hover:underline">
                    <Plus size={18} /> เพิ่มคนแรก
                </button>
            </div>
          )}
        </div>
      </div>

       {/* Add/Edit Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingEmployee ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex gap-6 items-center">
                <div className="relative group">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-200 shrink-0">
                        {isUploading === 'avatar' ? <RefreshCw className="animate-spin text-blue-500" /> : <img src={formData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.id}`} alt="Preview" className="w-full h-full object-cover" />}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-all">
                        <Upload size={14} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadToDrive(e.target.files[0], 'avatar')} />
                    </label>
                </div>
                <div className="flex-1">
                   <label className="block text-sm font-bold text-slate-700">รหัสพนักงาน <span className="text-red-500">*</span></label>
                   <input required type="text" className="mt-1 px-4 py-3 border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <label className="block text-sm font-bold text-blue-800 mb-2">รหัสผ่านสำหรับเข้าสู่ระบบ</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="เว้นว่างไว้หากต้องการใช้ รหัสพนักงาน เป็นรหัสผ่าน"
                            className="w-full px-4 py-3 pr-12 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium" 
                            value={formData.password || ''} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-400 hover:text-blue-600"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-blue-500 mt-2 font-medium italic">* พนักงานจะใช้ รหัสพนักงาน และ รหัสผ่านนี้ ในการเข้าดูคะแนนของตนเอง</p>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">ชื่อ-นามสกุล (ระบุคำนำหน้า) <span className="text-red-500">*</span></label>
                 <input 
                    required 
                    type="text" 
                    placeholder="เช่น นายสมชาย เข็มกลัด"
                    className="mt-1 px-4 py-3 border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold text-lg"
                    value={fullNameInput}
                    onChange={(e) => handleNameChange(e.target.value)}
                 />
                 <div className="mt-2 flex gap-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded">คำนำหน้า: {formData.prefix || '-'}</span>
                    <span className={`px-2 py-1 rounded ${formData.firstName ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>ชื่อ: {formData.firstName || 'ยังไม่ระบุ'}</span>
                    <span className={`px-2 py-1 rounded ${formData.lastName ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>นามสกุล: {formData.lastName || 'ยังไม่ระบุ'}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700">ตำแหน่ง</label>
                  <select className="mt-1 px-4 py-3 border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})}>
                    <option value="">-- เลือกตำแหน่ง --</option>
                    <option value="Warehouse Supervisor">Warehouse Supervisor</option>
                    <option value="Sr.Warehouse Officer">Sr.Warehouse Officer</option>
                    <option value="Warehouse Officer">Warehouse Officer</option>
                    <option value="Sr.Forklift Driver">Sr.Forklift Driver</option>
                    <option value="Technical Service Forklift">Technical Service Forklift</option>
                    <option value="Forklift Driver">Forklift Driver</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">แผนก</label>
                  <input type="text" className="mt-1 px-4 py-3 border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700">ค่าตำแหน่ง (ฐาน)</label>
                  <input 
                    type="number" 
                    className="mt-1 px-4 py-3 border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-mono" 
                    value={formData.positionAllowance || 0} 
                    onChange={e => setFormData({...formData, positionAllowance: parseInt(e.target.value) || 0})} 
                    placeholder="เช่น 1500"
                  />
                </div>
                 <div className="flex items-end">
                      <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 p-3 rounded-xl border border-slate-200 w-full">
                        <input type="checkbox" className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500" checked={formData.noPositionAllowance || false} onChange={e => setFormData({...formData, noPositionAllowance: e.target.checked})} />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">ไม่ได้รับค่าตำแหน่ง</span>
                      </label>
                 </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><PenTool size={16} className="text-blue-600" /> รูปลายเซ็น (เซฟลง Google Drive)</label>
                  <div className="flex items-center gap-4">
                      {formData.signatureUrl ? (
                          <div className="relative border border-slate-200 rounded-xl bg-white p-2">
                              <img src={formData.signatureUrl} alt="Signature" className="h-12 object-contain" />
                              <button type="button" onClick={() => setFormData({...formData, signatureUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"><X size={12} /></button>
                          </div>
                      ) : (
                          <div className="h-12 w-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-wider">Empty</div>
                      )}
                      <label className="cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                          {isUploading === 'signature' ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                          {formData.signatureUrl ? 'เปลี่ยนลายเซ็น' : 'อัปโหลดลายเซ็น'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadToDrive(e.target.files[0], 'signature')} />
                      </label>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <label className="block text-sm font-bold text-red-700 mb-1">ยอดค้างหักเดือนหน้า</label>
                      <input type="number" min="0" className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white text-red-900 font-bold" value={formData.pendingDeductionPoints || 0} onChange={e => setFormData({...formData, pendingDeductionPoints: parseInt(e.target.value) || 0})} />
                   </div>
               </div>

               <div className="p-4 border-t border-slate-200 flex justify-end gap-3 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={!!isUploading} className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all font-bold disabled:bg-slate-300">บันทึกพนักงาน</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedHistoryEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <img src={selectedHistoryEmployee.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-200 bg-white object-cover" />
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">ประวัติการหักคะแนน</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>{selectedHistoryEmployee.prefix}{selectedHistoryEmployee.firstName} {selectedHistoryEmployee.lastName}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className={`font-bold ${selectedHistoryEmployee.score >= 80 ? 'text-green-600' : selectedHistoryEmployee.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    คะแนนปัจจุบัน: {selectedHistoryEmployee.score}/100
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 bg-slate-50">
                    {groupedHistory.length > 0 ? (
                        <div className="space-y-4">
                            {groupedHistory.map((group) => (
                                <div key={group.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    <button 
                                        onClick={() => toggleMonth(group.key)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${expandedMonths.includes(group.key) ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                                <Calendar size={18} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-800">{group.label}</div>
                                                <div className="text-xs text-slate-500">{group.records.length} รายการ</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-black text-red-600">-{group.totalPoints}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">คะแนนรวม</div>
                                            </div>
                                            {expandedMonths.includes(group.key) ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                        </div>
                                    </button>
                                    
                                    {expandedMonths.includes(group.key) && (
                                        <div className="p-4 space-y-3 bg-white">
                                            {group.records.map((rec) => (
                                                <div key={rec.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group hover:border-blue-200 transition-colors">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold rounded uppercase">
                                                                    {rec.deductionCodeCode}
                                                                </span>
                                                                <span className="text-xs text-slate-400">
                                                                    {new Date(rec.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            </div>
                                                            <div className="font-bold text-slate-700 text-sm">{rec.deductionDescription}</div>
                                                            {rec.remark && <div className="text-xs text-slate-500 mt-1 italic">"{rec.remark}"</div>}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                             <span className="text-lg font-black text-red-600">-{rec.points}</span>
                                                             {rec.carriedOverPoints ? (
                                                                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-red-500 font-bold">
                                                                    <TrendingDown size={10} /> ยกยอด -{rec.carriedOverPoints}
                                                                </div>
                                                             ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-60">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={48} className="text-green-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-700">ไม่มีประวัติการกระทำผิด</h4>
                            <p className="text-slate-500">พนักงานคนนี้มีวินัยดีเยี่ยม ยังไม่เคยถูกหักคะแนน</p>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
                    แสดงรายการทั้งหมด {historyRecords.length} รายการ
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">ยืนยันการลบ</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        คุณแน่ใจหรือไม่ที่จะลบข้อมูลพนักงาน<br/>
                        <span className="font-bold text-slate-700">{deleteTarget.prefix}{deleteTarget.firstName} {deleteTarget.lastName}</span> ?<br/>
                        การกระทำนี้ไม่สามารถย้อนกลับได้
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteTarget(null)} 
                        className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleConfirmDelete} 
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95"
                    >
                        ยืนยันลบ
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
