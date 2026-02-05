
import React, { useState } from 'react';
import { Settings, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { IncentiveTier } from '../types';

interface IncentiveSettingsViewProps {
  tiers: IncentiveTier[];
  setTiers: React.Dispatch<React.SetStateAction<IncentiveTier[]>>;
}

export const IncentiveSettingsView = ({ tiers, setTiers }: IncentiveSettingsViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<IncentiveTier | null>(null);
  const [formData, setFormData] = useState<Partial<IncentiveTier>>({});
  
  // New state for delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleOpenModal = (tier?: IncentiveTier) => {
    if (tier) {
      setEditingTier(tier);
      setFormData(tier);
    } else {
      setEditingTier(null);
      setFormData({
        id: `T-${Date.now()}`,
        name: '',
        minScore: 0,
        maxScore: 100,
        amount: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTier(null);
    setFormData({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.minScore === undefined || formData.maxScore === undefined || formData.amount === undefined) return alert('กรุณากรอกข้อมูลให้ครบ');

    if (editingTier) {
      setTiers(prev => prev.map(t => t.id === editingTier.id ? { ...t, ...formData } as IncentiveTier : t));
    } else {
      setTiers(prev => [...prev, formData as IncentiveTier].sort((a, b) => b.minScore - a.minScore));
    }
    handleCloseModal();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
        setTiers(prev => prev.filter(t => t.id !== deleteTargetId));
        setDeleteTargetId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-blue-600" />
            ตั้งค่าเกณฑ์รายได้ (Incentive)
          </h2>
          <p className="text-slate-500 text-sm">กำหนดจำนวนเงินที่ได้รับตามระดับคะแนนความประพฤติ</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          เพิ่มเกณฑ์
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
         <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold text-sm">
                 <tr>
                   <th className="p-4 border-b">ชื่อเกณฑ์</th>
                   <th className="p-4 border-b text-center">ช่วงคะแนน</th>
                   <th className="p-4 border-b text-right">เงินรางวัล (บาท)</th>
                   <th className="p-4 border-b text-center">จัดการ</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                 {tiers.sort((a,b) => b.minScore - a.minScore).map(tier => (
                   <tr key={tier.id} className="border-b last:border-b-0 hover:bg-slate-50">
                     <td className="p-4 font-medium text-slate-800">{tier.name}</td>
                     <td className="p-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                          {tier.minScore} - {tier.maxScore}
                        </span>
                     </td>
                     <td className="p-4 text-right font-mono text-slate-700 font-bold">
                        {new Intl.NumberFormat('th-TH').format(tier.amount)}
                     </td>
                     <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button onClick={() => handleOpenModal(tier)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit size={16} /></button>
                           <button onClick={() => handleDeleteClick(tier.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                        </div>
                     </td>
                   </tr>
                 ))}
                 {tiers.length === 0 && (
                   <tr>
                     <td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีการตั้งค่าเกณฑ์รายได้</td>
                   </tr>
                 )}
              </tbody>
            </table>
         </div>

         <div className="max-w-4xl mx-auto mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
           <AlertTriangle className="text-blue-600 shrink-0" size={20} />
           <div className="text-sm text-blue-800">
             <p className="font-bold">หมายเหตุ:</p>
             <p>ระบบจะใช้เกณฑ์เหล่านี้ในการคำนวณ "เงินรางวัลตามเกณฑ์" ในหน้ารายการรับเงินโดยอัตโนมัติ โดยอ้างอิงจากคะแนนคงเหลือของพนักงาน ณ ปัจจุบัน</p>
           </div>
         </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800">{editingTier ? 'แก้ไขเกณฑ์' : 'เพิ่มเกณฑ์ใหม่'}</h3>
               <button onClick={handleCloseModal}><X size={20} className="text-slate-400" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อเกณฑ์ (เช่น เกรด A)</label>
                   <input 
                      required 
                      type="text" 
                      className="w-full border border-slate-300 bg-white text-slate-900 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData.name || ''} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">คะแนนต่ำสุด</label>
                      <input 
                        required 
                        type="number" 
                        min="0" 
                        max="100" 
                        className="w-full border border-slate-300 bg-white text-slate-900 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.minScore !== undefined ? formData.minScore : ''} 
                        onChange={e => setFormData({...formData, minScore: parseInt(e.target.value)})} 
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">คะแนนสูงสุด</label>
                      <input 
                        required 
                        type="number" 
                        min="0" 
                        max="100" 
                        className="w-full border border-slate-300 bg-white text-slate-900 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.maxScore !== undefined ? formData.maxScore : ''} 
                        onChange={e => setFormData({...formData, maxScore: parseInt(e.target.value)})} 
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนเงินรางวัล (บาท)</label>
                   <input 
                      required 
                      type="number" 
                      min="0" 
                      className="w-full border border-slate-300 bg-white text-slate-900 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
                      value={formData.amount !== undefined ? formData.amount : ''} 
                      onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})} 
                   />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                   <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">ยกเลิก</button>
                   <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">บันทึก</button>
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
                        คุณแน่ใจหรือไม่ที่จะลบเกณฑ์รายได้นี้?<br/>
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
