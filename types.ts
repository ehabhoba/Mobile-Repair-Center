
export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: number;
}

export interface Device {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  imei?: string;
  passcode?: string; // PIN or Pattern description
  color?: string;
  createdAt: number;
}

export enum RepairStatus {
  PENDING = 'قيد الانتظار',
  IN_PROGRESS = 'جاري العمل',
  DONE = 'تم الإصلاح',
  DELIVERING = 'جاري التسليم',
  DELIVERED = 'تم التسليم',
  CANCELLED = 'ملغي',
}

export interface Repair {
  id: string;
  deviceId: string;
  clientId: string;
  problem: string;
  parts: string[]; // List of parts used
  services: string[]; // List of services performed
  costParts: number;
  costServices: number;
  costOther: number;
  totalCost: number;
  paidAmount: number;
  status: RepairStatus;
  technicianNotes?: string;
  entryDate: number;
  completionDate?: number;
}

export interface PhoneModel {
  brand: string;
  models: string[];
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'RENT' | 'UTILITIES' | 'SALARY' | 'PARTS' | 'OTHER';
  date: number;
  notes?: string;
}

export interface DBData {
  clients: Client[];
  devices: Device[];
  repairs: Repair[];
  expenses: Expense[];
  catalog: PhoneModel[];
}
