import { DBData, Client, Device, Repair, PhoneModel, RepairStatus } from '../types';

const DB_KEY = 'mido_repair_shop_v1'; // تم تغيير المفتاح لاسم المحل
const BACKUP_DATE_KEY = 'mido_last_backup_date';

const DEFAULT_CATALOG: PhoneModel[] = [
  { brand: 'Apple', models: ['iPhone 15 Pro Max', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone X/XS'] },
  { brand: 'Samsung', models: ['Galaxy S24 Ultra', 'Galaxy S23', 'Galaxy A54', 'Galaxy A34', 'Galaxy A14', 'Note 20 Ultra'] },
  { brand: 'Xiaomi', models: ['Redmi Note 13', 'POCO X6', 'Xiaomi 14', 'Redmi 12'] },
  { brand: 'Oppo', models: ['Reno 10', 'A78', 'A58'] },
  { brand: 'Realme', models: ['11 Pro', 'C55', 'C53'] },
];

const INITIAL_DB: DBData = {
  clients: [],
  devices: [],
  repairs: [],
  catalog: DEFAULT_CATALOG,
};

export const generateId = (): string => Math.random().toString(36).substring(2, 9).toUpperCase();

// Load DB
export const loadDB = (): DBData => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    saveDB(INITIAL_DB);
    return INITIAL_DB;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.catalog) parsed.catalog = DEFAULT_CATALOG;
    return parsed;
  } catch (e) {
    console.error("Failed to parse DB", e);
    return INITIAL_DB;
  }
};

// Save DB
export const saveDB = (data: DBData) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// Get Last Backup Date
export const getLastBackupDate = (): number | null => {
  const stored = localStorage.getItem(BACKUP_DATE_KEY);
  return stored ? parseInt(stored, 10) : null;
};

// --- Clients ---
export const addClient = (client: Omit<Client, 'id' | 'createdAt'>): Client => {
  const db = loadDB();
  const newClient: Client = { ...client, id: generateId(), createdAt: Date.now() };
  db.clients.push(newClient);
  saveDB(db);
  return newClient;
};

export const updateClient = (id: string, updates: Partial<Client>) => {
  const db = loadDB();
  db.clients = db.clients.map(c => c.id === id ? { ...c, ...updates } : c);
  saveDB(db);
};

export const deleteClient = (id: string) => {
  const db = loadDB();
  db.clients = db.clients.filter(c => c.id !== id);
  // حذف الأجهزة والإصلاحات المرتبطة
  const clientDeviceIds = db.devices.filter(d => d.clientId === id).map(d => d.id);
  db.devices = db.devices.filter(d => d.clientId !== id);
  db.repairs = db.repairs.filter(r => !clientDeviceIds.includes(r.deviceId));
  saveDB(db);
};

// --- Devices ---
export const addDevice = (device: Omit<Device, 'id' | 'createdAt'>): Device => {
  const db = loadDB();
  const newDevice: Device = { ...device, id: generateId(), createdAt: Date.now() };
  db.devices.push(newDevice);
  saveDB(db);
  return newDevice;
};

export const updateDevice = (id: string, updates: Partial<Device>) => {
  const db = loadDB();
  db.devices = db.devices.map(d => d.id === id ? { ...d, ...updates } : d);
  saveDB(db);
};

export const deleteDevice = (id: string) => {
  const db = loadDB();
  db.devices = db.devices.filter(d => d.id !== id);
  db.repairs = db.repairs.filter(r => r.deviceId !== id);
  saveDB(db);
};

// --- Repairs ---
export const addRepair = (repair: Omit<Repair, 'id' | 'entryDate' | 'totalCost'>): Repair => {
  const db = loadDB();
  const total = Number(repair.costParts || 0) + Number(repair.costServices || 0) + Number(repair.costOther || 0);
  const newRepair: Repair = { 
    ...repair, 
    id: generateId(), 
    entryDate: Date.now(), 
    totalCost: total 
  };
  db.repairs.push(newRepair);
  saveDB(db);
  return newRepair;
};

export const updateRepair = (id: string, updates: Partial<Repair>) => {
    const db = loadDB();
    db.repairs = db.repairs.map(r => {
        if (r.id === id) {
            // إعادة حساب الإجمالي إذا تغيرت التكاليف
            const updated = { ...r, ...updates };
            updated.totalCost = Number(updated.costParts || 0) + Number(updated.costServices || 0) + Number(updated.costOther || 0);
            
            // تحديث تاريخ الانتهاء تلقائياً
            if ((updates.status === RepairStatus.DONE || updates.status === RepairStatus.DELIVERED) && 
                r.status !== RepairStatus.DONE && r.status !== RepairStatus.DELIVERED) {
                updated.completionDate = Date.now();
            }
            return updated;
        }
        return r;
    });
    saveDB(db);
};

export const deleteRepair = (id: string) => {
    const db = loadDB();
    db.repairs = db.repairs.filter(r => r.id !== id);
    saveDB(db);
}

// --- Catalog ---
export const updateCatalog = (catalog: PhoneModel[]) => {
  const db = loadDB();
  db.catalog = catalog;
  saveDB(db);
};

// --- Backup/Restore ---
const downloadJSON = (data: any, filename: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

export const exportDB = () => {
  const db = loadDB();
  downloadJSON(db, "Mido_Full_Backup_" + new Date().toISOString().split('T')[0] + ".json");
  // Save the current timestamp as the last backup date
  localStorage.setItem(BACKUP_DATE_KEY, Date.now().toString());
};

export const exportSpecificTable = (key: 'clients' | 'devices' | 'repairs') => {
    const db = loadDB();
    const data = db[key];
    downloadJSON(data, `Mido_${key.toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`);
};

export const importDB = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Simple validation logic
        if (json.clients || json.devices || json.repairs) {
          // If full DB structure
          if (json.clients && Array.isArray(json.clients)) saveDB(json);
          // If partial structure (advanced logic omitted for simplicity, assumes full replacement for now or valid structure)
          
          // Reset backup timer on import
          localStorage.setItem(BACKUP_DATE_KEY, Date.now().toString());
          resolve(true);
        } else if (Array.isArray(json)) {
            // Allow importing raw arrays if user knows what they are doing? 
            // For now, strict full DB import is safer for the user.
            reject(new Error("صيغة الملف غير مدعومة. يرجى استخدام ملف نسخة احتياطية كامل."));
        } else {
          reject(new Error("صيغة الملف غير صحيحة"));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
};