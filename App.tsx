
import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Users, Smartphone, Wrench, Settings as SettingsIcon, LayoutDashboard, 
  Plus, Search, Trash2, Edit2, Printer, Save, Download, Upload,
  CheckCircle, Clock, XCircle, PackageCheck, AlertCircle, Phone, MapPin, Receipt, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle, Calendar, Camera, Sparkles, Database, FileJson, MessageCircle, TrendingUp, DollarSign, PieChart, Wallet, TrendingDown, ArrowUpRight, ArrowDownRight, Menu, Share2, PanelLeftClose, PanelLeftOpen, X
} from 'lucide-react';
import { 
  loadDB, addClient, updateClient, deleteClient, 
  addDevice, updateDevice, deleteDevice, 
  addRepair, updateRepair, deleteRepair,
  addExpense, deleteExpense,
  exportDB, importDB, updateCatalog, getLastBackupDate, exportSpecificTable,
  addModelToCatalog
} from './services/storage';
import { identifyDeviceFromImage } from './services/ai';
import { Client, Device, Repair, DBData, RepairStatus, PhoneModel, Expense } from './types';

// --- Constants & Configuration ---

const COMMON_SERVICES = [
  "تغيير شاشة وتاتش",
  "تغيير باغة (Glass)",
  "تغيير بطارية",
  "تغيير سوكت شحن",
  "سوفت وير / فورمات",
  "صيانة داخلية (بوردة)",
  "تغيير هاوسينج / شاسية",
  "تغيير سماعة / مايك",
  "اسكرينة حماية",
  "تنظيف وتطهير"
];

const EXPENSE_CATEGORIES = [
    { id: 'RENT', label: 'إيجار المحل' },
    { id: 'UTILITIES', label: 'كهرباء / مياه / نت' },
    { id: 'SALARY', label: 'رواتب ومكافآت' },
    { id: 'PARTS', label: 'شراء قطع غيار' },
    { id: 'OTHER', label: 'مصروفات أخرى (بوفيه..)' },
];

// --- Toast Notification System ---

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

const ToastContext = createContext<{ addToast: (msg: string, type?: 'success' | 'info' | 'error') => void } | null>(null);

const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000); // Auto dismiss after 4s
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-2 w-auto max-w-sm no-print">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-bold animate-in slide-in-from-bottom-5 fade-in duration-300
              ${t.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' : 
                t.type === 'error' ? 'bg-red-600 text-white border-red-700' : 
                'bg-slate-800 text-white border-slate-900'}
            `}
          >
            <div className="shrink-0">
              {t.type === 'success' ? <CheckCircle size={20} /> : t.type === 'error' ? <AlertCircle size={20} /> : <Clock size={20} />}
            </div>
            <span className="flex-1 leading-tight">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = "button", disabled = false, title = "", size = 'md' }: any) => {
  const baseClass = "rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes: any = {
      sm: "px-2 py-1 text-xs",
      md: "px-4 py-2 text-sm"
  };
  const variants: any = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 hover:shadow-md",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    outline: "border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50",
    magic: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md",
    whatsapp: "bg-[#25D366] text-white hover:bg-[#128C7E] shadow-sm"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseClass} ${sizes[size]} ${variants[variant]} ${className}`} title={title}>
      {children}
    </button>
  );
};

