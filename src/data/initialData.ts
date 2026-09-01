import type { Order, Product, FeeGroup, MonthlyIncome, BasicInfo } from "../types";

export const initialBasicInfo: BasicInfo = {
  circleName: "",
  contact: "",
  depositRate: 50,
};

export const initialOrders: Order[] = [
  {
    id: "ORD-20260820-001",
    name: "CP 双人插画",
    client: "Luna",
    status: "待确认",
    deadline: "2026-08-22",
    amount: 518,
    note: "2天后",
  },
  {
    id: "ORD-20260819-002",
    name: "原创角色立绘",
    client: "栀子",
    status: "制作中",
    deadline: "2026-08-29",
    amount: 480,
    note: "9天后",
  },
  {
    id: "ORD-20260818-003",
    name: "Q版头像×3",
    client: "阿七",
    status: "待定金",
    deadline: "2026-08-31",
    amount: 270,
    note: "12天后",
  },
  {
    id: "ORD-20260810-004",
    name: "场景插画",
    client: "委托人A",
    status: "已结算",
    deadline: "2026-08-15",
    amount: 280,
  },
  {
    id: "ORD-20260805-005",
    name: "头像稿",
    client: "委托人B",
    status: "已交付",
    deadline: "2026-08-08",
    amount: 120,
  },
];

export const initialProducts: Product[] = [
  {
    id: "p1",
    name: "全身立绘",
    unit: "张",
    price: 480,
    defaultUsage: "自用",
    surcharges: [
      { id: "s1", name: "加急费", rate: 20 },
      { id: "s2", name: "复杂背景", rate: 10 },
    ],
    variants: [],
  },
  {
    id: "p2",
    name: "Q版头像",
    unit: "个",
    price: 60,
    defaultUsage: "自用",
    surcharges: [],
    variants: [],
  },
];

export const initialFeeGroups: FeeGroup[] = [
  {
    id: "payment",
    title: "手续费",
    description: "为不同支付方式设置手续费比例，0 代表不收取",
    items: [
      { id: "f1", name: "支付宝", rate: 0.6 },
      { id: "f2", name: "微信", rate: 0.6 },
      { id: "f3", name: "银行卡", rate: 0 },
      { id: "f4", name: "PayPal", rate: 3.5 },
      { id: "f5", name: "平台担保", rate: 5 },
      { id: "f6", name: "其他", rate: 0 },
    ],
  },
  {
    id: "usage",
    title: "用途",
    description: "不同用途对应不同的费用倍率",
    items: [
      { id: "u1", name: "自用", rate: 0 },
      { id: "u2", name: "商用", rate: 50 },
    ],
  },
  {
    id: "urgency",
    title: "加急",
    description: "加急等级对应的费用倍率",
    items: [
      { id: "r1", name: "不加急", rate: 0 },
      { id: "r2", name: "加急", rate: 20 },
    ],
  },
  {
    id: "public",
    title: "公开",
    description: "公开等级对应的费用倍率",
    items: [
      { id: "p1", name: "公开", rate: 0 },
      { id: "p2", name: "不公开", rate: 0 },
    ],
  },
];

export const monthlyIncomeData: MonthlyIncome[] = [
  { month: "1月", income: 80 },
  { month: "2月", income: 40 },
  { month: "3月", income: 55 },
  { month: "4月", income: 0 },
  { month: "5月", income: 0 },
  { month: "6月", income: 0 },
  { month: "7月", income: 0 },
  { month: "8月", income: 0 },
  { month: "9月", income: 0 },
  { month: "10月", income: 0 },
  { month: "11月", income: 0 },
  { month: "12月", income: 0 },
];
