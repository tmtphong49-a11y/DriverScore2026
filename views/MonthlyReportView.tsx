import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  PieChart, 
  Activity, 
  Printer, 
  Download, 
  X, 
  Upload, 
  ImageIcon, 
  PenTool, 
  CheckCircle, 
  FileText, 
  ClipboardCheck, 
  UserCheck, 
  Award, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  Settings2, 
  LayoutDashboard, 
  Trash2, 
  AlertCircle, 
  TrendingUp, 
  Star, 
  ChevronRight, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Employee, DeductionRecord, IncentiveTier, DeductionCode, AppConfig, MasterSignatures } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbweIktVpIc-LxBZNABAmAjcXTiZ03DHElabkAk6mvCQcfSBP_lQmG8WSuJLh41dRzzO/exec';

interface MonthlyReportViewProps {
  employees: Employee[];
  records: DeductionRecord[];
  incentiveTiers: IncentiveTier[];
  deductionCodes: DeductionCode[];
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

interface SignatureData {
  employeeId: string;
  month: string;
  signatureImage: string;
  timestamp: string;
}

interface ApproverData {
    id: string;
    role: string;
    label: string;
    signature: string | null;
    date: string;
    status: 'approved' | 'rejected' | null;
}

interface ApprovalsState {
    supervisor: ApproverData;
    asstManager: ApproverData;
    srManager: ApproverData;
    hrManager: ApproverData;
    evpHr: ApproverData;
}

const INITIAL_APPROVALS: ApprovalsState = {
    supervisor: { id: 'supervisor', role: 'หัวหน้างาน Supervisor', label: 'ผู้ขออนุมัติ', signature: null, date: '', status: null },
    asstManager: { id: 'asstManager', role: 'Asst.Manager', label: 'อนุมัติ / ไม่อนุมัติ', signature: null, date: '', status: 'approved' },
    srManager: { id: 'srManager', role: 'Sr.Manager / Director / EVP Operation', label: 'อนุมัติ / ไม่อนุมัติ', signature: null, date: '', status: 'approved' },
    hrManager: { id: 'hrManager', role: 'HR Manager', label: 'ผู้ขออนุมัติ', signature: null, date: '', status: null },
    evpHr: { id: 'evpHr', role: 'EVP - HR', label: 'อนุมัติ / ไม่อนุมัติ', signature: null, date: '', status: 'approved' },
};

export const MonthlyReportView = ({ employees, records, incentiveTiers, deductionCodes, config, setConfig }: MonthlyReportViewProps) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState<string | null>(null); // 'logo' | roleKey | null
  
