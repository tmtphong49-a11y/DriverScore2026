
import React, { useState } from 'react';
import { Lock, User, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { Employee, UserSession } from '../types';

interface LoginViewProps {
  employees: Employee[];
  onLogin: (session: UserSession) => void;
}

export const LoginView = ({ employees, onLogin }: LoginViewProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    // Admin Login Check
    if ((trimmedUsername === 'admin' && password === 'admin1234') || (trimmedUsername === '2222' && password === '2222')) {
      onLogin({ role: 'admin', name: 'System Administrator' });
      return;
    }

    // Employee Login Check
    // Convert both to string to ensure safe comparison
    const employee = employees.find(emp => String(emp.id).trim() === trimmedUsername);

    if (!employee) {
        // Debug info: List available IDs in console (optional)
        console.log('Available IDs:', employees.map(e => e.id));
        setError('ไม่พบชื่อผู้ใช้หรือรหัสพนักงานนี้ในระบบ');
        return;
    }

    // Determine the expected password
    let validPassword = String(employee.id).trim(); // Default: Employee ID
    
    // If a custom password is set, use it
    if (employee.password && String(employee.password).trim().length > 0) {
        validPassword = String(employee.password).trim();
    }

    if (password === validPassword) {
        onLogin({ 
            role: 'employee', 
            employeeId: employee.id, 
            name: `${employee.firstName} ${employee.lastName}` 
        });
        return;
    }

    setError('รหัสผ่านไม่ถูกต้อง');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col mb-4">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center relative">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <AlertTriangle className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Driver Score System</h1>
            <p className="text-blue-100 text-sm">ระบบบริหารจัดการคะแนนพนักงานขับรถ</p>
        </div>

        {/* Form */}
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center font-medium animate-pulse">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อผู้ใช้ / รหัสพนักงาน</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="ระบุชื่อผู้ใช้ (เช่น 65020007)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">รหัสผ่าน</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="password"
                            className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="ระบุรหัสผ่าน"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-2 flex items-start gap-1 text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                        <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                        <span>กรณีเข้าใช้งานครั้งแรก หรือยังไม่ได้เปลี่ยนรหัสผ่าน ให้ใช้ <b>รหัสพนักงาน</b> เป็นรหัสผ่าน</span>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-95"
                >
                    เข้าสู่ระบบ
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="text-center pt-2">
                    <p className="text-slate-400 text-[10px] font-mono tracking-widest hover:text-blue-500 transition-colors cursor-default">
                        by.tmtphong49 / sheet+github
                    </p>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
