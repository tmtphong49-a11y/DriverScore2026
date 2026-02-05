
import React, { useMemo } from 'react';
import { 
  Users, 
  TrendingDown, 
  DollarSign, 
  Award, 
  AlertTriangle, 
  ArrowRight, 
  BarChart3, 
  Target,
  Clock,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';
import { Employee, DeductionRecord, DeductionCode, IncentiveTier } from '../types';

interface DashboardViewProps {
  employees: Employee[];
  records: DeductionRecord[];
  deductionCodes: DeductionCode[];
  incentiveTiers: IncentiveTier[];
  onNavigate: (page: string) => void;
}

export const DashboardView = ({ 
  employees, 
  records, 
  deductionCodes, 
  incentiveTiers,
  onNavigate 
}: DashboardViewProps) => {

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // --- Calculations ---

  // 1. Stats
  const totalEmployees = employees.length;
  
  const monthRecords = records.filter(r => r.date.startsWith(currentMonth));
  const totalDeductionPointsMonth = monthRecords.reduce((acc, curr) => acc + curr.points, 0);
  
  const estimatedIncentive = employees.reduce((acc, emp) => {
    if (emp.noPositionAllowance) return acc;
    const tier = incentiveTiers.find(t => emp.score >= t.minScore && emp.score <= t.maxScore);
    return acc + (tier ? tier.amount : 0);
  }, 0);

  const avgScore = totalEmployees > 0 
    ? (employees.reduce((acc, curr) => acc + curr.score, 0) / totalEmployees).toFixed(1) 
    : '0.0';

  // 2. Grade Distribution
  const gradeDistribution = useMemo(() => {
    return incentiveTiers
      .sort((a, b) => b.minScore - a.minScore)
      .map(tier => {
        const count = employees.filter(e => e.score >= tier.minScore && e.score <= tier.maxScore).length;
        const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
        return { ...tier, count, percentage };
      });
  }, [employees, incentiveTiers, totalEmployees]);

  // 3. Top Violations (All time)
  const topViolations = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      counts[r.deductionCodeCode] = (counts[r.deductionCodeCode] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([code, count]) => {
        const def = deductionCodes.find(d => d.code === code);
        return { 
            code, 
            description: def?.description || 'Unknown', 
            count,
            percentage: records.length > 0 ? (count / records.length) * 100 : 0
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records, deductionCodes]);

  // 4. Top/Bottom Performers
  const sortedEmployees = [...employees].sort((a, b) => b.score - a.score);
  const topPerformers = sortedEmployees.filter(e => e.score === 100).slice(0, 5); // Show up to 5 perfect scores
  
  // Update: Only show low performers if score < 100
  const lowPerformers = [...employees]
    .filter(e => e.score < 100) // Only those who lost points
    .sort((a, b) => a.score - b.score)
    .slice(0, 3); // Bottom 3

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="text-blue-600" />
          ภาพรวมระบบ (Dashboard)
        </h2>
        <p className="text-slate-500 text-sm">สรุปสถานะพนักงานและคะแนนความประพฤติ ประจำเดือน {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* 1. Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="พนักงานทั้งหมด" 
                value={totalEmployees} 
                suffix="คน" 
                icon={<Users size={24} className="text-blue-600" />} 
                color="bg-blue-50 text-blue-800 border-blue-100"
            />
             <StatCard 
                title="คะแนนเฉลี่ยรวม" 
                value={avgScore} 
                suffix="/ 100" 
                icon={<Target size={24} className="text-indigo-600" />} 
                color="bg-indigo-50 text-indigo-800 border-indigo-100"
            />
            <StatCard 
                title="หักคะแนนเดือนนี้" 
                value={totalDeductionPointsMonth} 
                suffix="แต้ม" 
                icon={<TrendingDown size={24} className="text-red-600" />} 
                color="bg-red-50 text-red-800 border-red-100"
            />
            <StatCard 
                title="ประมาณการโบนัส" 
                value={new Intl.NumberFormat('th-TH').format(estimatedIncentive)} 
                suffix="บาท" 
                icon={<DollarSign size={24} className="text-green-600" />} 
                color="bg-green-50 text-green-800 border-green-100"
            />
        </div>

        {/* 2. Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Grade Distribution */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 size={20} className="text-slate-400" />
                        การกระจายเกรดพนักงาน (Grade Distribution)
                    </h3>
                    <button onClick={() => onNavigate('settings')} className="text-xs text-blue-600 hover:underline">ตั้งค่าเกณฑ์</button>
                </div>
                <div className="space-y-4">
                    {gradeDistribution.map(tier => (
                        <div key={tier.id}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-bold text-slate-700">{tier.name} <span className="font-normal text-slate-400">({tier.minScore}-{tier.maxScore})</span></span>
                                <span className="font-bold text-slate-600">{tier.count} คน ({Math.round(tier.percentage)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        tier.name.includes('A') ? 'bg-green-500' : 
                                        tier.name.includes('B') ? 'bg-blue-500' : 
                                        tier.name.includes('C') ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} 
                                    style={{ width: `${tier.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {gradeDistribution.length === 0 && <p className="text-center text-slate-400 py-4">ยังไม่มีการตั้งค่าเกณฑ์</p>}
                </div>
            </div>

            {/* Top Violations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <AlertTriangle size={20} className="text-orange-500" />
                    5 อันดับความผิดสูงสุด
                </h3>
                <div className="space-y-5">
                    {topViolations.map((v, i) => (
                        <div key={v.code} className="relative">
                            <div className="flex justify-between items-start mb-1 z-10 relative">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-slate-100 text-slate-500 w-5 h-5 flex items-center justify-center rounded-full">{i + 1}</span>
                                    <div>
                                        <span className="block text-sm font-bold text-slate-700 leading-tight">{v.code}</span>
                                        <span className="block text-xs text-slate-500 truncate max-w-[150px]">{v.description}</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{v.count} ครั้ง</span>
                            </div>
                            <div className="w-full bg-slate-50 rounded-full h-1.5 mt-2">
                                <div className="h-full bg-orange-400 rounded-full opacity-70" style={{ width: `${v.percentage}%` }}></div>
                            </div>
                        </div>
                    ))}
                    {topViolations.length === 0 && <div className="text-center text-slate-400 py-10">ยังไม่มีข้อมูลการหักคะแนน</div>}
                </div>
            </div>
        </div>

        {/* 3. Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Clock size={18} className="text-slate-400" />
                        การหักคะแนนล่าสุด
                    </h3>
                    <button onClick={() => onNavigate('record')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        ดูทั้งหมด <ArrowRight size={12} />
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {records.slice(0, 5).map(rec => {
                         const emp = employees.find(e => e.id === rec.employeeId);
                         return (
                            <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-100">
                                        -{rec.points}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{emp ? `${emp.firstName} ${emp.lastName}` : rec.employeeId}</p>
                                        <p className="text-xs text-slate-500">{rec.deductionCodeCode} - {rec.deductionDescription}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">{new Date(rec.date).toLocaleDateString('th-TH')}</span>
                            </div>
                         );
                    })}
                    {records.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">ไม่มีรายการล่าสุด</div>}
                </div>
            </div>

            {/* Top/Bottom Performers */}
            <div className="grid grid-rows-2 gap-6">
                
                {/* Top Performers */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                        <Award size={18} className="text-yellow-500" />
                        พนักงานคะแนนยอดเยี่ยม (100 คะแนน)
                    </h3>
                    <div className="flex -space-x-2 overflow-hidden py-2 px-1">
                        {topPerformers.length > 0 ? topPerformers.map(emp => (
                            <img 
                                key={emp.id} 
                                className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover bg-slate-100 hover:scale-110 transition-transform" 
                                src={emp.avatarUrl} 
                                alt={emp.firstName} 
                                title={`${emp.firstName} ${emp.lastName}`}
                            />
                        )) : <span className="text-sm text-slate-400 italic">ไม่มีพนักงานคะแนนเต็ม 100</span>}
                        {topPerformers.length > 0 && <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 ring-2 ring-white">+{topPerformers.length}</div>}
                    </div>
                    <div className="mt-auto pt-2">
                        <p className="text-xs text-slate-500">มีพนักงาน {topPerformers.length} คน จากทั้งหมด {totalEmployees} คน ที่รักษาคะแนนได้เต็ม 100</p>
                    </div>
                </div>

                {/* Need Improvement */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                        <TrendingDown size={18} className="text-red-500" />
                        คะแนนต่ำสุด 3 อันดับแรก (ต่ำกว่า 100)
                    </h3>
                    <div className="space-y-3">
                        {lowPerformers.length > 0 ? lowPerformers.map(emp => (
                            <div key={emp.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${emp.score < 50 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                    <span className="text-slate-700">{emp.firstName} {emp.lastName}</span>
                                </div>
                                <span className="font-mono font-bold text-slate-600">{emp.score} คะแนน</span>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-4 text-green-600 bg-green-50 rounded-lg border border-green-100">
                                <CheckCircle2 size={24} className="mb-1" />
                                <span className="text-sm font-bold">ยอดเยี่ยม! พนักงานทุกคนมีคะแนนเต็ม 100</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, suffix, icon, color }: any) => (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${color}`}>
        <div>
            <p className="text-xs font-bold opacity-70 mb-1 uppercase tracking-wide">{title}</p>
            <div className="text-2xl font-black">
                {value} <span className="text-sm font-medium opacity-60 ml-1">{suffix}</span>
            </div>
        </div>
        <div className="p-3 bg-white/40 rounded-lg backdrop-blur-sm">
            {icon}
        </div>
    </div>
);
