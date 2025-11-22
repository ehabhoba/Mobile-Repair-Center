
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Users, Smartphone, Wrench, Settings as SettingsIcon, LayoutDashboard, 
  Plus, Search, Trash2, Edit2, Printer, Save, Download, Upload,
  CheckCircle, Clock, XCircle, PackageCheck, AlertCircle, Phone, MapPin, Receipt, ChevronDown, ChevronLeft, AlertTriangle, Calendar, Camera, Sparkles, Database, FileJson, MessageCircle, TrendingUp, DollarSign, PieChart
} from 'lucide-react';
import { 
  loadDB, addClient, updateClient, deleteClient, 
  addDevice, updateDevice, deleteDevice, 
  addRepair, updateRepair, deleteRepair,
  exportDB, importDB, updateCatalog, getLastBackupDate, exportSpecificTable
} from './services/storage';
import { identifyDeviceFromImage } from './services/ai';
import { Client, Device, Repair, DBData, RepairStatus, PhoneModel } from './types';

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

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = "button", disabled = false, title = "" }: any) => {
  const baseClass = "px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 hover:shadow-md",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    outline: "border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50",
    magic: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md",
    whatsapp: "bg-[#25D366] text-white hover:bg-[#128C7E]"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseClass} ${variants[variant]} ${className}`} title={title}>
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
                alert("تعذر الوصول للكاميرا");
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
  const navItems = [
    { icon: LayoutDashboard, label: 'الرئيسية', path: '/' },
    { icon: Users, label: 'العملاء', path: '/clients' },
    { icon: Smartphone, label: 'الأجهزة', path: '/devices' },
    { icon: Wrench, label: 'الصيانة والفواتير', path: '/repairs' },
    { icon: SettingsIcon, label: 'الإعدادات', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden print:block print:h-auto print:bg-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl no-print z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Wrench className="text-white" size={22} />
          </div>
          <div>
            <h1 className="font-black text-white text-lg leading-tight tracking-wide">مركز ميدو</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile Repair Center</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-bold text-sm ${isActive ? 'bg-blue-700 text-white shadow-lg shadow-blue-900/50 translate-x-1' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon size={18} className={isActive ? 'text-blue-200' : 'text-slate-500'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 text-center font-mono">
            v3.0.0 Build 2025
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#f8fafc]">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10 no-print">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-800">
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
  const [stats, setStats] = useState({ clients: 0, devices: 0, pending: 0, income: 0, weeklyIncome: [0,0,0,0,0,0,0] });
  const [backupWarning, setBackupWarning] = useState(false);

  useEffect(() => {
    const db = loadDB();
    const currentMonth = new Date().getMonth();
    
    // Calculate Income
    const income = db.repairs
      .filter(r => {
          const d = new Date(r.entryDate);
          return d.getMonth() === currentMonth && (r.status === RepairStatus.DONE || r.status === RepairStatus.DELIVERED);
      })
      .reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

    // Mock weekly data based on repairs
    const weekly = [10, 40, 25, 50, 30, 60, 80]; // Mock visual data for aesthetics

    setStats({
      clients: db.clients.length,
      devices: db.devices.length,
      pending: db.repairs.filter(r => r.status === RepairStatus.PENDING || r.status === RepairStatus.IN_PROGRESS).length,
      income,
      weeklyIncome: weekly
    });

    const lastBackup = getLastBackupDate();
    if (!lastBackup || (Date.now() - lastBackup > 7 * 24 * 60 * 60 * 1000)) {
        setBackupWarning(true);
    }
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {backupWarning && (
        <div className="bg-orange-50 border-r-4 border-orange-500 p-4 rounded shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-200 rounded-full"><AlertTriangle className="text-orange-700" size={20} /></div>
             <div>
                <h4 className="font-bold text-orange-900">تنبيه هام</h4>
                <p className="text-sm text-orange-700">لم يتم عمل نسخة احتياطية منذ فترة. يرجى حفظ بياناتك.</p>
             </div>
           </div>
           <Link to="/settings" className="text-sm font-bold bg-orange-100 text-orange-800 px-4 py-2 rounded-lg hover:bg-orange-200">النسخ الآن</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'العملاء', value: stats.clients, icon: Users, color: 'bg-blue-500', sub: 'عميل مسجل' },
          { label: 'الأجهزة', value: stats.devices, icon: Smartphone, color: 'bg-indigo-500', sub: 'جهاز في قاعدة البيانات' },
          { label: 'قيد الانتظار', value: stats.pending, icon: Clock, color: 'bg-amber-500', sub: 'جهاز تحت الصيانة' },
          { label: 'أرباح الشهر', value: stats.income.toLocaleString(), icon: DollarSign, color: 'bg-emerald-600', sub: 'جنية مصري' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-1">
            <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200`}>
              <stat.icon size={26} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section (Visual Only) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><TrendingUp size={20} className="text-blue-600"/> الأداء الأسبوعي</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">آخر 7 أيام</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
                {stats.weeklyIncome.map((val, i) => (
                    <div key={i} className="w-full bg-blue-50 rounded-t-lg relative group overflow-hidden">
                         <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-500 hover:bg-blue-600 transition-all duration-500 rounded-t-lg" 
                            style={{ height: `${val}%` }}
                         ></div>
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {val}%
                         </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400 font-bold px-1">
                <span>السبت</span><span>الأحد</span><span>الاثنين</span><span>الثلاثاء</span><span>الأربعاء</span><span>الخميس</span><span>الجمعة</span>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-4 border-slate-100">
                <SettingsIcon size={32} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">الإجراءات السريعة</h3>
            <div className="w-full space-y-3">
                <Link to="/clients" className="block w-full"><Button variant="outline" className="w-full justify-start"><Users size={16}/> تسجيل عميل</Button></Link>
                <Link to="/repairs" className="block w-full"><Button variant="primary" className="w-full justify-start"><Plus size={16}/> أمر صيانة جديد</Button></Link>
            </div>
         </div>
      </div>
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
        <Button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', address:'', notes:''}); setIsModalOpen(true); }}>
            <Plus size={18} /> عميل جديد
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
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

// Subcomponent for Device Form to handle AI and logic
const DeviceForm = ({ initialData, onSubmit, onCancel, clients, catalog, onAddCatalogModel }: any) => {
    const [formData, setFormData] = useState(initialData);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isManualModel, setIsManualModel] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const selectedBrand = catalog.find((b: PhoneModel) => b.brand === formData.brand);
        setAvailableModels(selectedBrand ? selectedBrand.models : []);
        if (formData.model && selectedBrand && !selectedBrand.models.includes(formData.model)) {
            // Manual model logic handling if needed
        }
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

    const handleAIAnalysis = async (imgData: string) => {
        setIsCameraOpen(false);
        setIsAnalyzing(true);
        try {
            const result = await identifyDeviceFromImage(imgData);
            let updates: any = {};
            if (result.brand) updates.brand = result.brand;
            if (result.model) updates.model = result.model;
            if (result.color) updates.color = result.color;
            
            const matchedBrand = catalog.find((c: PhoneModel) => c.brand.toLowerCase() === result.brand?.toLowerCase());
            if (matchedBrand) {
                updates.brand = matchedBrand.brand;
            }

            setFormData(prev => ({ ...prev, ...updates }));
        } catch (error) {
            alert("فشل التعرف على الجهاز. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <>
        {isCameraOpen && <CameraModal onCapture={handleAIAnalysis} onClose={() => setIsCameraOpen(false)} />}
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
            <div className="flex justify-center mb-8">
                <Button variant="magic" onClick={() => setIsCameraOpen(true)} disabled={isAnalyzing} className="w-full py-3">
                    {isAnalyzing ? <span className="animate-pulse">جاري تحليل الصورة...</span> : <><Camera size={20}/> مسح الجهاز بالكاميرا (AI Scan)</>}
                </Button>
            </div>

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
        <Button onClick={() => { setEditingId(null); setCurrentForm(defaultForm); setIsModalOpen(true); }}>
            <Plus size={18} /> إضافة جهاز
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
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
            />
        </Modal>
      )}
    </div>
  );
};

const Repairs = () => {
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
        updateRepair(editingId, payload);
    } else {
        addRepair(payload);
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
      }
  }

  const printInvoice = (repair: Repair) => {
    const device = data.devices.find(d => d.id === repair.deviceId);
    const client = data.clients.find(c => c.id === device?.clientId);
    setInvoiceData({ repair, device, client });
    setTimeout(() => window.print(), 100);
  };

  const openWhatsApp = (repair: Repair) => {
    const device = data.devices.find(d => d.id === repair.deviceId);
    const client = data.clients.find(c => c.id === device?.clientId);
    if (!client || !device) return;
    let phone = client.phone.replace(/\D/g, '');
    if (phone.startsWith('01')) phone = '20' + phone.substring(1);

    const message = `مرحباً ${client.name}،
جهازك: ${device.brand} ${device.model}
رقم الأمر: ${repair.id.substring(0, 6)}
العطل: ${repair.problem}
الحالة: ${repair.status}
التكلفة: ${repair.totalCost} ج.م
شكراً لاختياركم ميدو للصيانة.`;
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
        <div className="hidden print:flex print-only flex-col p-8 text-slate-900 h-full">
          <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6 mb-6">
            <div className="flex items-center gap-4">
                 <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center text-white print-color-adjust-exact">
                    <Wrench size={40}/>
                 </div>
                 <div>
                    <h1 className="text-4xl font-black text-slate-900">مركز ميدو</h1>
                    <p className="text-slate-600 font-bold text-lg">Mido Repair Center</p>
                    <p className="text-sm text-slate-500 mt-1">لصيانة المحمول والإلكترونيات</p>
                 </div>
            </div>
            <div className="text-left">
                <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-widest">فاتورة</h2>
                <p className="font-mono text-xl text-slate-600 font-bold">#{invoiceData.repair.id.substring(0, 6)}</p>
                <p className="text-sm text-slate-500 mt-1">{new Date(invoiceData.repair.entryDate).toLocaleString('ar-EG')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 print-color-adjust-exact">
                <h3 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">بيانات العميل</h3>
                <p className="text-xl font-bold text-slate-800 mb-1">{invoiceData.client?.name}</p>
                <p className="font-mono text-slate-600">{invoiceData.client?.phone}</p>
            </div>
             <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 print-color-adjust-exact">
                <h3 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">بيانات الجهاز</h3>
                <p className="text-xl font-bold text-slate-800 mb-1">{invoiceData.device?.brand} {invoiceData.device?.model}</p>
                <div className="flex gap-4 text-sm text-slate-600 mt-2">
                    <span><span className="font-bold">اللون:</span> {invoiceData.device?.color}</span>
                    <span><span className="font-bold">الرمز:</span> {invoiceData.device?.passcode}</span>
                </div>
            </div>
          </div>

          <table className="w-full mb-8 border-collapse">
            <thead>
                <tr className="bg-slate-800 text-white print-color-adjust-exact">
                    <th className="p-4 text-right rounded-tr-lg text-sm font-bold uppercase">الوصف / الخدمة</th>
                    <th className="p-4 text-center text-sm font-bold uppercase">العدد</th>
                    <th className="p-4 text-left rounded-tl-lg text-sm font-bold uppercase">السعر</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-slate-200">
                    <td className="p-4 font-bold text-slate-800">{invoiceData.repair.problem} (تشخيص)</td>
                    <td className="p-4 text-center">1</td>
                    <td className="p-4 text-left font-mono">-</td>
                </tr>
                {invoiceData.repair.services.map((s: string, i: number) => (
                    <tr key={`svc-${i}`} className="border-b border-slate-100">
                        <td className="p-4 text-slate-700">خدمة: {s}</td>
                        <td className="p-4 text-center">1</td>
                        <td className="p-4 text-left font-mono">-</td>
                    </tr>
                ))}
                {invoiceData.repair.parts.map((p: string, i: number) => (
                    <tr key={`prt-${i}`} className="border-b border-slate-100">
                        <td className="p-4 text-slate-700">قطعة غيار: {p}</td>
                        <td className="p-4 text-center">1</td>
                        <td className="p-4 text-left font-mono">-</td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="bg-slate-50 print-color-adjust-exact">
                <tr>
                    <td colSpan={2} className="p-4 font-bold text-slate-700 text-left border-t">قطع الغيار</td>
                    <td className="p-4 font-mono text-left border-t">{invoiceData.repair.costParts}</td>
                </tr>
                 <tr>
                    <td colSpan={2} className="p-4 font-bold text-slate-700 text-left border-t">المصنعية والخدمات</td>
                    <td className="p-4 font-mono text-left border-t">{invoiceData.repair.costServices}</td>
                </tr>
                <tr className="bg-slate-800 text-white text-xl print-color-adjust-exact">
                     <td colSpan={2} className="p-5 font-extrabold text-left rounded-br-lg">الإجمالي المستحق</td>
                     <td className="p-5 font-mono font-bold text-left rounded-bl-lg">{invoiceData.repair.totalCost} ج.م</td>
                </tr>
            </tfoot>
          </table>

          <div className="mt-auto pt-12">
             <div className="grid grid-cols-2 gap-8 text-center mb-8">
                <div>
                    <p className="text-xs font-bold text-slate-400 mb-8 uppercase">توقيع العميل</p>
                    <div className="border-b border-slate-300 w-2/3 mx-auto"></div>
                </div>
                <div>
                     <p className="text-xs font-bold text-slate-400 mb-8 uppercase">ختم المركز</p>
                     <div className="border-b border-slate-300 w-2/3 mx-auto"></div>
                </div>
             </div>
             <div className="text-[10px] text-slate-400 border-t pt-4 text-center">
                <p>تطبق الشروط والأحكام | الضمان 14 يوم على قطع الغيار المستبدلة فقط | المركز غير مسؤول عن فقدان البيانات</p>
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
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 md:py-0">
                <Calendar size={16} className="text-slate-400"/>
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm" 
                    value={dateRange.start} 
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                />
                <span className="text-slate-300">إلى</span>
                <input 
                    type="date" 
                    className="bg-transparent outline-none text-sm" 
                    value={dateRange.end} 
                    onChange={e => setDateRange({...dateRange, end: e.target.value})}
                />
             </div>
        </div>
        <div className="flex items-center gap-2 justify-between">
             <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-[200px] md:max-w-none">
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden no-print">
        <table className="w-full text-right">
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
                        <button onClick={() => openWhatsApp(repair)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="واتساب"><MessageCircle size={18}/></button>
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
                <div className="grid grid-cols-2 gap-2">
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Database size={24}/></div>
            <div>
                <h3 className="text-xl font-bold text-slate-800">النسخ الاحتياطي والاستعادة</h3>
                <p className="text-slate-500">بياناتك مخزنة محلياً على هذا المتصفح.</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={exportDB} className="h-14 text-lg shadow-blue-200">
                <Download size={20}/> تحميل نسخة كاملة
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-14 text-lg">
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
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><Smartphone size={24}/></div>
            <div>
                <h3 className="text-xl font-bold text-slate-800">قائمة الهواتف (Catalog)</h3>
                <p className="text-slate-500">تحديث قاعدة بيانات الموديلات.</p>
            </div>
         </div>
         <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <Button variant="secondary" onClick={() => catalogInputRef.current?.click()}>
                <Upload size={18}/> رفع ملف JSON
            </Button>
            <p className="text-xs text-slate-500 flex-1">تنسيق: <code>[{`{ "brand": "X", "models": ["Y"] }`}]</code></p>
            <input type="file" ref={catalogInputRef} className="hidden" accept=".json" onChange={handleCatalogImport} />
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
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/repairs" element={<Repairs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
