import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, RefreshCw, Download } from "lucide-react";
import { useApp } from "../store/AppContext";
import { downloadElementAsPng } from "../utils/downloadPng";
import type { Order, OrderItem, OrderDiscount } from "../types";
import { Modal } from "./Modal";
import { OrderReceipt } from "./OrderReceipt";

const platforms = [
  "淘宝",
  "闲鱼",
  "微博",
  "QQ",
  "微信",
  "米画师",
  "B站",
  "小红书",
  "LOFTER",
  "半次元",
  "画加",
  "其他",
];

const receiptStyles = [
  "默认热敏票",
  "经典黑白",
  "简约灰调",
  "黑白简约",
  "超市热敏票",
  "餐饮点单",
  "正式发票",
  "快递面单",
  "手账清单",
  "鲜果小票",
];

function formatMoney(n: number) {
  return `¥${n.toFixed(2)}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  order?: Order;
}

export function CreateOrderModal({ open, onClose, order }: CreateOrderModalProps) {
  const { dispatch, feeGroups, basicInfo, products, showToast } = useApp();

  const paymentItems = useMemo(
    () => feeGroups.find((g) => g.title === "手续费")?.items ?? [],
    [feeGroups]
  );
  const urgentItems = useMemo(
    () => feeGroups.find((g) => g.title === "加急")?.items ?? [],
    [feeGroups]
  );
  const publicItems = useMemo(
    () => feeGroups.find((g) => g.title === "公开")?.items ?? [],
    [feeGroups]
  );
  const usageItems = useMemo(
    () => feeGroups.find((g) => g.title === "用途")?.items ?? [],
    [feeGroups]
  );

  const [projectName, setProjectName] = useState("");
  const [platform, setPlatform] = useState("");
  const [customPlatform, setCustomPlatform] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [feeRate, setFeeRate] = useState(0);
  const [urgentType, setUrgentType] = useState(urgentItems[0]?.name ?? "");
  const [publicType, setPublicType] = useState(publicItems[0]?.name ?? "");
  const [extraFeeName, setExtraFeeName] = useState("");
  const [extraFeeAmount, setExtraFeeAmount] = useState(0);
  const [orderDate, setOrderDate] = useState(today());
  const [deadline, setDeadline] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { id: uid(), name: "", price: 0, quantity: 1, usage: usageItems[0]?.name ?? "", unit: "" },
  ]);
  const [manualDepositRate, setManualDepositRate] = useState(50);
  const [manualDepositAmount, setManualDepositAmount] = useState<number | "">("");
  const [discounts, setDiscounts] = useState<OrderDiscount[]>([]);
  const [receiptStyle, setReceiptStyle] = useState("默认热敏票");
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (order) {
      setProjectName(order.projectName ?? order.name ?? "");
      setPlatform(order.platform ?? "");
      setCustomPlatform("");
      setPaymentMethod(order.paymentMethod ?? "");
      setFeeRate(order.feeRate ?? 0);
      setUrgentType(order.urgentType ?? urgentItems[0]?.name ?? "");
      setPublicType(order.publicType ?? publicItems[0]?.name ?? "");
      setExtraFeeName(order.extraFeeName ?? "");
      setExtraFeeAmount(order.extraFeeAmount ?? 0);
      setOrderDate(order.orderDate ?? today());
      setDeadline(order.deadline ?? "");
      setReceiptNote(order.receiptNote ?? order.note ?? "");
      setItems(
        order.items && order.items.length > 0
          ? order.items.map((it) => ({ ...it }))
          : [{ id: uid(), name: "", price: 0, quantity: 1, usage: usageItems[0]?.name ?? "", unit: "" }]
      );
      setManualDepositRate(order.manualDepositRate ?? basicInfo.depositRate ?? 50);
      setManualDepositAmount(order.manualDepositAmount ?? "");
      setDiscounts(order.discounts ? order.discounts.map((d) => ({ ...d })) : []);
      setReceiptStyle(order.receiptStyle ?? "默认热敏票");
    } else {
      setProjectName("");
      setPlatform("");
      setCustomPlatform("");
      setPaymentMethod("");
      setFeeRate(0);
      setUrgentType(urgentItems[0]?.name ?? "");
      setPublicType(publicItems[0]?.name ?? "");
      setExtraFeeName("");
      setExtraFeeAmount(0);
      setOrderDate(today());
      setDeadline("");
      setReceiptNote("");
      setItems([{ id: uid(), name: "", price: 0, quantity: 1, usage: usageItems[0]?.name ?? "", unit: "" }]);
      setManualDepositRate(basicInfo.depositRate ?? 50);
      setManualDepositAmount("");
      setDiscounts([]);
      setReceiptStyle("默认热敏票");
    }
  }, [open, order, paymentItems, urgentItems, publicItems, usageItems, basicInfo.depositRate]);

  // 计算：用途费率作为加价；加急/公开作为附加费比例；再按制品扣减优惠
  const itemLines = useMemo(() => {
    return items.map((item) => {
      const usage = usageItems.find((u) => u.name === item.usage);
      const usageRate = usage?.rate ?? 0;
      const base = item.price * item.quantity;
      const beforeItemDiscount = base * (1 + usageRate / 100);
      const itemDiscount = discounts
        .filter((d) => d.itemId === item.id || (!d.itemId && d.name === item.name))
        .reduce((sum, d) => sum + d.amount, 0);
      const adjusted = Math.max(0, beforeItemDiscount - itemDiscount);
      const product = products.find((p) => p.name === item.name);
      return {
        ...item,
        base,
        beforeItemDiscount,
        itemDiscount,
        adjusted,
        usageRate,
        unit: item.unit || product?.unit || "件",
      };
    });
  }, [items, usageItems, products, discounts]);

  const productTotal = useMemo(
    () => itemLines.reduce((sum, item) => sum + item.beforeItemDiscount, 0),
    [itemLines]
  );
  const urgentRate = useMemo(
    () => urgentItems.find((u) => u.name === urgentType)?.rate ?? 0,
    [urgentItems, urgentType]
  );
  const publicRate = useMemo(
    () => publicItems.find((p) => p.name === publicType)?.rate ?? 0,
    [publicItems, publicType]
  );
  const urgentFee = useMemo(() => productTotal * (urgentRate / 100), [productTotal, urgentRate]);
  const publicFee = useMemo(() => productTotal * (publicRate / 100), [productTotal, publicRate]);
  const discountTotal = useMemo(
    () => discounts.reduce((sum, d) => sum + d.amount, 0),
    [discounts]
  );
  const beforeDiscount = useMemo(
    () => productTotal + urgentFee + publicFee + extraFeeAmount,
    [productTotal, urgentFee, publicFee, extraFeeAmount]
  );
  const payable = useMemo(
    () => Math.max(0, beforeDiscount - discountTotal),
    [beforeDiscount, discountTotal]
  );
  const fee = useMemo(() => payable * (feeRate / 100), [payable, feeRate]);
  const paid = useMemo(() => payable + fee, [payable, fee]);
  const hasManualDeposit = manualDepositAmount !== "" && Number(manualDepositAmount) > 0;
  const deposit = useMemo(
    () =>
      hasManualDeposit
        ? Number(manualDepositAmount)
        : paid * (manualDepositRate / 100),
    [hasManualDeposit, manualDepositAmount, paid, manualDepositRate]
  );
  const balance = useMemo(() => Math.max(0, paid - deposit), [paid, deposit]);

  const receiptTitle = projectName.trim() || "未命名";
  const orderId = useMemo(() => order?.id ?? `ORD-${Date.now()}`, [order?.id]);

  function displayItemName(item: OrderItem): string {
    const base = item.name.trim() || "未命名";
    return item.variantName ? `${base}-${item.variantName}` : base;
  }

  function updateItem(id: string, patch: Partial<OrderItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uid(), name: "", price: 0, quantity: 1, usage: usageItems[0]?.name ?? "", unit: "" },
    ]);
  }

  function addDiscount() {
    const firstItem = items.find((it) => it.name.trim() !== "") ?? items[0];
    setDiscounts((prev) => [
      ...prev,
      { id: uid(), itemId: firstItem?.id, name: firstItem?.name, amount: 0 },
    ]);
  }

  function updateDiscount(id: string, patch: Partial<OrderDiscount>) {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  }

  function removeDiscount(id: string) {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleDownloadReceipt() {
    if (!receiptRef.current) return;
    try {
      const safeName = (projectName.trim() || "未命名").replace(
        /[\\/:*?"<>|]/g,
        "_"
      );
      const safeId = orderId.replace(/[\\/:*?"<>|]/g, "_");
      await downloadElementAsPng(
        receiptRef.current,
        `${safeName}_${safeId}.png`
      );
    } catch {
      alert("小票下载失败，请重试");
    }
  }

  function handleSave() {
    const orderName = projectName.trim() || "未命名";
    const finalPlatform = platform === "其他" ? customPlatform.trim() || "其他" : platform;
    const payload = {
      id: order?.id ?? orderId,
      name: orderName,
      client: finalPlatform || "未知甲方",
      status: order?.status ?? ("待定金" as const),
      deadline: deadline || orderDate,
      amount: paid,
      note: receiptNote,
      projectName: orderName,
      platform: finalPlatform,
      paymentMethod,
      feeRate,
      urgentType,
      publicType,
      extraFeeName,
      extraFeeAmount,
      orderDate,
      receiptNote,
      items,
      manualDepositRate,
      manualDepositAmount: manualDepositAmount === "" ? undefined : Number(manualDepositAmount),
      paidAmount: paid,
      deposit,
      balance,
      discounts,
      receiptStyle,
    };
    dispatch({
      type: order ? "UPDATE_ORDER" : "ADD_ORDER",
      payload,
    });
    showToast("保存成功");
    onClose();
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text focus:border-accent transition";
  const labelClass = "block text-sm text-text-secondary mb-1.5";
  const sectionClass = "bg-surface rounded-xl border border-border p-5";

  const finalPlatform =
    platform === "其他" ? customPlatform.trim() || "其他" : platform;

  const previewOrder: Order = useMemo(
    () => ({
      id: orderId,
      name: receiptTitle,
      client: finalPlatform || "未知甲方",
      status: order?.status ?? "待定金",
      deadline: deadline || orderDate,
      amount: paid,
      projectName: receiptTitle,
      platform: finalPlatform,
      paymentMethod,
      feeRate,
      urgentType,
      publicType,
      extraFeeName,
      extraFeeAmount,
      orderDate,
      receiptNote,
      items,
      manualDepositRate,
      manualDepositAmount:
        manualDepositAmount === "" ? undefined : Number(manualDepositAmount),
      paidAmount: paid,
      deposit,
      balance,
      discounts,
      receiptStyle,
    }),
    [
      orderId,
      receiptTitle,
      finalPlatform,
      order?.status,
      deadline,
      orderDate,
      paid,
      paymentMethod,
      feeRate,
      urgentType,
      publicType,
      extraFeeName,
      extraFeeAmount,
      receiptNote,
      items,
      manualDepositRate,
      manualDepositAmount,
      deposit,
      balance,
      discounts,
      receiptStyle,
    ]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order ? "编辑订单" : "新建订单"}
      className="max-w-5xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between w-full">
          <div className="text-lg font-semibold text-text">
            合计：{formatMoney(paid)}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-text text-sm font-medium hover:bg-surface transition"
            >
              取消编辑
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-tag text-white text-sm font-medium hover:opacity-90 transition"
            >
              保存订单
            </button>
            <button
              onClick={handleDownloadReceipt}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition"
            >
              <Download className="w-4 h-4" />
              下载小票
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 接单信息 */}
        <div className={sectionClass}>
          <h4 className="text-sm font-medium text-text mb-4">接单信息</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>企划名称</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={inputClass}
                placeholder="输入企划名称"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>接单平台</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={inputClass}
              >
                <option value="">请选择平台</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {platform === "其他" && (
                <input
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  className={`${inputClass} mt-2`}
                  placeholder="请输入平台名称"
                />
              )}
            </div>
            <div>
              <label className={labelClass}>支付方式</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const name = e.target.value;
                  setPaymentMethod(name);
                  const item = paymentItems.find((i) => i.name === name);
                  setFeeRate(item?.rate ?? 0);
                }}
                className={inputClass}
              >
                <option value="">请选择支付</option>
                {paymentItems.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>手续费 (%)</label>
              <input
                type="number"
                min={0}
                value={feeRate}
                readOnly
                className={`${inputClass} bg-surface cursor-not-allowed`}
                title="根据所选支付方式自动同步"
              />
            </div>
            <div>
              <label className={labelClass}>加急</label>
              <select
                value={urgentType}
                onChange={(e) => setUrgentType(e.target.value)}
                className={inputClass}
              >
                {urgentItems.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-text-muted">
                费率 {urgentRate}%
                {urgentRate === 0 ? "（无附加费）" : "（来自设置）"}
              </p>
            </div>
            <div>
              <label className={labelClass}>公开</label>
              <select
                value={publicType}
                onChange={(e) => setPublicType(e.target.value)}
                className={inputClass}
              >
                {publicItems.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-text-muted">
                费率 {publicRate}%
                {publicRate === 0 ? "（无附加费）" : "（来自设置）"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>其他费用名称</label>
                <input
                  value={extraFeeName}
                  onChange={(e) => setExtraFeeName(e.target.value)}
                  className={inputClass}
                  placeholder="例如：排版费"
                />
              </div>
              <div>
                <label className={labelClass}>其他费用金额</label>
                <input
                  type="number"
                  min={0}
                  value={extraFeeAmount}
                  onChange={(e) =>
                    setExtraFeeAmount(Math.max(0, Number(e.target.value)))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>下单时间</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>截稿日期</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>小票底部备注</label>
              <textarea
                value={receiptNote}
                onChange={(e) => setReceiptNote(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="显示在小票底部的额外说明（如退改政策、联系方式等）"
              />
            </div>
          </div>
        </div>

        {/* 制品明细 */}
        <div className={sectionClass}>
          <h4 className="text-sm font-medium text-text mb-4">制品明细</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-text-secondary border-b border-border">
                  <th className="text-left py-2 font-medium">制品</th>
                  <th className="text-left py-2 font-medium w-28">单价</th>
                  <th className="text-left py-2 font-medium w-24">数量</th>
                  <th className="text-left py-2 font-medium w-32">用途</th>
                  <th className="text-left py-2 font-medium w-28">小计</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {itemLines.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2">
                      <select
                        value={products.find((p) => p.name === item.name)?.id ?? ""}
                        onChange={(e) => {
                          const product = products.find((p) => p.id === e.target.value);
                          if (!product) return;
                          const productUsage = product.surcharges[0];
                          const defaultUsage = productUsage
                            ? usageItems.find((u) => u.id === productUsage.feeItemId)?.name ??
                              usageItems.find((u) => u.name === productUsage.name)?.name ??
                              usageItems[0]?.name ?? ""
                            : usageItems[0]?.name ?? "";
                          updateItem(item.id, {
                            name: product.name,
                            price: product.price,
                            usage: defaultUsage,
                            variantName: "",
                            unit: product.unit,
                          });
                        }}
                        className={inputClass}
                      >
                        <option value="">请选择制品</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const product = products.find((p) => p.name === item.name);
                        if (!product || product.variants.length === 0) return null;
                        return (
                          <select
                            value={item.variantName ?? ""}
                            onChange={(e) => {
                              const variantName = e.target.value;
                              const variant = product.variants.find(
                                (v) => v.name === variantName
                              );
                              updateItem(item.id, {
                                variantName,
                                price: variant?.price ?? product.price,
                              });
                            }}
                            className={`${inputClass} mt-1.5 text-xs`}
                          >
                            <option value="">默认</option>
                            {product.variants.map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name} ({formatMoney(v.price)})
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        value={item.price}
                        onChange={(e) =>
                          updateItem(item.id, { price: Number(e.target.value) })
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <div className="relative">
                        <select
                          value={item.usage}
                          onChange={(e) =>
                            updateItem(item.id, { usage: e.target.value })
                          }
                          className={`${inputClass} w-full pr-14`}
                        >
                          {usageItems.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                          费率 {(usageItems.find((u) => u.name === item.usage)?.rate ?? 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-text font-medium">
                      {formatMoney(item.beforeItemDiscount)}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-text-secondary hover:text-danger transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addItem}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-sm text-text-secondary hover:bg-bg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            添加一行
          </button>
          <p className="mt-2 text-xs text-text-muted">
            用途费率按加价计算：小计 = 单价 × 数量 × (1 + 用途费率%)。
          </p>
        </div>

        {/* 定金 */}
        <div className={sectionClass}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>定金比例 (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={manualDepositRate}
                  onChange={(e) =>
                    setManualDepositRate(
                      Math.min(100, Math.max(0, Number(e.target.value)))
                    )
                  }
                  className={inputClass}
                />
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  同步自设置（{basicInfo.depositRate}%）
                </span>
              </div>
            </div>
            <div>
              <label className={labelClass}>定金金额（选填）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="不填则按比例自动计算"
                  value={manualDepositAmount}
                  onChange={(e) => setManualDepositAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inputClass}
                />
                <span className="text-xs text-text-secondary whitespace-nowrap">
                  填写后以此为准
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 优惠明细 */}
        <div className={sectionClass}>
          <h4 className="text-sm font-medium text-text mb-4">优惠明细</h4>
          <div className="space-y-2">
            {discounts.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3">
                <select
                  value={d.itemId ?? d.name ?? ""}
                  onChange={(e) => {
                    const item = items.find((it) => it.id === e.target.value);
                    updateDiscount(d.id, {
                      itemId: item?.id,
                      name: item?.name,
                    });
                  }}
                  className={inputClass}
                >
                  <option value="">请选择制品</option>
                  {items
                    .filter((it) => it.name.trim() !== "")
                    .map((it) => (
                      <option key={it.id} value={it.id}>
                        {displayItemName(it)}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={d.amount}
                  onChange={(e) =>
                    updateDiscount(d.id, { amount: Number(e.target.value) })
                  }
                  className={inputClass}
                  placeholder="减免金额"
                />
                <button
                  onClick={() => removeDiscount(d.id)}
                  className="p-1.5 text-text-secondary hover:text-danger transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addDiscount}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-sm text-text-secondary hover:bg-bg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            添加
          </button>
        </div>

        {/* 小票样式 */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <label className={labelClass}>小票样式</label>
            <button className="flex items-center gap-1.5 text-xs text-accent hover:opacity-80 transition">
              <RefreshCw className="w-3.5 h-3.5" />
              刷新预览
            </button>
          </div>
          <select
            value={receiptStyle}
            onChange={(e) => setReceiptStyle(e.target.value)}
            className={inputClass}
          >
            {receiptStyles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 小票预览 */}
        <OrderReceipt ref={receiptRef} order={previewOrder} feeGroups={feeGroups} />
      </div>
    </Modal>
  );
}
