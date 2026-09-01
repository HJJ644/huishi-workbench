export type OrderStatus =
  | "询价"
  | "待定金"
  | "制作中"
  | "待确认"
  | "已交付"
  | "已结算"
  | "跑单"
  | "废稿"
  | "已结单";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  usage: string;
  variantName?: string;
  unit?: string;
}

export interface OrderDiscount {
  id: string;
  itemId?: string;
  name?: string;
  amount: number;
}

export interface Order {
  id: string;
  name: string;
  client: string;
  status: OrderStatus;
  deadline: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  // 新建订单弹窗详细字段
  projectName?: string;
  platform?: string;
  paymentMethod?: string;
  feeRate?: number;
  urgentType?: string;
  publicType?: string;
  extraFeeName?: string;
  extraFeeAmount?: number;
  orderDate?: string;
  receiptNote?: string;
  items?: OrderItem[];
  manualDepositRate?: number;
  manualDepositAmount?: number;
  paidAmount?: number;
  deposit?: number;
  balance?: number;
  discounts?: OrderDiscount[];
  receiptStyle?: string;
  completedAt?: string;
  cancellationInfo?: {
    rate: number;
    fixed: number | null;
    other: number;
    total: number;
  };
  runnerInfo?: {
    refund: number;
    fixed: number | null;
    fee: number;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export interface ProductSurcharge {
  id: string;
  name: string;
  rate: number;
  feeItemId?: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  defaultUsage?: string;
  surcharges: ProductSurcharge[];
  variants: ProductVariant[];
}

export interface FeeItem {
  id: string;
  name: string;
  rate: number;
}

export interface FeeGroup {
  id: string;
  title: string;
  description: string;
  items: FeeItem[];
}

export interface MonthlyIncome {
  month: string;
  income: number;
}

export interface BasicInfo {
  circleName: string;
  contact: string;
  depositRate: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  authMethod?: "email" | "phone";
  authIdentifier?: string;
  email?: string;
}

export interface AppState {
  orders: Order[];
  products: Product[];
  feeGroups: FeeGroup[];
  cloudSync: boolean;
  darkMode: boolean;
  sidebarCollapsed: boolean;
  userProfile: { nickname: string; bio: string };
  basicInfo: BasicInfo;
  auth: AuthState;
}
