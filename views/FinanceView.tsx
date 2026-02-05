
import React, { useState, useMemo } from 'react';
import { DollarSign, ChevronUp, ChevronDown, Trophy, CheckCircle, AlertCircle, TrendingDown, Target, Calendar, RefreshCcw } from 'lucide-react';
import { Employee, DeductionRecord, IncentiveTier } from '../types';

interface FinanceViewProps {
  employees: Employee[];
  records: DeductionRecord[];
  incentiveTiers: IncentiveTier[];
}

export const FinanceView = ({ employees, records, incentiveTiers }: FinanceViewProps) => {
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current YYYY-MM

  const toggleExpand = (id: string) => {
    setExpandedEmployeeId(expandedEmployeeId === id ? null : id);
  };

  const formatMoney = (amount: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(amount);

  // Helper to get incentive based on calculated score
  const getIncentive = (score: number) => {
    const tier = incentiveTiers.find(t => score >= t.minScore && score <= t.maxScore);
    return tier ? tier.amount : 0;
  };

  // Helper for Thai Date
  const getThaiMonthYear = (dateStr: string) => {
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-blue-600" />
            รายการรายรับเงิน (Incentive)
            </h2>
            <p className="text-slate-500 text-sm">คำนวณยอดเงินรางวัลตามเดือนที่เลือก (คะแนนเริ่มต้นใหม่ทุกเดือน)</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
            <Calendar size={20} className="text-slate-500 ml-2" />
            <span className="text-sm font-bold text-slate-700 hidden sm:inline">ประจำเดือน:</span>
            <input 
                type="month" 
                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none font-bold" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
            />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-slate-50">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
           {/* Summary Header for Month */}
           <div className="bg-blue-50/50 px-6 py-3 border-b border-blue-100 flex justify-between items-center text-sm">
                <span className="font-bold text-blue-800 flex items-center gap-2">
                    <RefreshCcw size={16} />
                    สรุปข้อมูลประจำเดือน: {getThaiMonthYear(selectedMonth)}
                </span>
                <span className="text-blue-600 text-xs bg-white px-2 py-1 rounded border border-blue-200 font-medium shadow-sm">
                    สูตรคำนวณ: 100 (ตั้งต้น) - คะแนนที่ถูกหัก = คะแนนสุทธิ
                </span>
           </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-semibold text-sm">
                <tr>
                  <th className="p-4 border-b w-10"></th>
                  <th className="p-4 border-b">พนักงาน</th>
                  <th className="p-4 border-b text-right text-slate-500">ค่าตำแหน่งเต็ม (Max)</th>
                  <th className="p-4 border-b text-center">คะแนนประจำเดือน</th>
                  <th className="p-4 border-b text-right text-blue-700 bg-blue-50/50">ยอดจ่ายจริง (ตามเกณฑ์)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {employees.map(emp => {
                  // 1. Filter Records by Selected Month AND Employee ID
                  const empMonthRecords = records.filter(r => 
                      String(r.employeeId).trim() === String(emp.id).trim() &&
                      r.date.startsWith(selectedMonth)
                  );
                  
                  // 2. Calculate Deduction Points for this Month
                  const totalDeductionsInMonth = empMonthRecords.reduce((sum, r) => sum + r.points, 0);

                  // 3. Calculate Monthly Score (Base 100 - Month Deductions)
                  // Note: Assuming incentive resets every month starting at 100
                  const monthlyScore = Math.max(0, 100 - totalDeductionsInMonth);
                  
                  // 4. Calculate Incentive based on Monthly Score
                  const calculatedIncentive = getIncentive(monthlyScore);
                  const actualPayable = emp.noPositionAllowance ? 0 : calculatedIncentive;
                  
                  const isExpanded = expandedEmployeeId === emp.id;

                  // Determine comparison color
                  const isFullAmount = actualPayable >= emp.positionAllowance;
                  const incomeColor = emp.noPositionAllowance ? 'text-slate-400' : (isFullAmount ? 'text-green-700' : 'text-orange-600');

                  return (
                    <React.Fragment key={emp.id}>
                      <tr 
                        className={`border-b last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''}`}
                        onClick={() => toggleExpand(emp.id)}
                      >
                        <td className="p-4 text-center">
                          {isExpanded ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={emp.avatarUrl} alt={emp.firstName} className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300" />
                            <div>
                              <p className="font-semibold text-slate-800">{emp.prefix} {emp.firstName} {emp.lastName}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500">{emp.position}</p>
                                {emp.noPositionAllowance && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">ไม่ได้รับค่าตำแหน่ง</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-400 font-medium">
                          {formatMoney(emp.positionAllowance)}
                        </td>
                        <td className="p-4 text-center">
                           <div className="flex flex-col items-center">
                               {/* Show Calculation Breakdown */}
                               <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mb-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    <span className="text-slate-600">100</span>
                                    <span>-</span>
                                    <span className={totalDeductionsInMonth > 0 ? "text-red-500 font-bold" : "text-slate-600"}>{totalDeductionsInMonth}</span>
                                    <span>=</span>
                               </div>
                               <span className={`inline-block px-3 py-1 rounded-md font-bold text-sm shadow-sm border ${monthlyScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' : monthlyScore >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                 {monthlyScore}
                               </span>
                           </div>
                        </td>
                        <td className={`p-4 text-right font-black font-mono text-base bg-blue-50/30 ${incomeColor}`}>
                          {emp.noPositionAllowance ? '-' : formatMoney(actualPayable)}
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 border-b">
                          <td colSpan={5} className="p-0">
                            <div className="p-4 pl-16 pr-4 animate-fadeIn">
                               <div className="mb-3 flex flex-wrap items-center gap-4 text-sm bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2 text-slate-600">
                                      <Target size={16} className="text-blue-500" />
                                      <span>ฐานค่าตำแหน่ง: <strong>{formatMoney(emp.positionAllowance)}</strong></span>
                                  </div>
                                  <div className="w-px h-4 bg-slate-300"></div>
                                  <div className="flex items-center gap-2 text-slate-600">
                                      <Trophy size={16} className={emp.noPositionAllowance ? 'text-slate-400' : 'text-yellow-500'} />
                                      <span>เกณฑ์ที่ได้รับ ({getThaiMonthYear(selectedMonth)}): </span>
                                      {emp.noPositionAllowance ? (
                                        <span className="text-red-600 font-medium flex items-center gap-1">
                                            <AlertCircle size={14} /> ไม่ได้รับเงินรางวัล (ระบุสถานะไม่ได้รับค่าตำแหน่ง)
                                        </span>
                                      ) : (
                                        <>
                                            <strong>{incentiveTiers.find(t => monthlyScore >= t.minScore && monthlyScore <= t.maxScore)?.name || 'ไม่เข้าเกณฑ์'}</strong> 
                                            <span>({incentiveTiers.find(t => monthlyScore >= t.minScore && monthlyScore <= t.maxScore)?.minScore}-{incentiveTiers.find(t => monthlyScore >= t.minScore && monthlyScore <= t.maxScore)?.maxScore} คะแนน)</span>
                                        </>
                                      )}
                                  </div>
                               </div>
                               
                               {(emp.pendingDeductionPoints || 0) > 0 && (
                                   <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 flex items-center gap-2">
                                       <AlertCircle size={16} />
                                       <span>พนักงานมียอดคะแนนติดลบสะสม รอหักในเดือนถัดไปจำนวน <strong>{emp.pendingDeductionPoints}</strong> คะแนน</span>
                                   </div>
                               )}

                              {empMonthRecords.length > 0 ? (
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase flex justify-between items-center">
                                    <span>ประวัติการถูกหักคะแนน (เฉพาะเดือน {getThaiMonthYear(selectedMonth)})</span>
                                    <span className="text-red-600">รวมหัก: -{totalDeductionsInMonth} แต้ม</span>
                                  </div>
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                      <tr>
                                        <th className="p-3 text-left font-medium">วันที่</th>
                                        <th className="p-3 text-left font-medium">รหัส</th>
                                        <th className="p-3 text-left font-medium">รายละเอียดความผิด</th>
                                        <th className="p-3 text-center font-medium">คะแนนที่ถูกหัก</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {empMonthRecords.map(record => (
                                        <tr key={record.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                          <td className="p-3 text-slate-600">{new Date(record.date).toLocaleDateString('th-TH')}</td>
                                          <td className="p-3 font-mono text-slate-500 text-xs">{record.deductionCodeCode}</td>
                                          <td className="p-3 text-slate-800 font-medium">
                                              {record.deductionDescription}
                                              {record.carriedOverPoints ? (
                                                  <span className="block text-[10px] text-red-500">* ยกยอด {record.carriedOverPoints} ไปเดือนหน้า</span>
                                              ) : null}
                                          </td>
                                          <td className="p-3 text-center text-red-600 font-bold">-{record.points}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-slate-400 bg-white border border-slate-200 rounded-lg border-dashed text-sm">
                                  <CheckCircle className="w-5 h-5 mx-auto mb-1 opacity-50 text-green-500" />
                                  ไม่พบประวัติการหักคะแนนในเดือนนี้ (เต็ม 100)
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {incentiveTiers.length === 0 && (
              <div className="p-6 text-center bg-orange-50 text-orange-800 border-t border-orange-100">
                  <AlertCircle className="mx-auto mb-2" />
                  <p className="font-bold">ยังไม่มีการตั้งค่าเกณฑ์รายได้ (Incentive Tiers)</p>
                  <p className="text-sm opacity-80 mt-1">กรุณาไปที่เมนู "ตั้งค่าเกณฑ์รายได้" เพื่อกำหนดจำนวนเงินที่พนักงานจะได้รับตามคะแนน</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
