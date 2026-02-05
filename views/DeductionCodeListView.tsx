
import React, { useState } from 'react';
import { List, Plus, Edit, Trash2, X } from 'lucide-react';
import { DeductionCode } from '../types';

interface DeductionCodeListViewProps {
  codes: DeductionCode[];
  setCodes: React.Dispatch<React.SetStateAction<DeductionCode[]>>;
}

export const DeductionCodeListView = ({ codes, setCodes }: DeductionCodeListViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DeductionCode | null>(null);
  const [formData, setFormData] = useState<Partial<DeductionCode>>({});
  
  // New state for delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleOpenModal = (code?: DeductionCode) => {
    if (code) {
      setEditingCode(code);
      setFormData(code);
    } else {
      setEditingCode(null);
      setFormData({
        id: `D-${Date.now()}`,
        code: '',
        category: 'ทั่วไป',
        description: '',
        points: 5
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCode(null);
    setFormData({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.description || !formData.points) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');

    if (editingCode) {
      setCodes(prev => prev.map(c => c.id === editingCode.id ? { ...c, ...formData } as DeductionCode : c));
    } else {
      setCodes(prev => [...prev, formData as DeductionCode]);
    }
    handleCloseModal();
  };


  const handleDeleteClick = (id: string) => {
      setDeleteTargetId(id);
  }

  const confirmDelete = () => {
    if(deleteTargetId) {
        setCodes(prev => prev.filter(c => c.id !== deleteTargetId));
        setDeleteTargetId(null);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
       <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <List className="text-blue-600" />
             รหัสการหักคะแนน
           </h2>
           <p className="text-slate-500 text-sm">รายการความผิดและคะแนนที่ตัด</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors">
          <Plus size={18} />
          เพิ่มรหัส
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-100 text-slate-600 font-semibold text-sm">
               <tr>
                 <th className="p-4 border-b">รหัส</th>
                 <th className="p-4 border-b">หมวดหมู่</th>
                 <th className="p-4 border-b">รายละเอียดความผิด</th>
                 <th className="p-4 border-b text-center">คะแนนที่ตัด</th>
                 <th className="p-4 border-b text-center">จัดการ</th>
               </tr>
             </thead>
             <tbody className="text-sm">
               {codes.map(code => (
                 <tr key={code.id} className="border-b last:border-b-0 hover:bg-slate-50">
                   <td className="p-4 font-mono text-slate-600 font-bold">{code.code}</td>
                   <td className="p-4">
                     <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs">{code.category}</span>
                   </td>
                   <td className="p-4 text-slate-800">{code.description}</td>
                   <td className="p-4 text-center">
                     <span className="inline-block w-8 h-8 leading-8 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                       -{code.points}
                     </span>
                   </td>
                   <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(code)} className="text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteClick(code.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

       {/* Add/Edit Modal */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCode ? 'แก้ไขรหัสการหักคะแนน' : 'เพิ่มรหัสการหักคะแนนใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">รหัส (Code) <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    placeholder="เช่น SPD01"
                    className="mt-1 px-3 py-2 border border-slate-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 uppercase"
                    value={formData.code || ''}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">หัวข้อการหักคะแนน <span className="text-red-500">*</span></label>
                  <input 
                      required
                      type="text" 
                      placeholder="ระบุรายละเอียดความผิด"
                      className="mt-1 px-3 py-2 border border-slate-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                      value={formData.description || ''}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">หมวดหมู่</label>
                    <input 
                        type="text" 
                        placeholder="เช่น วินัยจราจร"
                        className="mt-1 px-3 py-2 border border-slate-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        value={formData.category || ''}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">คะแนนที่หัก <span className="text-red-500">*</span></label>
                    <input 
                        required
                        type="number" 
                        min="1"
                        className="mt-1 px-3 py-2 border border-slate-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        value={formData.points || ''}
                        onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 mt-auto">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors font-medium"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">ยืนยันการลบ</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        ยืนยันการลบรหัสนี้? <br/>
                        การกระทำนี้ไม่สามารถย้อนกลับได้
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteTargetId(null)} 
                        className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={confirmDelete} 
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