const Input = ({ label, error, suffix, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
        <input 
        className={`w-full p-2.5 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${suffix ? 'pl-12' : ''}`}
        {...props}
        />
        {suffix && <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">{suffix}</span>}
    </div>
    {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
  </div>
);

const ServiceSelector = ({ selected, onChange }: { selected: string[], onChange: (s: string[]) => void }) => {
    const toggleService = (service: string) => {
        if (selected.includes(service)) {
            onChange(selected.filter(s => s !== service));
        } else {
            onChange([...selected, service]);
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">اختر الخدمات المطلوبة:</label>
            <div className="flex flex-wrap gap-2">
                {COMMON_SERVICES.map(service => (
                    <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            selected.includes(service) 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {service}
                    </button>
                ))}
            </div>
        </div>
    );
};

const SearchableSelect = ({ label, options, value, onChange, placeholder, onAddNew, disabled }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = options.filter((opt: string) => opt.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
      <div 
        className={`w-full p-2.5 bg-slate-50 border ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'cursor-pointer bg-white'} border-slate-300 rounded-lg flex justify-between items-center`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <span className={!value ? 'text-slate-500' : 'text-slate-800 truncate block max-w-[90%]'}>{value || placeholder}</span>
        <ChevronDown size={16} className="text-slate-400 flex-shrink-0"/>
      </div>
      
      {isOpen && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <div className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-auto left-0">
                <div className="p-2 sticky top-0 bg-white border-b">
                    <input 
                        autoFocus
                        placeholder="بحث..."
                        className="w-full p-1 text-sm border rounded"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {filtered.map((opt: string) => (
                    <div 
                        key={opt} 
                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm truncate"
                        onClick={() => { onChange(opt); setIsOpen(false); }}
                    >
                        {opt}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="p-2 text-sm text-slate-500 text-center">لا يوجد نتائج</div>
                )}
            </div>
        </>
      )}
    </div>
  );
};

const Badge = ({ status }: { status: RepairStatus }) => {
  const colors: any = {
    [RepairStatus.PENDING]: "bg-amber-100 text-amber-800 border-amber-200",
    [RepairStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 border-blue-200",
    [RepairStatus.DONE]: "bg-emerald-100 text-emerald-800 border-emerald-200",
    [RepairStatus.DELIVERING]: "bg-indigo-100 text-indigo-800 border-indigo-200",
    [RepairStatus.DELIVERED]: "bg-slate-100 text-slate-800 border-slate-200",
    [RepairStatus.CANCELLED]: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
      <div className="p-5 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-10">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            {title}
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><XCircle size={24} className="text-slate-400"/></button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[80vh]">
        {children}
      </div>
    </div>
  </div>
);

const CameraModal = ({ onCapture, onClose }: { onCapture: (img: string) => void, onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                alert("تعذر الوصول للكاميرا، تأكد من منح الصلاحيات.");
                onClose();
            }
        };
        startCamera();
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            onCapture(dataUrl);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                <canvas ref={canvasRef} className="hidden" />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white backdrop-blur-md">
                    <XCircle size={24} />
                </button>
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                     <button onClick={capture} className="bg-white p-1 rounded-full shadow-lg active:scale-90 transition-transform">
                        <div className="w-16 h-16 bg-transparent border-4 border-slate-200 rounded-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                        </div>
                     </button>
                </div>
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full font-bold">
                    وجه الكاميرا نحو الجهاز
                </div>
            </div>
        </div>
    );
};

// --- Layout & Pages ---

const Layout = ({ children }: any) => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'الرئيسية', path: '/' },
    { icon: Users, label: 'العملاء', path: '/clients' },
    { icon: Smartphone, label: 'الأجهزة', path: '/devices' },
    { icon: Wrench, label: 'الصيانة والفواتير', path: '/repairs' },
    { icon: Wallet, label: 'المصروفات', path: '/expenses' },
    { icon: SettingsIcon, label: 'الإعدادات', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden print:block print:h-auto print:bg-white font-sans">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 bg-slate-900 text-slate-300 flex flex-col shadow-2xl no-print transition-all duration-300 ease-in-out
        md:static md:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        w-64
      `}>
        <div className={`p-4 flex items-center gap-3 border-b border-slate-800 bg-slate-950 h-16 ${isCollapsed ? 'justify-center px-2' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 shrink-0">
            <Wrench className="text-white" size={22} />
          </div>
          <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="font-black text-white text-lg leading-tight tracking-wide">مركز ميدو</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Repair Center</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-bold text-sm 
                    ${isActive ? 'bg-blue-700 text-white shadow-lg shadow-blue-900/50 translate-x-1' : 'hover:bg-slate-800 hover:text-white'}
                    ${isCollapsed ? 'justify-center px-2' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon size={20} className={`shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'hidden opacity-0' : 'block opacity-100'}`}>
                    {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        
        {/* Collapse Toggle for Desktop */}
        <div className="hidden md:flex p-4 border-t border-slate-800 justify-center">
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 text-slate-500 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            >
                {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
        </div>

        {!isCollapsed && (
            <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 text-center font-mono md:block hidden">
                v3.2.0 Build 2025
            </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#f8fafc] w-full">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shadow-sm z-10 no-print shrink-0">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
                    {navItems.find(i => i.path === location.pathname)?.label || 'ميدو للصيانة'}
                </h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500 text-left hidden md:block">
                    <p className="font-bold text-slate-800">مدير النظام</p>
                    <p className="text-xs">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-300 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold">
                    M
                </div>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ clients: 0, devices: 0, pending: 0, income: 0, expenses: 0, netProfit: 0, weeklyIncome: [0,0,0,0,0,0,0] });
  const [backupWarning, setBackupWarning] = useState(false);

  useEffect(() => {
    const db = loadDB();
    const currentMonth = new Date().getMonth();
    
    // Calculate Income (Repairs)
    const income = db.repairs
      .filter(r => {
          const d = new Date(r.entryDate);
          return d.getMonth() === currentMonth && (r.status === RepairStatus.DONE || r.status === RepairStatus.DELIVERING);
      })
      .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

    // Calculate Expenses
    const expenses = db.expenses
      .filter(e => new Date(e.date).getMonth() === currentMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Mock weekly data based on repairs (visual approximation)
    const weekly = [10, 40, 25, 50, 30, 60, 80]; 

    setStats({
      clients: db.clients.length,
      devices: db.devices.length,
      pending: db.repairs.filter(r => r.status === RepairStatus.PENDING || r.status === RepairStatus.IN_PROGRESS).length,
      income,
      expenses,
      netProfit: income - expenses,
      weeklyIncome: weekly
    });

    const lastBackup = getLastBackupDate();
    if (!lastBackup || (Date.now() - lastBackup > 7 * 24 * 60 * 60 * 1000)) {
        setBackupWarning(true);
    }
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {backupWarning && (
        <div className="bg-orange-50 border-r-4 border-orange-500 p-4 rounded shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-200 rounded-full"><AlertTriangle className="text-orange-700" size={20} /></div>
             <div>
                <h4 className="font-bold text-orange-900">تنبيه هام</h4>
                <p className="text-sm text-orange-700">لم يتم عمل نسخة احتياطية منذ فترة. يرجى حفظ بياناتك.</p>
             </div>
           </div>
           <Link to="/settings" className="text-sm font-bold bg-orange-100 text-orange-800 px-4 py-2 rounded-lg hover:bg-orange-200 w-full md:w-auto text-center">النسخ الآن</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="bg-blue-500 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
              <Users size={26} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">العملاء المسجلين</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.clients}</h3>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="bg-amber-500 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
              <Clock size={26} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">أجهزة قيد الانتظار</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.pending}</h3>
            </div>
        </div>

         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="bg-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
              <DollarSign size={26} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">إيرادات الشهر</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.income.toLocaleString()} <span className="text-xs font-medium text-slate-400">ج.م</span></h3>
            </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Wallet size={20} className="text-red-500"/> المصروفات</h3>
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">هذا الشهر</span>
            </div>
            <div className="text-3xl font-black text-slate-800 mb-2">{stats.expenses.toLocaleString()} <span className="text-sm text-slate-400">ج.م</span></div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats.expenses / (stats.income || 1)) * 100}%`, maxWidth: '100%' }}></div>
            </div>
            <p className="text-xs text-slate-400">نسبة المصروفات من الإيرادات</p>
         </div>

         <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {stats.netProfit >= 0 ? <ArrowUpRight size={20} className="text-emerald-500"/> : <ArrowDownRight size={20} className="text-red-500"/>} 
                    صافي الربح
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded ${stats.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.netProfit >= 0 ? 'مكسب' : 'خسارة'}
                </span>
            </div>
            <div className={`text-3xl font-black mb-2 relative z-10 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.netProfit.toLocaleString()} <span className="text-sm text-slate-400 font-bold">ج.م</span>
            </div>
            <p className="text-xs text-slate-400 relative z-10">بعد خصم جميع المصروفات التشغيلية</p>
            {/* Decorational Background Icon */}
            <PieChart className="absolute -bottom-4 -left-4 text-slate-50 opacity-50 w-32 h-32" />
         </div>
      </div>
    </div>
  );
};

const Expenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', amount: '', category: 'OTHER', notes: '' });

    const loadData = () => setExpenses(loadDB().expenses.sort((a, b) => b.date - a.date));
    useEffect(loadData, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addExpense({
            title: formData.title,
            amount: Number(formData.amount),
            category: formData.category as any,
            date: Date.now(),
            notes: formData.notes
        });
        setIsModalOpen(false);
        setFormData({ title: '', amount: '', category: 'OTHER', notes: '' });
        loadData();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
            deleteExpense(id);
            loadData();
        }
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 w-full md:w-auto">
                    <div className="p-2 bg-red-100 rounded-full text-red-600"><Wallet size={20}/></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">إجمالي المصروفات</p>
                        <p className="text-xl font-black text-slate-800">{totalExpenses.toLocaleString()} ج.م</p>
                    </div>
                </div>
                <Button onClick={() => setIsModalOpen(true)} variant="danger" className="w-full md:w-auto">
                    <Plus size={18} /> تسجيل مصروف
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                <table className="w-full text-right min-w-[600px]">
                    <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4">البند</th>
                            <th className="p-4">التصنيف</th>
                            <th className="p-4">المبلغ</th>
                            <th className="p-4">التاريخ</th>
                            <th className="p-4 hidden md:table-cell">ملاحظات</th>
                            <th className="p-4 text-center">حذف</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.map(ex => (
                            <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">{ex.title}</td>
                                <td className="p-4">
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full border">
                                        {EXPENSE_CATEGORIES.find(c => c.id === ex.category)?.label}
                                    </span>
                                </td>
                                <td className="p-4 font-mono font-bold text-red-600">{ex.amount}</td>
                                <td className="p-4 text-xs text-slate-500">{new Date(ex.date).toLocaleDateString('ar-EG')}</td>
                                <td className="p-4 text-xs text-slate-400 hidden md:table-cell max-w-xs truncate">{ex.notes || '-'}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleDelete(ex.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                             <tr><td colSpan={6} className="p-12 text-center text-slate-400">لا يوجد مصروفات مسجلة</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title="تسجيل مصروف جديد" onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleSubmit}>
                        <Input label="عنوان المصروف" required value={formData.title} onChange={(e: any) => setFormData({...formData, title: e.target.value})} placeholder="مثال: فاتورة كهرباء شهر 5" />
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">التصنيف</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="المبلغ" type="number" required value={formData.amount} onChange={(e: any) => setFormData({...formData, amount: e.target.value})} suffix="ج.م" />
                        <Input label="ملاحظات" value={formData.notes} onChange={(e: any) => setFormData({...formData, notes: e.target.value})} />
                        
                        <div className="mt-8 flex gap-3">
                            <Button type="submit" variant="danger" className="flex-1">تسجيل المصروف</Button>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = () => setClients(loadDB().clients.sort((a, b) => b.createdAt - a.createdAt));
  useEffect(loadData, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        updateClient(editingId, formData);
    } else {
        addClient(formData);
    }
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setEditingId(null);
    loadData();
  };

  const handleEdit = (c: Client) => {
      setFormData({ name: c.name, phone: c.phone, address: c.address || '', notes: c.notes || '' });
      setEditingId(c.id);
      setIsModalOpen(true);
  }

  const handleDelete = (id: string) => {
    if (window.confirm('تحذير: سيتم حذف العميل وجميع أجهزته وسجلاته. هل أنت متأكد؟')) {
      deleteClient(id);
      loadData();
    }
  };

  const filteredClients = clients.filter(c => c.name.includes(search) || c.phone.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-3 text-slate-400" size={20} />
          <input 
            className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            placeholder="بحث باسم العميل أو الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', address:'', notes:''}); setIsModalOpen(true); }} className="w-full md:w-auto">
            <Plus size={18} /> عميل جديد
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[600px]">
          <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
            <tr>
              <th className="p-4">الاسم</th>
              <th className="p-4">الهاتف</th>
              <th className="p-4 hidden md:table-cell">العنوان</th>
              <th className="p-4 hidden md:table-cell">ملاحظات</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4 font-bold text-slate-800">{client.name}</td>
                <td className="p-4 font-mono text-slate-600 text-sm" dir="ltr">{client.phone}</td>
                <td className="p-4 text-slate-600 text-sm hidden md:table-cell">{client.address || '-'}</td>
                <td className="p-4 text-slate-500 text-sm hidden md:table-cell truncate max-w-xs">{client.notes || '-'}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => handleEdit(client)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={18}/></button>
                  <button onClick={() => handleDelete(client.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 flex flex-col items-center"><Users size={48} className="mb-2 opacity-20"/>لا يوجد عملاء مطابقين</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal title={editingId ? "تعديل بيانات عميل" : "إضافة عميل جديد"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <Input label="اسم العميل" required value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} placeholder="الاسم الثلاثي" />
            <Input label="رقم الهاتف" required type="tel" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} placeholder="01xxxxxxxxx" />
            <Input label="العنوان" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} />
            <Input label="ملاحظات إضافية" value={formData.notes} onChange={(e: any) => setFormData({...formData, notes: e.target.value})} />
            <div className="mt-8 flex gap-3">
              <Button type="submit" className="flex-1">حفظ البيانات</Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const DeviceForm = ({ initialData, onSubmit, onCancel, clients, catalog, onAddCatalogModel }: any) => {
    const [formData, setFormData] = useState(initialData);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isManualModel, setIsManualModel] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detectedNewModel, setDetectedNewModel] = useState<{brand: string, model: string} | null>(null);

    useEffect(() => {
        const selectedBrand = catalog.find((b: PhoneModel) => b.brand === formData.brand);
        setAvailableModels(selectedBrand ? selectedBrand.models : []);
    }, [formData.brand, catalog]);

    const handleBrandChange = (brand: string) => {
        setFormData({ ...formData, brand, model: '' });
        setIsManualModel(false);
    };

    const handleModelChange = (model: string) => {
        if (model === 'MANUAL_ENTRY') {
            setIsManualModel(true);
            setFormData({ ...formData, model: '' });
        } else {
            setIsManualModel(false);
            setFormData({ ...formData, model });
        }
    };

    const confirmAddCatalog = () => {
        if (detectedNewModel && onAddCatalogModel) {
            onAddCatalogModel(detectedNewModel.brand, detectedNewModel.model);
            // After adding, update form data
            setFormData(prev => ({ ...prev, brand: detectedNewModel.brand, model: detectedNewModel.model }));
            setDetectedNewModel(null);
            setIsManualModel(false);
        }
    };

    const handleAIAnalysis = async (imgData: string) => {
        setIsCameraOpen(false);
        setIsAnalyzing(true);
        setDetectedNewModel(null);
        try {
            const result = await identifyDeviceFromImage(imgData);
            let updates: any = {};
            if (result.brand) updates.brand = result.brand;
            if (result.model) updates.model = result.model;
            if (result.color) updates.color = result.color;
            
            // Check if exists in catalog
            const brandExists = catalog.find((c: PhoneModel) => c.brand.toLowerCase() === result.brand?.toLowerCase());
            const modelExists = brandExists?.models.some((m: string) => m.toLowerCase() === result.model?.toLowerCase());

            if (result.brand && result.model && (!brandExists || !modelExists)) {
                setDetectedNewModel({ brand: result.brand, model: result.model || '' });
            } else if (brandExists) {
                 // Normalize brand name if exists
                 updates.brand = brandExists.brand;
            }

            setFormData((prev: any) => ({ ...prev, ...updates }));
        } catch (error: any) {
            alert(error.message || "فشل التعرف على الجهاز.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <>
        {isCameraOpen && <CameraModal onCapture={handleAIAnalysis} onClose={() => setIsCameraOpen(false)} />}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
            <div className="flex justify-center mb-8">
                <Button variant="magic" onClick={() => setIsCameraOpen(true)} disabled={isAnalyzing} className="w-full py-3 shadow-lg shadow-violet-200">
                    {isAnalyzing ? <span className="animate-pulse">جاري تحليل الصورة...</span> : <><Camera size={20}/> مسح الجهاز بالكاميرا (AI)</>}
                </Button>
            </div>

            {detectedNewModel && (
               <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 mb-4 flex flex-col sm:flex-row gap-3 justify-between items-center animate-in fade-in">
                  <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-600"/>
                      <span className="text-sm text-indigo-900">
                          اكتشف الذكاء الاصطناعي موديلاً جديداً: <b>{detectedNewModel.brand} {detectedNewModel.model}</b>
                      </span>
                  </div>
                  <Button size="sm" onClick={confirmAddCatalog} className="text-xs h-8 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white">إضافة للقائمة</Button>
               </div>
            )}

            <SearchableSelect 
                label="العميل (المالك)" 
                options={clients.map((c: Client) => `${c.name} | ${c.phone}`)}
                value={clients.find((c: Client) => c.id === formData.clientId) ? `${clients.find((c: Client) => c.id === formData.clientId).name} | ${clients.find((c: Client) => c.id === formData.clientId).phone}` : ''}
                onChange={(val: string) => {
                    const client = clients.find((c: Client) => `${c.name} | ${c.phone}` === val);
                    if (client) setFormData({ ...formData, clientId: client.id });
                }}
                placeholder="اختر العميل..."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect 
                    label="الماركة" 
                    options={catalog.map((m: PhoneModel) => m.brand)}
                    value={formData.brand}
                    onChange={handleBrandChange}
                    placeholder="Samsung, Apple..."
                />

                {!isManualModel ? (
                    <SearchableSelect 
                        label="الموديل" 
                        options={[...availableModels, "موديل آخر (إدخال يدوي)"]}
                        value={formData.model}
                        onChange={(val: string) => val === "موديل آخر (إدخال يدوي)" ? handleModelChange('MANUAL_ENTRY') : handleModelChange(val)}
                        placeholder="اختر الموديل..."
                        disabled={!formData.brand}
                    />
                ) : (
                    <div className="relative">
                        <Input 
                            label="الموديل (يدوي)" 
                            value={formData.model} 
                            onChange={(e: any) => setFormData({...formData, model: e.target.value})}
                            placeholder="أدخل اسم الموديل"
                        />
                        <button 
                            type="button"
                            onClick={() => setIsManualModel(false)} 
                            className="absolute top-[2rem] left-2 text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                            <XCircle size={16}/>
                        </button>
                    </div>
                )}
            </div>

            <Input label="IMEI / السيريال" value={formData.imei} onChange={(e: any) => setFormData({...formData, imei: e.target.value})} placeholder="اختياري" />
            <div className="grid grid-cols-2 gap-4">
                <Input label="رمز القفل (Pattern/PIN)" value={formData.passcode} onChange={(e: any) => setFormData({...formData, passcode: e.target.value})} />
                <Input label="اللون" value={formData.color} onChange={(e: any) => setFormData({...formData, color: e.target.value})} />
            </div>
            
            <div className="mt-8 flex gap-3">
                <Button type="submit" className="flex-1">حفظ الجهاز</Button>
                <Button variant="secondary" onClick={onCancel}>إلغاء</Button>
            </div>
        </form>
        </>
    );
};

const Devices = () => {
  const [data, setData] = useState<DBData>(loadDB());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultForm = { clientId: '', brand: '', model: '', imei: '', passcode: '', color: '' };
  const [currentForm, setCurrentForm] = useState(defaultForm);

  const loadData = () => setData(loadDB());
  useEffect(loadData, []);

  const handleSave = (formData: any) => {
    if (editingId) {
        updateDevice(editingId, formData);
    } else {
        addDevice(formData);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setCurrentForm(defaultForm);
    loadData();
  };

  const handleEdit = (d: Device) => {
      setCurrentForm({
          clientId: d.clientId, brand: d.brand, model: d.model, 
          imei: d.imei || '', passcode: d.passcode || '', color: d.color || ''
      });
      setEditingId(d.id);
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('حذف الجهاز؟')) {
          deleteDevice(id);
          loadData();
      }
  };

  const handleAddCatalogModel = (brand: string, model: string) => {
      addModelToCatalog(brand, model);
      loadData(); // Reload to update available catalog
  };

  const filteredDevices = data.devices.filter(d => 
    d.model.toLowerCase().includes(search.toLowerCase()) || 
    d.imei?.includes(search) || 
    data.clients.find(c => c.id === d.clientId)?.name.includes(search)
  ).reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-3 text-slate-400" size={20} />
          <input 
            className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            placeholder="بحث بالموديل، IMEI، أو العميل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { setEditingId(null); setCurrentForm(defaultForm); setIsModalOpen(true); }} className="w-full md:w-auto">
            <Plus size={18} /> إضافة جهاز
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[700px]">
          <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
            <tr>
              <th className="p-4">الموديل</th>
              <th className="p-4">العميل</th>
              <th className="p-4 hidden md:table-cell">اللون / الرمز</th>
              <th className="p-4 hidden md:table-cell">IMEI</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDevices.map(dev => {
              const client = data.clients.find(c => c.id === dev.clientId);
              return (
                <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{dev.brand}</div>
                    <div className="text-sm text-slate-500">{dev.model}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{client?.name || 'غير معروف'}</div>
                    <div className="text-xs text-slate-500" dir="ltr">{client?.phone}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 hidden md:table-cell">
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{backgroundColor: dev.color || '#eee'}}></span>
                        {dev.color || '-'}
                     </div>
                     <div className="text-xs font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-1 text-slate-600">{dev.passcode || 'No PIN'}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-500 text-sm hidden md:table-cell">{dev.imei || '-'}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => handleEdit(dev)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(dev.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </td>
                </tr>
              );
            })}
            {filteredDevices.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 flex flex-col items-center"><Smartphone size={48} className="mb-2 opacity-20"/>لا يوجد أجهزة</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal title={editingId ? "تعديل بيانات جهاز" : "إضافة جهاز جديد"} onClose={() => setIsModalOpen(false)}>
            <DeviceForm 
                initialData={currentForm} 
                onSubmit={handleSave}
                onCancel={() => setIsModalOpen(false)}
                clients={data.clients}
                catalog={data.catalog}
                onAddCatalogModel={handleAddCatalogModel}
            />
        </Modal>
      )}
    </div>
  );
};

const Repairs = () => {
  const { addToast } = useToast();
  const [data, setData] = useState<DBData>(loadDB());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [invoiceData, setInvoiceData] = useState<any>(null); 
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    deviceId: '', problem: '', parts: '', services: [], costParts: 0, costServices: 0, costOther: 0, status: RepairStatus.PENDING
  });

  const loadData = () => setData(loadDB());
  useEffect(loadData, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parts: typeof formData.parts === 'string' ? formData.parts.split(',').map((s: string) => s.trim()).filter(Boolean) : formData.parts,
      services: formData.services, // Already array from selector
      costParts: Number(formData.costParts),
      costServices: Number(formData.costServices),
      costOther: Number(formData.costOther),
      clientId: data.devices.find(d => d.id === formData.deviceId)?.clientId || ''
    };
    
    if (editingId) {
        const oldRepair = data.repairs.find(r => r.id === editingId);
        // Check for status change
        if (oldRepair && oldRepair.status !== payload.status) {
             if (payload.status === RepairStatus.DONE) {
                 addToast("🎉 تم الانتهاء من الإصلاح بنجاح!", 'success');
             } else if (payload.status === RepairStatus.DELIVERED) {
                 addToast("✅ تم تسليم الجهاز للعميل", 'success');
             } else {
                 addToast("تم تحديث حالة الصيانة", 'info');
             }
        } else {
            addToast("تم حفظ التعديلات بنجاح", 'success');
        }
        updateRepair(editingId, payload);
    } else {
        addRepair(payload);
        addToast("تم إضافة أمر الصيانة بنجاح", 'success');
    }
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ deviceId: '', problem: '', parts: '', services: [], costParts: 0, costServices: 0, costOther: 0, status: RepairStatus.PENDING });
    loadData();
  };

  const handleEdit = (r: Repair) => {
      setFormData({
          deviceId: r.deviceId,
          problem: r.problem,
          parts: r.parts.join(', '),
          services: r.services, // keep as array
          costParts: r.costParts,
          costServices: r.costServices,
          costOther: r.costOther,
          status: r.status
      });
      setEditingId(r.id);
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if(window.confirm("حذف أمر الصيانة؟")) {
          deleteRepair(id);
          loadData();
          addToast("تم حذف الأمر", 'info');
      }
  }

  const printInvoice = (repair: Repair) => {
    const device = data.devices.find(d => d.id === repair.deviceId);
    const client = data.clients.find(c => c.id === device?.clientId);
    setInvoiceData({ repair, device, client });
    setTimeout(() => window.print(), 200);
  };

  const openWhatsApp = (repair: Repair) => {
    const device = data.devices.find(d => d.id === repair.deviceId);
    const client = data.clients.find(c => c.id === device?.clientId);
    if (!client || !device) return;
    
    // Format phone number: Remove non-digits, remove leading 0, prepend 20 for Egypt
    let phone = client.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('20')) phone = '20' + phone;

    // Detailed invoice message
    const message = `*مركز ميدو للصيانة* 🛠️
مرحباً ${client.name}،

📜 *تفاصيل الفاتورة*
رقم الإيصال: ${repair.id.substring(0, 6)}
الجهاز: ${device.brand} ${device.model}

🔧 *الخدمات:*
${repair.problem} (فحص)
${repair.services.map(s => `• ${s}`).join('\n')}
${repair.parts.length > 0 ? `📦 *قطع الغيار:* ${repair.parts.join(', ')}` : ''}

💰 *التفاصيل المالية:*
- قطع الغيار: ${repair.costParts} ج.م
- المصنعية: ${repair.costServices} ج.م
- أخرى: ${repair.costOther} ج.م
-------------------
*الإجمالي: ${repair.totalCost} ج.م*

📊 الحالة: ${repair.status}

شكراً لثقتكم بنا!
للاستفسار: 010xxxxxxxxx`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredRepairs = data.repairs
    .filter(r => {
        const matchesSearch = r.problem.includes(search) || r.id.includes(search);
        const matchesStatus = filter === 'ALL' || r.status === filter;
        let matchesDate = true;
        if (dateRange.start) matchesDate = matchesDate && r.entryDate >= new Date(dateRange.start).getTime();
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setDate(end.getDate() + 1);
            matchesDate = matchesDate && r.entryDate < end.getTime();
        }
        return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => b.entryDate - a.entryDate);

  return (
    <div className="space-y-6">
      {/* Invoice Template (Print Only) */}
      {invoiceData && (
        <div className="hidden print:flex print-only flex-col bg-white w-full h-full text-slate-900 font-sans">
          
          {/* Container */}
          <div className="p-2 sm:p-8 w-full max-w-[100%] mx-auto flex-1 flex flex-col">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-slate-800 pb-4 mb-4 gap-4 text-center sm:text-right">
                <div className="flex flex-col items-center sm:flex-row gap-4">
                     <div className="w-16 h-16 bg-slate-900 text-white rounded-lg flex items-center justify-center print-color-adjust-exact">
                        <Wrench size={32}/>
                     </div>
                     <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase">مركز ميدو</h1>
                        <p className="text-sm sm:text-base font-bold text-slate-600">Mido Repair Center</p>
                     </div>
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest border-2 border-slate-800 px-2 inline-block mb-1">فاتورة</h2>
                    <p className="font-mono text-lg font-bold">#{invoiceData.repair.id.substring(0, 6)}</p>
                    <p className="text-xs text-slate-500">{new Date(invoiceData.repair.entryDate).toLocaleString('ar-EG')}</p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
                <div className="border border-slate-300 p-3 rounded bg-slate-50 print:bg-slate-50">
                    <h3 className="font-bold text-xs text-slate-500 uppercase mb-1">العميل</h3>
                    <p className="font-bold text-lg">{invoiceData.client?.name}</p>
                    <p className="font-mono" dir="ltr">{invoiceData.client?.phone}</p>
                </div>
                <div className="border border-slate-300 p-3 rounded bg-slate-50 print:bg-slate-50">
                    <h3 className="font-bold text-xs text-slate-500 uppercase mb-1">الجهاز</h3>
                    <p className="font-bold text-lg">{invoiceData.device?.brand} {invoiceData.device?.model}</p>
                    <div className="flex gap-2 text-xs mt-1">
                         <span className="bg-white border px-1 rounded">اللون: {invoiceData.device?.color || '-'}</span>
                         <span className="bg-white border px-1 rounded">رمز: {invoiceData.device?.passcode || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full mb-6 text-sm border-collapse">
                <thead>
                    <tr className="border-b-2 border-slate-800 bg-slate-100 print:bg-slate-100">
                        <th className="py-2 px-2 text-right font-bold">الخدمة / التفاصيل</th>
                        <th className="py-2 px-2 text-left w-24">التكلفة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                     <tr>
                        <td className="py-2 px-2">{invoiceData.repair.problem} (فحص وتشخيص)</td>
                        <td className="text-left py-2 px-2 font-mono">-</td>
                    </tr>
                    {invoiceData.repair.services.map((s: string, i: number) => (
                        <tr key={`svc-${i}`}>
                            <td className="py-2 px-2">• {s}</td>
                            <td className="text-left py-2 px-2 font-mono">-</td>
                        </tr>
                    ))}
                     {invoiceData.repair.parts.map((s: string, i: number) => (
                        <tr key={`prt-${i}`}>
                            <td className="py-2 px-2">📦 قطعة غيار: {s}</td>
                            <td className="text-left py-2 px-2 font-mono">-</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-800">
                    {invoiceData.repair.costParts > 0 && (
                        <tr>
                            <td className="pt-2 px-2 text-left text-slate-500 text-xs font-bold uppercase">قطع الغيار</td>
                            <td className="pt-2 px-2 text-left font-mono">{invoiceData.repair.costParts}</td>
                        </tr>
                    )}
                    {invoiceData.repair.costServices > 0 && (
                        <tr>
                            <td className="pt-1 px-2 text-left text-slate-500 text-xs font-bold uppercase">المصنعية / خدمات</td>
                            <td className="pt-1 px-2 text-left font-mono">{invoiceData.repair.costServices}</td>
                        </tr>
                    )}
                     {invoiceData.repair.costOther > 0 && (
                        <tr>
                            <td className="pt-1 px-2 text-left text-slate-500 text-xs font-bold uppercase">تكاليف أخرى</td>
                            <td className="pt-1 px-2 text-left font-mono">{invoiceData.repair.costOther}</td>
                        </tr>
                    )}
                    <tr className="text-xl bg-slate-100 print:bg-slate-200">
                        <td className="py-3 px-2 text-left font-black text-slate-900">الإجمالي النهائي</td>
                        <td className="py-3 px-2 text-left font-black font-mono text-slate-900">{invoiceData.repair.totalCost} ج.م</td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer - Signature & Terms */}
            <div className="mt-4 sm:mt-auto break-inside-avoid">
                 <div className="grid grid-cols-2 gap-8 mb-6">
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 mb-6 uppercase">توقيع العميل</p>
                        <div className="border-b border-slate-800 w-3/4 mx-auto border-dashed"></div>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-500 mb-6 uppercase">ختم المركز</p>
                        <div className="border-b border-slate-800 w-3/4 mx-auto border-dashed"></div>
                     </div>
                 </div>
                 
                 <div className="text-[9px] text-center text-slate-500 border-t border-slate-200 pt-2">
                    <p>ضمان 14 يوم على قطع الغيار. المركز غير مسؤول عن فقدان البيانات. يرجى استلام الجهاز خلال 30 يوم.</p>
                    <p className="font-mono mt-1">Mido Repair Center - 010xxxxxxxxx</p>
                 </div>
            </div>

          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col xl:flex-row gap-4 no-print">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
             <div className="relative flex-1">
                <Search className="absolute right-3 top-3 text-slate-400" size={20} />
                <input 
                    className="w-full p-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="بحث برقم الأمر أو المشكلة..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 md:py-0 w-full md:w-auto">
                <Calendar size={16} className="text-slate-400"/>
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm w-full md:w-auto" 
                    value={dateRange.start} 
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                />
                <span className="text-slate-300 hidden md:inline">إلى</span>
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm w-full md:w-auto" 
                    value={dateRange.end} 
                    onChange={e => setDateRange({...dateRange, end: e.target.value})}
                />
             </div>
        </div>
        <div className="flex items-center gap-2 justify-between overflow-x-auto pb-2 md:pb-0">
             <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
                {['ALL', RepairStatus.PENDING, RepairStatus.DONE].map(s => (
                    <button 
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filter === s ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {s === 'ALL' ? 'الكل' : s}
                    </button>
                ))}
             </div>
             <Button onClick={() => { setEditingId(null); setFormData({ deviceId: '', problem: '', parts: '', services: [], costParts: 0, costServices: 0, costOther: 0, status: RepairStatus.PENDING }); setIsModalOpen(true); }}>
                <Plus size={18} /> <span className="hidden md:inline">أمر صيانة</span>
            </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto no-print">
        <table className="w-full text-right min-w-[800px]">
          <thead className="bg-slate-50 text-slate-700 text-sm font-bold border-b border-slate-200">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">الجهاز</th>
              <th className="p-4 hidden md:table-cell">المشكلة</th>
              <th className="p-4">التكلفة</th>
              <th className="p-4 hidden md:table-cell">التاريخ</th>
              <th className="p-4">الحالة</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRepairs.map(repair => {
              const device = data.devices.find(d => d.id === repair.deviceId);
              const client = data.clients.find(c => c.id === device?.clientId);
              return (
                <tr key={repair.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-slate-400 text-xs">#{repair.id.substring(0,4)}</td>
                    <td className="p-4">
                        <div className="font-bold text-slate-800 text-sm">{device?.model}</div>
                        <div className="text-xs text-slate-500">{client?.name}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 hidden md:table-cell max-w-xs truncate">{repair.problem}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600 text-sm">{repair.totalCost}</td>
                    <td className="p-4 text-xs text-slate-500 hidden md:table-cell">{new Date(repair.entryDate).toLocaleDateString('ar-EG')}</td>
                    <td className="p-4"><Badge status={repair.status} /></td>
                    <td className="p-4 flex justify-center gap-1">
                        <button onClick={() => openWhatsApp(repair)} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors flex items-center gap-1 font-bold text-xs" title="إرسال فاتورة واتساب">
                            <Share2 size={16}/> <span className="hidden lg:inline">واتساب</span>
                        </button>
                        <button onClick={() => printInvoice(repair)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title="طباعة"><Printer size={18}/></button>
                        <button onClick={() => handleEdit(repair)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="تعديل"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(repair.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="حذف"><Trash2 size={18}/></button>
                    </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal title={editingId ? "تعديل أمر صيانة" : "أمر صيانة جديد"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <SearchableSelect 
                label="الجهاز" 
                options={data.devices.map(d => {
                    const c = data.clients.find(cl => cl.id === d.clientId);
                    return `${d.brand} ${d.model} - ${c?.name} (${d.id})`;
                })}
                value={formData.deviceId ? `${data.devices.find(d => d.id === formData.deviceId)?.brand} ${data.devices.find(d => d.id === formData.deviceId)?.model} - ${data.clients.find(c => c.id === data.devices.find(d => d.id === formData.deviceId)?.clientId)?.name}` : ''}
                onChange={(val: string) => {
                    const id = val.match(/\(([^)]+)\)$/)?.[1];
                    if(id) setFormData({...formData, deviceId: id});
                }}
                placeholder="ابحث عن الجهاز..."
                disabled={!!editingId} 
            />

            <Input label="وصف المشكلة (التشخيص المبدئي)" required value={formData.problem} onChange={(e: any) => setFormData({...formData, problem: e.target.value})} />
            
            <ServiceSelector 
                selected={formData.services}
                onChange={(newServices) => setFormData({ ...formData, services: newServices })}
            />

            <Input label="قطع غيار إضافية (اكتب وافصل بفاصلة)" value={formData.parts} onChange={(e: any) => setFormData({...formData, parts: e.target.value})} placeholder="مثال: شاشة أصلية، بطارية..." />

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <Input label="تكلفة القطع" type="number" value={formData.costParts} onChange={(e: any) => setFormData({...formData, costParts: e.target.value})} suffix="ج.م" />
                <Input label="المصنعية" type="number" value={formData.costServices} onChange={(e: any) => setFormData({...formData, costServices: e.target.value})} suffix="ج.م" />
                <Input label="أخرى" type="number" value={formData.costOther} onChange={(e: any) => setFormData({...formData, costOther: e.target.value})} suffix="ج.م" />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">حالة الصيانة</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.values(RepairStatus).map(s => (
                        <div 
                            key={s} 
                            onClick={() => setFormData({...formData, status: s})}
                            className={`p-3 rounded-lg border cursor-pointer text-center text-sm font-bold transition-all ${formData.status === s ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {s}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" className="flex-1 h-12 text-base">حفظ الأمر</Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Settings = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catalogInputRef = useRef<HTMLInputElement>(null);
  const [manualCatalog, setManualCatalog] = useState({ brand: '', model: '' });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        try {
            await importDB(e.target.files[0]);
            alert("تم استعادة البيانات بنجاح!");
            window.location.reload();
        } catch (err) {
            alert("حدث خطأ أثناء الاستيراد.");
        }
    }
  };

  const handleCatalogImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                if (Array.isArray(json) && json[0].brand) {
                    updateCatalog(json);
                    alert("تم تحديث قائمة الهواتف بنجاح");
                } else {
                    alert("صيغة الملف غير صحيحة.");
                }
            } catch (err) {
                alert("فشل قراءة الملف.");
            }
        };
        reader.readAsText(e.target.files[0]);
      }
  };

  const handleManualCatalogAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualCatalog.brand || !manualCatalog.model) return;
      addModelToCatalog(manualCatalog.brand, manualCatalog.model);
      alert("تم إضافة الموديل بنجاح");
      setManualCatalog({ brand: '', model: '' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Database size={24}/></div>
            <div>
                <h3 className="text-xl font-bold text-slate-800">النسخ الاحتياطي والاستعادة</h3>
                <p className="text-slate-500 text-sm">بياناتك مخزنة محلياً على هذا المتصفح.</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={exportDB} className="h-14 text-lg shadow-blue-200 w-full">
                <Download size={20}/> تحميل نسخة كاملة
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-14 text-lg w-full">
                <Upload size={20}/> استعادة نسخة
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
         </div>

         <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><FileJson size={16}/> تصدير مخصص</h4>
            <div className="flex gap-3 flex-wrap">
                <Button variant="secondary" onClick={() => exportSpecificTable('clients')} className="text-xs">العملاء فقط</Button>
                <Button variant="secondary" onClick={() => exportSpecificTable('devices')} className="text-xs">الأجهزة فقط</Button>
                <Button variant="secondary" onClick={() => exportSpecificTable('repairs')} className="text-xs">الصيانات فقط</Button>
                <Button variant="secondary" onClick={() => exportSpecificTable('expenses')} className="text-xs">المصروفات فقط</Button>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><Smartphone size={24}/></div>
            <div>
                <h3 className="text-xl font-bold text-slate-800">قائمة الهواتف (Catalog)</h3>
                <p className="text-slate-500 text-sm">تحديث قاعدة بيانات الموديلات.</p>
            </div>
         </div>
         <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <Button variant="secondary" onClick={() => catalogInputRef.current?.click()} className="w-full md:w-auto">
                <Upload size={18}/> رفع ملف JSON
            </Button>
            <p className="text-xs text-slate-500 flex-1 text-center md:text-right">تنسيق: <code>[{`{ "brand": "X", "models": ["Y"] }`}]</code></p>
            <input type="file" ref={catalogInputRef} className="hidden" accept=".json" onChange={handleCatalogImport} />
         </div>
         
         <div className="mt-6 pt-6 border-t border-slate-100">
             <h4 className="font-bold text-slate-700 mb-4 text-sm">إضافة يدوية سريعة</h4>
             <form onSubmit={handleManualCatalogAdd} className="flex flex-col md:flex-row gap-3 items-end">
                 <div className="w-full">
                     <label className="block text-xs font-bold text-slate-500 mb-1">الماركة</label>
                     <input 
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                        placeholder="مثال: Samsung"
                        value={manualCatalog.brand}
                        onChange={e => setManualCatalog({...manualCatalog, brand: e.target.value})}
                     />
                 </div>
                 <div className="w-full">
                     <label className="block text-xs font-bold text-slate-500 mb-1">الموديل</label>
                     <input 
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                        placeholder="مثال: S24 Ultra"
                        value={manualCatalog.model}
                        onChange={e => setManualCatalog({...manualCatalog, model: e.target.value})}
                     />
                 </div>
                 <Button type="submit" size="sm" className="h-[38px] whitespace-nowrap">
                     <Plus size={16}/> إضافة
                 </Button>
             </form>
         </div>
      </div>

       <div className="text-center text-slate-400 text-xs mt-12 pb-8">
          جميع الحقوق محفوظة لمركز ميدو للصيانة &copy; {new Date().getFullYear()}
       </div>
    </div>
  );
};

const App = () => {
  return (
    <ToastProvider>
        <HashRouter>
        <Layout>
            <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
        </HashRouter>
    </ToastProvider>
  );
};

export default App;