  const [signatures, setSignatures] = useState<SignatureData[]>(() => {
    const saved = localStorage.getItem('employee_signatures');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [approvals, setApprovals] = useState<ApprovalsState>(() => {
      const saved = localStorage.getItem(`mgmt_approvals_${selectedMonth}`);
      return saved ? JSON.parse(saved) : INITIAL_APPROVALS;
  });
  const [activeSigningRole, setActiveSigningRole] = useState<keyof ApprovalsState | null>(null);

  useEffect(() => {
      const saved = localStorage.getItem(`mgmt_approvals_${selectedMonth}`);
      setApprovals(saved ? JSON.parse(saved) : INITIAL_APPROVALS);
  }, [selectedMonth]);

  const saveApprovals = (newState: ApprovalsState) => {
      setApprovals(newState);
      localStorage.setItem(`mgmt_approvals_${selectedMonth}`, JSON.stringify(newState));
  };

  const reportContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | keyof MasterSignatures) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploadingImage(type);
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
                  fileName: `${type}_${Date.now()}_${file.name}`
              })
          });
          const result = await response.json();
          if (result.status === 'success') {
              if (type === 'logo') {
                  setConfig(prev => ({ ...prev, logoUrl: result.url }));
              } else {
                  setConfig(prev => ({
                      ...prev,
                      masterSignatures: { ...prev.masterSignatures, [type]: result.url }
                  }));
              }
              alert('✅ อัปโหลดสำเร็จ!\n\n⚠️ อย่าลืมกดปุ่ม "บันทึกลงฐานข้อมูล" (Save to Database) ที่เมนูซ้ายมือ เพื่อบันทึกรูปภาพนี้ไว้อย่างถาวรนะครับ');
          } else {
              if (result.message?.includes('getFolderById')) {
                  alert('❌ ปัญหาที่ Google Drive: โปรดตรวจสอบว่าคุณได้ระบุ FOLDER_ID ในโค้ด AppScript แล้วหรือยัง?');
              } else {
                  alert('เซิร์ฟเวอร์ตอบกลับผิดพลาด: ' + (result.message || 'Unknown error'));
              }
          }
      } catch (error) {
          console.error("Upload failed:", error);
          alert('อัปโหลดไม่สำเร็จ: โปรดตรวจสอบว่าได้ตั้งค่า AppScript เป็น "Anyone" และ Deploy เป็นเวอร์ชันล่าสุดแล้ว');
      } finally {
          setIsUploadingImage(null);
      }
  };

  const removeLogo = () => {
      if(confirm('ต้องการลบโลโก้บริษัทหรือไม่?')) {
          setConfig(prev => ({ ...prev, logoUrl: null }));
      }
  };

  // --- Export Excel (CSV) Logic ---
  const handleExportCSV = () => {
    // 1. Filter Records for the selected month
    const filteredRecords = records.filter(r => r.date.startsWith(selectedMonth));

    if (filteredRecords.length === 0) {
      alert('ไม่มีข้อมูลการหักคะแนนในเดือนที่เลือก');
      return;
    }

    // 2. Prepare Data Rows
    const rows = filteredRecords.map(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        // Escape quotes in text fields to prevent CSV breakage
        const safeDescription = (r.deductionDescription || '').replace(/"/g, '""');
        const safeRemark = (r.remark || '').replace(/"/g, '""');
        const safeEmpName = emp ? `${emp.prefix}${emp.firstName} ${emp.lastName}` : 'Unknown';
        const formattedDate = new Date(r.date).toLocaleDateString('th-TH');
        
        return [
            `"${formattedDate}"`,
            `"${r.employeeId}"`,
            `"${safeEmpName}"`,
            `"${emp?.position || '-'}"`,
            `"${emp?.department || '-'}"`,
            `"${r.deductionCodeCode}"`,
            `"${safeDescription}"`,
            `-${r.points}`, // Negative points
            `"${safeRemark}"`
        ];
    });

    // 3. Add Header
    const header = ['วันที่', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'แผนก', 'รหัสความผิด', 'รายละเอียดความผิด', 'คะแนนที่หัก', 'หมายเหตุ'];
    
    // 4. Combine (Add BOM \uFEFF for Excel Thai support)
    const csvContent = "\uFEFF" + [header.join(','), ...rows.map(e => e.join(','))].join('\n');

    // 5. Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Deduction_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportEmployees = useMemo(() => {
    return employees
      .map(e => {
        const empScore = Number(e.score || 0);
        const matchedTier = incentiveTiers.find(t => 
            empScore >= Number(t.minScore) && 
            empScore <= Number(t.maxScore)
        );
        
        // REVISED LOGIC (Requested Update):
        // 1. Projected Incentive = Base Position Allowance from Employee Data (Not calculated from Tier)
        const projectedIncentive = Number(e.positionAllowance || 0);
        
        // 2. Actual Pay = Score-based Incentive (Tier Amount) OR 0 if ineligible
        const tierAmount = Number(matchedTier?.amount || 0);
        const actualPay = e.noPositionAllowance ? 0 : tierAmount;

        return { 
            ...e, 
            score: empScore, 
            projectedIncentive: projectedIncentive, // Shows "Position Allowance (Base)"
            actualIncentive: actualPay,             // Shows calculated amount based on score/grade
            grade: matchedTier?.name || 'N/A' 
        };
      })
      // Sorting by ID (Numeric Aware) Low -> High
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  }, [employees, incentiveTiers]);

  const ITEMS_PER_PAGE = 25; 
  const SAFE_ROWS_FOR_SIGNATURE = 15; 

  const employeePages = useMemo(() => {
      const pages = [];
      for (let i = 0; i < reportEmployees.length; i += ITEMS_PER_PAGE) {
          pages.push(reportEmployees.slice(i, i + ITEMS_PER_PAGE));
      }
      if (pages.length === 0) pages.push([]); 

      const lastPage = pages[pages.length - 1];
      if (lastPage.length > SAFE_ROWS_FOR_SIGNATURE) {
          pages.push([]); 
      }
      return pages;
  }, [reportEmployees]);

  const { monthName, yearCE } = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return { monthName: months[parseInt(month) - 1], yearCE: parseInt(year) };
  }, [selectedMonth]);

  const handleSignConfirm = () => {
      if (!activeSigningRole) return;
      const signatureImg = config.masterSignatures[activeSigningRole];
      if (!signatureImg) {
          alert('กรุณาอัพโหลดลายเซ็นต้นฉบับในส่วนตั้งค่าก่อน');
          return;
      }
      const newState = {
          ...approvals,
          [activeSigningRole]: {
              ...approvals[activeSigningRole],
              signature: signatureImg,
              date: `${selectedMonth}-01`
          }
      };
      saveApprovals(newState);
      setActiveSigningRole(null);
  };

  const handleDownloadPDF = async () => {
    setIsPreviewMode(true);
    setIsGenerating(true);
    
    setTimeout(async () => {
        if (!reportContainerRef.current) return;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pages = reportContainerRef.current.querySelectorAll('.report-page');
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i] as HTMLElement;
            const canvas = await html2canvas(page, { 
                scale: 2, 
                useCORS: true, 
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }
        pdf.save(`Incentive_Report_${selectedMonth}.pdf`);
        setIsGenerating(false);
    }, 1000);
  };

  const MgmtSignCard = ({ roleKey }: { roleKey: keyof ApprovalsState }) => {
      const data = approvals[roleKey];
      const isSigned = !!data.signature;
      const hasMaster = !!config.masterSignatures[roleKey];
      return (
          <div className={`bg-white p-4 rounded-xl border transition-all shadow-sm ${isSigned ? 'border-green-200 bg-green-50/20' : 'border-slate-200 hover:border-blue-300'}`}>
              <div className="flex justify-between items-start mb-2">
                  <div className={`p-1.5 rounded-lg ${isSigned ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                      <UserCheck size={18} />
                  </div>
                  {isSigned ? <CheckCircle2 size={16} className="text-green-500" /> : <Clock size={16} className="text-slate-300" />}
              </div>
              <h4 className="font-bold text-slate-800 text-[10px] leading-tight mb-0.5 truncate">{data.role}</h4>
              <p className="text-[9px] text-slate-500 mb-2">{data.label}</p>
              {isSigned ? (
                  <div className="space-y-1.5">
                      <div className="bg-white border border-green-100 rounded flex justify-center h-8 overflow-hidden">
                          <img src={data.signature!} alt="sig" className="h-full object-contain p-1" crossOrigin="anonymous" />
                      </div>
                      <div className="flex justify-between items-center text-[9px]">
                          <span className="text-slate-400 font-mono">{new Date(data.date).toLocaleDateString('th-TH')}</span>
                          <button onClick={() => saveApprovals({ ...approvals, [roleKey]: { ...INITIAL_APPROVALS[roleKey] } })} className="text-red-500 hover:underline font-bold">ลบ</button>
                      </div>
                  </div>
              ) : (
                  <button 
                    disabled={!hasMaster}
                    onClick={() => setActiveSigningRole(roleKey)}
                    className={`w-full py-1 rounded-lg text-[9px] font-bold transition-all ${hasMaster ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                      ลงนาม
                  </button>
              )}
          </div>
      );
  };

  const MasterSignSettingCard = ({ roleKey, label, role }: { roleKey: keyof MasterSignatures, label: string, role: string }) => {
      const img = config.masterSignatures[roleKey];
      const isUploading = isUploadingImage === roleKey;
      return (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-full text-left mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <h4 className="font-bold text-slate-800 text-xs truncate">{role}</h4>
              </div>
              <div className="w-full aspect-[3/1] bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center overflow-hidden mb-3 group relative">
                  {isUploading ? (
                      <RefreshCw size={20} className="animate-spin text-blue-500" />
                  ) : img ? (
                      <>
                        <img src={img} alt="Sign" className="h-full object-contain p-2" crossOrigin="anonymous" />
                        <button 
                            onClick={() => setConfig(prev => ({...prev, masterSignatures: {...prev.masterSignatures, [roleKey]: null}}))}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={12} />
                        </button>
                      </>
                  ) : (
                      <PenTool size={20} className="text-slate-200" />
                  )}
              </div>
              <label className="w-full">
                  <div className="w-full py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Upload size={12} /> {img ? 'เปลี่ยน' : 'อัพโหลด'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, roleKey)} />
              </label>
          </div>
      )
  };
  
  const SignBox = ({ title, signature, role, date, isApproveBox }: any) => (
      <div className="flex flex-col h-full justify-between text-center py-1 px-2">
          <div className="font-bold text-[10px] leading-tight mt-2">
              {isApproveBox ? (
                  <span><span className="text-blue-700 underline">อนุมัติ</span> / ไม่อนุมัติ</span>
              ) : title}
          </div>
          <div className="flex-1 flex items-end justify-center w-full pb-1 min-h-[12mm]">
              {signature && <img src={signature} className="max-h-[12mm] max-w-full object-contain mb-1" crossOrigin="anonymous" />}
          </div>
          <div className="w-full flex flex-col items-center">
              <div className="w-[90%] border-b border-black mb-1"></div>
              <div className="font-bold text-[9px] leading-tight">{role}</div>
              <div className="text-[9px] leading-tight mt-0.5">{date}</div>
          </div>
      </div>
  );

  const ManagerSignBox = ({ signature, role, date }: any) => (
      <div className="flex flex-col h-full justify-between text-center py-1 px-2">
          <div className="font-bold text-[10px] leading-tight mt-2">
              <span><span className="text-blue-700 underline">อนุมัติ</span> / ไม่อนุมัติ</span>
          </div>
          <div className="flex-1 flex items-center justify-center w-full relative min-h-[12mm]">
               <div className="flex-1 flex justify-center items-end h-full pb-1">
                   {signature && <img src={signature} className="max-h-[12mm] object-contain mb-1" crossOrigin="anonymous" />}
               </div>
               <div className="text-4xl font-normal text-black mx-2 self-center mb-2">/</div>
               <div className="flex-1 flex justify-center items-end h-full pb-1">
                   {/* Placeholder for second signature if needed */}
               </div>
          </div>
          <div className="w-full flex flex-col items-center">
              <div className="w-[90%] border-b border-black mb-1"></div>
              <div className="font-bold text-[9px] leading-tight">{role}</div>
              <div className="text-[9px] leading-tight mt-0.5">{date}</div>
          </div>
      </div>
  );


  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <style>{`
        @media print { .no-print { display: none !important; } }
        .report-page { box-sizing: border-box; }
        .pdf-cell-content { display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; line-height: 1; padding-bottom: 10px; }
        
        /* Ultra-Thin Hairline Borders for PDF */
        .report-page table, .report-page .border-table {
          border-collapse: collapse !important;
          width: 100%;
        }
        
        .report-page th, 
        .report-page td,
        .report-page .border,
        .report-page .border-black,
        .report-page .border-b,
        .report-page .border-r,
        .report-page .border-l,
        .report-page .border-y,
        .report-page .border-t {
          border-width: 0.1px !important; /* Thinnest possible line */
          border-style: solid !important;
          border-color: #000000 !important;
        }

        /* Specific Dot Line Style to override global border settings */
        .report-page .dot-line {
            border-bottom: 1px dotted #000 !important;
            height: 1px;
            width: 100%;
        }

        .thai-title-bar { 
          background-color: #d1d5db; 
          height: 42px; 
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          color: black;
          width: 100%;
        }
        
        .thai-title-text {
          font-weight: bold;
          font-size: 19px;
          line-height: 1;
          padding-top: 10px; 
          padding-bottom: 2px;
        }
      `}</style>

      <div className={`flex flex-col h-full ${isPreviewMode ? 'hidden' : ''}`}>
          <div className="p-6 bg-white border-b border-slate-200 flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="text-blue-600" />
                รายงานและวิเคราะห์ข้อมูลประจำเดือน
              </h2>
              <p className="text-slate-500 text-sm">ข้อมูลเดือน {monthName} พ.ศ. {yearCE + 543}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <input type="month" className="bg-slate-100 p-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
                
                {/* Export Excel Button */}
                <button 
                    onClick={handleExportCSV} 
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-bold text-sm transition-transform active:scale-95"
                >
                    <FileSpreadsheet size={18} /> Export Excel (CSV)
                </button>

                <button onClick={() => setIsPreviewMode(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-bold text-sm transition-transform active:scale-95">
                    <Printer size={18} /> ดูตัวอย่างรายงาน (PDF)
                </button>
            </div>
          </div>

          <div className="p-6 bg-white border-b border-slate-100">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                  <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ภาพรวมและลงนาม</button>
                  <button onClick={() => setActiveTab('setup')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'setup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ตั้งค่าองค์ประกอบรายงาน</button>
              </div>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-8">
              {activeTab === 'dashboard' ? (
                <div className="max-w-7xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <MgmtSignCard roleKey="supervisor" />
                      <MgmtSignCard roleKey="asstManager" />
                      <MgmtSignCard roleKey="srManager" />
                      <MgmtSignCard roleKey="hrManager" />
                      <MgmtSignCard roleKey="evpHr" />
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm flex items-center gap-2">
                      <AlertCircle size={18} />
                      อย่าลืมกดปุ่ม <strong>"บันทึกลงฐานข้อมูล"</strong> ที่เมนูซ้ายมือหลังจากอัปโหลดโลโก้หรือลายเซ็น เพื่อบันทึกข้อมูลแบบถาวร
                  </div>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ImageIcon size={20} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800">โลโก้บริษัท</h3>
                                <p className="text-xs text-slate-500 font-bold">Company Brand Logo</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-48 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden group relative">
                                {isUploadingImage === 'logo' ? <RefreshCw size={24} className="animate-spin text-blue-500" /> : config.logoUrl ? (
                                    <>
                                        <img src={config.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-4" crossOrigin="anonymous" />
                                        <button onClick={removeLogo} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={24} className="text-white" /></button>
                                    </>
                                ) : <ImageIcon size={40} className="text-slate-200" />}
                            </div>
                            <div className="flex-1 space-y-4">
                                <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg cursor-pointer transition-all">
                                    <Upload size={18} />
                                    {config.logoUrl ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้ใหม่'}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-200">
                        <MasterSignSettingCard roleKey="supervisor" label="Pos 1" role="หัวหน้างาน Supervisor" />
                        <MasterSignSettingCard roleKey="asstManager" label="Pos 2" role="Asst.Manager" />
                        <MasterSignSettingCard roleKey="srManager" label="Pos 3" role="Sr.Manager / Director / EVP Operation" />
                        <MasterSignSettingCard roleKey="hrManager" label="Pos 4" role="HR Manager" />
                        <MasterSignSettingCard roleKey="evpHr" label="Pos 5" role="EVP - HR" />
                    </div>
                </div>
              )}
          </div>
      </div>

      {activeSigningRole && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><PenTool size={32} /></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">ลงนามอนุมัติ</h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 flex justify-center h-20">
                      <img src={config.masterSignatures[activeSigningRole]!} className="h-full object-contain" crossOrigin="anonymous" />
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setActiveSigningRole(null)} className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50">ยกเลิก</button>
                      <button onClick={handleSignConfirm} className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-700 shadow-lg">ยืนยันลงนาม</button>
                  </div>
              </div>
          </div>
      )}

      {isPreviewMode && (
          <div className="fixed inset-0 z-50 bg-slate-900/90 overflow-y-auto flex justify-center py-8 no-print">
              <div className="fixed top-4 right-4 flex gap-3 z-50">
                  {isGenerating ? (
                      <div className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-xl animate-pulse">
                          <RefreshCw size={18} className="animate-spin" /> กำลังสร้าง PDF...
                      </div>
                  ) : (
                    <>
                      <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-xl hover:bg-green-700"><Download size={18} /> ดาวน์โหลด PDF</button>
                      <button onClick={() => setIsPreviewMode(false)} className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold border border-white/20"><X size={18} /> ปิด</button>
                    </>
                  )}
              </div>
              
              <div ref={reportContainerRef} className="flex flex-col gap-8 pb-20">
                  {employeePages.map((pageEmployees, pageIndex) => {
                      const reportDateString = new Date(`${selectedMonth}-01`).toLocaleDateString('th-TH');

                      return (
                      <div key={pageIndex} className="report-page bg-white text-black font-['Sarabun'] w-[210mm] min-h-[297mm] shadow-2xl p-[15mm] relative flex flex-col">
                          <div className="w-full">
                              <div className="mb-2 h-12 flex items-center">
                                  {config.logoUrl && <img src={config.logoUrl} className="h-full object-contain" crossOrigin="anonymous" />}
                              </div>
                              
                              <div className="thai-title-bar">
                                  <div className="thai-title-text">
                                      ใบขอเสนอรายชื่อเพื่อรับเงินพิเศษโฟล์คลิฟท์
                                  </div>
                              </div>

                              <div className="flex flex-col items-center justify-center text-sm text-black mb-2 space-y-1">
                                  <div className="flex gap-8 font-bold leading-none"><div>ประจำเดือน: <span className="font-normal ml-2">{monthName}</span></div><div>ปี: <span className="font-normal ml-2">{yearCE}</span></div></div>
                                  <div className="flex gap-16 font-bold leading-none"><div>ด้วยแผนก <span className="font-normal ml-2">Warehouse 1</span></div><div>ฝ่าย <span className="font-normal ml-2">Logistics</span></div></div>
                                  <div className="mt-1 text-center leading-none">มีความประสงค์จะขอเสนอรายชื่อเงินพิเศษ พนักงานควบคุมโฟล์คลิฟท์ ที่มีสิทธิ์ได้รับเงินพิเศษ</div>
                              </div>
                              
                              {pageEmployees.length > 0 && (
                                <table className="w-full border-collapse border border-black text-xs mb-4">
                                    <thead>
                                        <tr className="bg-[#e5e7eb] h-10">
                                            <th className="border border-black py-1 w-10"><div className="pdf-cell-content">ลำดับ</div></th>
                                            <th className="border border-black py-1 w-24"><div className="pdf-cell-content">รหัสพนักงาน</div></th>
                                            <th className="border border-black py-1"><div className="pdf-cell-content justify-start px-3 text-left">ชื่อ-สกุล</div></th>
                                            <th className="border border-black py-1 w-32"><div className="pdf-cell-content">ตำแหน่ง</div></th>
                                            <th className="border border-black py-1 w-20"><div className="pdf-cell-content">เงินโครงการ</div></th>
                                            <th className="border border-black py-1 w-20"><div className="pdf-cell-content">จ่ายจริง</div></th>
                                            <th className="border border-black py-1 w-28 text-[9px]"><div className="pdf-cell-content">พนักงานเซ็นรับทราบ</div></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageEmployees.map((emp, i) => (
                                            <tr key={emp.id} className="text-center h-8 text-[11px]">
                                                <td className="border border-black py-1"><div className="pdf-cell-content">{(pageIndex * ITEMS_PER_PAGE) + i + 1}</div></td>
                                                <td className="border border-black py-1"><div className="pdf-cell-content">{emp.id}</div></td>
                                                <td className="border border-black py-1"><div className="pdf-cell-content justify-start px-3 text-left">{emp.prefix}{emp.firstName} {emp.lastName}</div></td>
                                                <td className="border border-black py-1"><div className="pdf-cell-content">{emp.position}</div></td>
                                                {/* Projected Incentive (เงินโครงการ) - Shows Base Position Allowance */}
                                                <td className="border border-black py-1 font-bold"><div className="pdf-cell-content">{new Intl.NumberFormat('th-TH').format(emp.projectedIncentive)}</div></td>
                                                {/* Actual Pay (จ่ายจริง) - Shows Calculated Amount (or 0 if ineligible) */}
                                                <td className="border border-black py-1 font-bold"><div className="pdf-cell-content">{new Intl.NumberFormat('th-TH').format(emp.actualIncentive)}</div></td>
                                                <td className="border border-black py-1">
                                                    <div className="pdf-cell-content">
                                                        {signatures.find(s => s.employeeId === emp.id && s.month === selectedMonth) && <img src={signatures.find(s => s.employeeId === emp.id && s.month === selectedMonth)!.signatureImage} className="h-5 mx-auto object-contain" crossOrigin="anonymous" />}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                              )}
                          </div>
                          
                          {pageIndex === employeePages.length - 1 && (
                            <div className="w-full text-[11px] border-table border-black overflow-hidden">
                                <div className="p-2 border-b border-black font-bold leading-tight">เหตุผลในการเสนอชื่อพนักงาน : <span className="font-normal ml-1">เพื่อเป็นขวัญและกำลังใจในการปฏิบัติงาน เพิ่มความรับผิดชอบในหน้าที่ ตามเงื่อนไขที่พนักงานจะต้องปฏิบัติตามกฎระเบียบและข้อบังคับการใช้งาน ที่ได้รับมอบหมาย โดยคุณสมบัติของพนักงาน ให้เป็นไปตามโครงการพนักงานขับรถโฟล์คลิฟท์มืออาชีพที่กำหนดไว้</span></div>
                                
                                <table className="w-full border-collapse">
                                    <tbody>
                                        <tr className="bg-[#b1b5bd] h-7">
                                            <td colSpan={3} className="border-b border-black font-bold px-2 text-[10px]"><div className="flex h-full items-center">ความเห็นผู้บริหาร :</div></td>
                                        </tr>
                                        <tr>
                                            <td className="border-r border-black w-[25%] p-4 h-[32mm] align-middle">
                                                <div className="flex flex-col gap-5 justify-center h-full">
                                                    <div className="w-full dot-line"></div>
                                                    <div className="w-full dot-line"></div>
                                                    <div className="w-full dot-line"></div>
                                                </div>
                                            </td>
                                            <td className="border-r border-black w-[25%] p-0 h-[32mm]">
                                                <SignBox title="ผู้ขออนุมัติ" signature={approvals.supervisor.signature} role="หัวหน้างาน / Supervisor" date={reportDateString} />
                                            </td>
                                            <td className="w-[50%] p-0 h-[32mm]">
                                                <ManagerSignBox 
                                                    signature={approvals.asstManager.signature || approvals.srManager.signature} 
                                                    role="Manager / Director / EVP operations" 
                                                    date={reportDateString} 
                                                />
                                            </td>
                                        </tr>
                                        
                                         <tr className="bg-[#b1b5bd] border-t border-black h-7">
                                            <td colSpan={3} className="border-b border-black font-bold px-2 text-[10px]"><div className="flex h-full items-center">บันทึกฝ่ายทรัพยากรบุคคล :</div></td>
                                        </tr>
                                        <tr>
                                            <td className="border-r border-black w-[25%] p-4 h-[32mm] align-middle">
                                                <div className="flex flex-col gap-5 justify-center h-full">
                                                    <div className="w-full dot-line"></div>
                                                    <div className="w-full dot-line"></div>
                                                    <div className="w-full dot-line"></div>
                                                </div>
                                            </td>
                                            <td className="border-r border-black w-[25%] p-0 h-[32mm]">
                                                <SignBox title="ผู้ขออนุมัติ" signature={approvals.hrManager.signature} role="HR Manager" date="วันที่............../............./.........." />
                                            </td>
                                            <td className="w-[50%] p-0 h-[32mm]">
                                                <SignBox isApproveBox={true} signature={approvals.evpHr.signature} role="EVP - HR" date="วันที่................/............./..........." />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                          )}

                          <div className="absolute bottom-4 right-8 text-[10px] text-gray-400">
                             Page {pageIndex + 1} of {employeePages.length}
                          </div>
                      </div>
                  )})}
              </div>
          </div>
      )}
    </div>
  );
};