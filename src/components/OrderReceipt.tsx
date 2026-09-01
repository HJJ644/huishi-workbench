import { forwardRef, useMemo } from "react";
import type { Order, FeeGroup, OrderItem } from "../types";

function formatMoney(n: number) {
  return `¥${n.toFixed(2)}`;
}

function displayItemName(item: { name: string; variantName?: string }) {
  const base = item.name.trim() || "未命名";
  return item.variantName ? `${base}-${item.variantName}` : base;
}

interface ReceiptTheme {
  wrapper: string;
  text: string;
  muted: string;
  border: string;
  title: string;
  amount: string;
  badge: string;
  dot: string;
  layout: string;
  pad: string;
  width: number;
}

function getTheme(style?: string): ReceiptTheme {
  const map: Record<string, ReceiptTheme> = {
    经典黑白: {
      wrapper: "bg-white",
      text: "text-gray-900",
      muted: "text-gray-500",
      border: "border-gray-900",
      title: "text-gray-900",
      amount: "text-gray-900",
      badge: "bg-gray-100 text-gray-800",
      dot: "bg-gray-900",
      layout: "classic",
      pad: "p-6 sm:p-8",
      width: 360,
    },
    简约灰调: {
      wrapper: "bg-gray-50",
      text: "text-gray-700",
      muted: "text-gray-400",
      border: "border-gray-300",
      title: "text-gray-800",
      amount: "text-gray-800",
      badge: "bg-gray-200 text-gray-700",
      dot: "bg-gray-500",
      layout: "classic",
      pad: "p-6 sm:p-8",
      width: 360,
    },
    超市热敏票: {
      wrapper: "bg-white",
      text: "text-gray-900",
      muted: "text-gray-500",
      border: "border-gray-900",
      title: "text-gray-900",
      amount: "text-gray-900",
      badge: "bg-gray-100 text-gray-800",
      dot: "bg-gray-900",
      layout: "thermal",
      pad: "p-6 sm:px-10 sm:py-8",
      width: 260,
    },
    默认热敏票: {
      wrapper: "bg-white",
      text: "text-gray-900",
      muted: "text-gray-500",
      border: "border-gray-900",
      title: "text-gray-900",
      amount: "text-gray-900",
      badge: "bg-gray-100 text-gray-800",
      dot: "bg-gray-900",
      layout: "thermal-detail",
      pad: "p-6 sm:px-10 sm:py-8",
      width: 320,
    },
    餐饮点单: {
      wrapper: "bg-red-50",
      text: "text-red-900",
      muted: "text-red-500/70",
      border: "border-red-400",
      title: "text-red-900",
      amount: "text-red-800",
      badge: "bg-red-100 text-red-800",
      dot: "bg-red-600",
      layout: "restaurant",
      pad: "p-6 sm:p-8",
      width: 360,
    },
    正式发票: {
      wrapper: "bg-slate-50",
      text: "text-slate-800",
      muted: "text-slate-500",
      border: "border-slate-300",
      title: "text-slate-900",
      amount: "text-blue-700",
      badge: "bg-blue-50 text-blue-700",
      dot: "bg-blue-600",
      layout: "invoice",
      pad: "p-6 sm:p-8",
      width: 400,
    },
    快递面单: {
      wrapper: "bg-yellow-50",
      text: "text-yellow-900",
      muted: "text-yellow-700",
      border: "border-yellow-400",
      title: "text-yellow-900",
      amount: "text-yellow-800",
      badge: "bg-yellow-100 text-yellow-800",
      dot: "bg-yellow-600",
      layout: "waybill",
      pad: "p-5 sm:p-6",
      width: 380,
    },
    手账清单: {
      wrapper: "bg-amber-100",
      text: "text-stone-800",
      muted: "text-stone-500",
      border: "border-stone-400",
      title: "text-stone-800",
      amount: "text-stone-800",
      badge: "bg-stone-200 text-stone-700",
      dot: "bg-stone-600",
      layout: "journal",
      pad: "p-6 sm:p-8",
      width: 320,
    },
    鲜果小票: {
      wrapper: "bg-green-50",
      text: "text-green-900",
      muted: "text-green-600",
      border: "border-green-200",
      title: "text-green-800",
      amount: "text-green-900",
      badge: "bg-green-100 text-green-800",
      dot: "bg-green-600",
      layout: "fruit",
      pad: "p-6 sm:p-8",
      width: 320,
    },
    黑白简约: {
      wrapper: "bg-white",
      text: "text-gray-900",
      muted: "text-gray-500",
      border: "border-gray-300",
      title: "text-gray-900",
      amount: "text-gray-900",
      badge: "bg-gray-100 text-gray-700",
      dot: "bg-gray-900",
      layout: "minimal",
      pad: "p-8 sm:p-10",
      width: 380,
    },
  };
  const normalizedStyle = style === "明细热敏票" ? "默认热敏票" : style;
  return (
    map[normalizedStyle ?? "默认热敏票"] ?? {
      wrapper: "bg-white",
      text: "text-gray-900",
      muted: "text-gray-500",
      border: "border-gray-900",
      title: "text-gray-900",
      amount: "text-gray-900",
      badge: "bg-gray-100 text-gray-800",
      dot: "bg-gray-900",
      layout: "classic",
      pad: "p-6 sm:p-8",
      width: 360,
    }
  );
}

function findRate(groups: FeeGroup[], groupTitle: string, itemName?: string) {
  if (!itemName) return 0;
  return (
    groups.find((g) => g.title === groupTitle)?.items.find((i) => i.name === itemName)
      ?.rate ?? 0
  );
}

interface LineItem extends OrderItem {
  base: number;
  beforeItemDiscount: number;
  itemDiscount: number;
  adjusted: number;
  usageRate: number;
  unit: string;
}

interface ReceiptData {
  itemLines: LineItem[];
  productTotal: number;
  urgentFee: number;
  publicFee: number;
  extraFee: number;
  beforeDiscount: number;
  discountTotal: number;
  payable: number;
  fee: number;
  paid: number;
  deposit: number;
  balance: number;
}

function computeReceiptData(order: Order, feeGroups: FeeGroup[]): ReceiptData {
  const itemLines: LineItem[] = (order.items || []).map((item) => {
    const usageRate = findRate(feeGroups, "用途", item.usage);
    const base = item.price * item.quantity;
    const beforeItemDiscount = base * (1 + usageRate / 100);
    const itemDiscount =
      order.discounts?.filter(
        (d) => d.itemId === item.id || (!d.itemId && d.name === item.name)
      )
        .reduce((s, d) => s + d.amount, 0) ?? 0;
    const adjusted = Math.max(0, beforeItemDiscount - itemDiscount);
    return {
      ...item,
      base,
      beforeItemDiscount,
      itemDiscount,
      adjusted,
      usageRate,
      unit: item.unit || "件",
    };
  });

  const productTotal = itemLines.reduce((sum, item) => sum + item.beforeItemDiscount, 0);
  const urgentRate = findRate(feeGroups, "加急", order.urgentType);
  const publicRate = findRate(feeGroups, "公开", order.publicType);
  const urgentFee = productTotal * (urgentRate / 100);
  const publicFee = productTotal * (publicRate / 100);
  const extraFee = order.extraFeeAmount ?? 0;
  const beforeDiscount = productTotal + urgentFee + publicFee + extraFee;
  const discountTotal =
    order.discounts?.reduce((sum, d) => sum + (d.amount || 0), 0) ?? 0;
  const payable = Math.max(0, beforeDiscount - discountTotal);
  const fee = payable * ((order.feeRate ?? 0) / 100);
  const paid = payable + fee;
  const manualDepositAmount = order.manualDepositAmount;
  const hasManualDeposit =
    typeof manualDepositAmount === "number" && manualDepositAmount > 0;
  const deposit = hasManualDeposit
    ? manualDepositAmount
    : paid * ((order.manualDepositRate ?? 50) / 100);
  const balance = Math.max(0, paid - deposit);

  return {
    itemLines,
    productTotal,
    urgentFee,
    publicFee,
    extraFee,
    beforeDiscount,
    discountTotal,
    payable,
    fee,
    paid,
    deposit,
    balance,
  };
}

interface OrderReceiptProps {
  order: Order;
  feeGroups: FeeGroup[];
}

export const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ order, feeGroups }, ref) => {
    const theme = useMemo(() => getTheme(order.receiptStyle), [order.receiptStyle]);
    const layout = theme.layout;
    const title = order.projectName?.trim() || order.name || "未命名";
    const orderId = order.id || "-";
    const orderDate = order.orderDate || "-";
    const deadline = order.deadline || "-";
    const platform = order.platform || order.client || "-";

    const {
      itemLines,
      urgentFee,
      publicFee,
      extraFee,
      beforeDiscount,
      discountTotal,
      payable,
      fee,
      paid,
      deposit,
      balance,
    } = useMemo(() => computeReceiptData(order, feeGroups), [order, feeGroups]);

    return (
      <div
        ref={ref}
        className={`w-fit mx-auto rounded-xl border ${theme.border} ${theme.wrapper} ${theme.pad} transition-colors overflow-hidden`}
      >
        {layout === "thermal" && (
          <div
            className={`mx-auto font-mono text-xs leading-snug ${theme.text}`}
            style={{ width: theme.width }}
          >
            <div className={`text-center font-bold text-base tracking-wider ${theme.title}`}>
              {title}
            </div>
            <div className={`text-center text-xs ${theme.muted}`}>报 价 单 / QUOTATION</div>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-[72px] text-left align-top whitespace-nowrap">订单编号</td>
                  <td className="text-right align-top break-all">{orderId}</td>
                </tr>
                <tr>
                  <td className="text-left align-top whitespace-nowrap">下单日期</td>
                  <td className="text-right align-top">{orderDate}</td>
                </tr>
                <tr>
                  <td className="text-left align-top whitespace-nowrap">截稿日期</td>
                  <td className="text-right align-top">{deadline}</td>
                </tr>
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <tbody>
                {itemLines.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="align-top break-all">
                      <span className="break-all">{displayItemName(item)}</span>
                      {item.usageRate !== 0 && (
                        <span className={`ml-1 text-[11px] ${theme.muted} break-all`}>
                          [{item.usage}]
                        </span>
                      )}
                      <div className={`text-[11px] ${theme.muted}`}>
                        {formatMoney(item.price)} x {item.quantity}
                      </div>
                    </td>
                    <td className="w-[80px] text-right align-top whitespace-nowrap">
                      {item.itemDiscount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{formatMoney(item.adjusted)}</span>
                          <span className={`text-[11px] line-through ${theme.muted}`}>
                            {formatMoney(item.beforeItemDiscount)}
                          </span>
                        </div>
                      ) : (
                        formatMoney(item.beforeItemDiscount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <tbody>
                {urgentFee > 0 && (
                  <tr>
                    <td className="text-left align-top">加急费</td>
                    <td className="w-[80px] text-right align-top whitespace-nowrap">
                      {formatMoney(urgentFee)}
                    </td>
                  </tr>
                )}
                {publicFee > 0 && (
                  <tr>
                    <td className="text-left align-top">不公开费</td>
                    <td className="w-[80px] text-right align-top whitespace-nowrap">
                      {formatMoney(publicFee)}
                    </td>
                  </tr>
                )}
                {extraFee > 0 && (
                  <tr>
                    <td className="text-left align-top break-all">
                      {order.extraFeeName || "其他费用"}
                    </td>
                    <td className="w-[80px] text-right align-top whitespace-nowrap">
                      {formatMoney(extraFee)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="text-left align-top">优惠前应付</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap">
                    {formatMoney(beforeDiscount)}
                  </td>
                </tr>
                <tr>
                  <td className="text-left align-top">手续费</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap">
                    {formatMoney(fee)}
                  </td>
                </tr>
                <tr>
                  <td className="text-left align-top">优惠</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap">
                    -{formatMoney(discountTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="text-left align-top font-semibold">优惠后金额</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap font-semibold">
                    {formatMoney(payable)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <div className={`text-center font-bold text-base ${theme.amount}`}>
              实付 {formatMoney(paid)}
            </div>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className={`text-left align-top text-[11px] ${theme.muted}`}>
                    定金 {formatMoney(deposit)}
                  </td>
                  <td className={`text-right align-top text-[11px] ${theme.muted}`}>
                    尾款 {formatMoney(balance)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <div className={`text-center text-[11px] ${theme.muted}`}>*** 谢谢惠顾 ***</div>
            {(order.receiptNote ?? "").trim() && (
              <div className={`text-center text-[11px] mt-1 break-all ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </div>
            )}
          </div>
        )}

        {layout === "thermal-detail" && (
          <div
            className={`mx-auto font-mono text-xs leading-snug ${theme.text}`}
            style={{ width: theme.width }}
          >
            <div className={`text-center font-bold text-base tracking-wider ${theme.title}`}>
              {title}
            </div>
            <div className={`text-center text-xs ${theme.muted}`}>报 价 单 / QUOTATION</div>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-[72px] text-left align-top whitespace-nowrap">订单编号</td>
                  <td className="text-right align-top break-all">{orderId}</td>
                </tr>
                <tr>
                  <td className="text-left align-top whitespace-nowrap">下单日期</td>
                  <td className="text-right align-top">{orderDate}</td>
                </tr>
                <tr>
                  <td className="text-left align-top whitespace-nowrap">截稿日期</td>
                  <td className="text-right align-top">{deadline}</td>
                </tr>
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <thead>
                <tr className={`text-[11px] ${theme.muted}`}>
                  <th className="text-left font-normal py-1">商品</th>
                  <th className="text-right font-normal py-1 w-[60px]">单价</th>
                  <th className="text-right font-normal py-1 w-[50px]">数量</th>
                  <th className="text-right font-normal py-1 w-[70px]">小计</th>
                </tr>
              </thead>
              <tbody>
                {itemLines.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="align-top break-all">
                      <span className="break-all">{displayItemName(item)}</span>
                      {item.usageRate !== 0 && (
                        <span className={`block text-[10px] ${theme.muted} break-all`}>
                          [{item.usage}]
                        </span>
                      )}
                    </td>
                    <td className="text-right align-top whitespace-nowrap">
                      {formatMoney(item.price)}
                    </td>
                    <td className="text-right align-top whitespace-nowrap">
                      {item.quantity}
                      {item.unit}
                    </td>
                    <td className="text-right align-top whitespace-nowrap">
                      {item.itemDiscount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{formatMoney(item.adjusted)}</span>
                          <span className={`text-[11px] line-through ${theme.muted}`}>
                            {formatMoney(item.beforeItemDiscount)}
                          </span>
                        </div>
                      ) : (
                        formatMoney(item.beforeItemDiscount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <tbody>
                {urgentFee > 0 && (
                  <tr>
                    <td className="text-left align-top">加急费</td>
                    <td className="w-[80px] text-right align-top whitespace-nowrap">
                      {formatMoney(urgentFee)}
                    </td>
                  </tr>
                )}
                {publicFee > 0 && (
                  <tr>
                    <td className="text-left align-top">不公开费</td>
                    <td className="w-[80px] text-right align-top whitespace-nowrap">
                      {formatMoney(publicFee)}
                    </td>
                  </tr>
                )}
                {extraFee > 0 && (
                  <tr>
                    <td className="text-left align-top break-all">
                      {order.extraFeeName || "其他费用"}
                    </td>
                    <td className="w-[80px] text-right align-top whitespace-nowrap">
                      {formatMoney(extraFee)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="text-left align-top">优惠前应付</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap">
                    {formatMoney(beforeDiscount)}
                  </td>
                </tr>
                <tr>
                  <td className="text-left align-top">手续费</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap">
                    {formatMoney(fee)}
                  </td>
                </tr>
                <tr>
                  <td className="text-left align-top">优惠</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap">
                    -{formatMoney(discountTotal)}
                  </td>
                </tr>
                <tr>
                  <td className="text-left align-top font-semibold">优惠后金额</td>
                  <td className="w-[80px] text-right align-top whitespace-nowrap font-semibold">
                    {formatMoney(payable)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <div className={`text-center font-bold text-base ${theme.amount}`}>
              实付 {formatMoney(paid)}
            </div>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className={`text-left align-top text-[11px] ${theme.muted}`}>
                    定金 {formatMoney(deposit)}
                  </td>
                  <td className={`text-right align-top text-[11px] ${theme.muted}`}>
                    尾款 {formatMoney(balance)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <div className={`text-center text-[11px] ${theme.muted}`}>*** 谢谢惠顾 ***</div>
            {(order.receiptNote ?? "").trim() && (
              <div className={`text-center text-[11px] mt-1 break-all ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </div>
            )}
          </div>
        )}

        {layout === "restaurant" && (
          <div style={{ width: theme.width }}>
            <div className="text-center">
              <div className={`text-base font-extrabold ${theme.title}`}>{title}</div>
              <div className={`text-[11px] tracking-[0.3em] mt-0.5 ${theme.muted}`}>
                RESTAURANT ORDER
              </div>
            </div>
            <div
              className={`flex justify-between text-xs mt-3 pb-2 border-b-4 ${theme.border} ${theme.text}`}
            >
              <div className="text-left space-y-0.5">
                <div>订单编号 {orderId}</div>
                <div className={theme.muted}>下单日期 {orderDate}</div>
                <div className={theme.muted}>截稿日期 {deadline}</div>
              </div>
              <span className="text-right">平台 {platform}</span>
            </div>
            <div className="mt-2">
              {itemLines.map((item) => (
                <div
                  key={item.id}
                  className={`flex justify-between items-start py-1.5 border-b border-dashed ${theme.border} ${theme.text}`}
                >
                  <div className="flex items-start gap-1.5">
                    <span className="mt-0.5">✓</span>
                    <span>
                      {displayItemName(item)}
                      {item.usageRate !== 0 && (
                        <span className={`ml-1 text-[11px] px-1 py-0.5 rounded ${theme.badge}`}>
                          {item.usage}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    {item.itemDiscount > 0 ? (
                      <>
                        <div className="font-medium">{formatMoney(item.adjusted)}</div>
                        <div className={`text-[11px] line-through ${theme.muted}`}>
                          {formatMoney(item.beforeItemDiscount)}
                        </div>
                      </>
                    ) : (
                      <div className="font-medium">
                        {formatMoney(item.beforeItemDiscount)}
                      </div>
                    )}
                    <div className={`text-[11px] ${theme.muted}`}>
                      {formatMoney(item.price)} × {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(urgentFee > 0 || publicFee > 0 || extraFee > 0) && (
              <div
                className={`mt-2 pt-2 border-t border-dashed ${theme.border} ${theme.text} text-xs space-y-0.5`}
              >
                {urgentFee > 0 && (
                  <div className="flex justify-between">
                    <span>加急费</span>
                    <span>{formatMoney(urgentFee)}</span>
                  </div>
                )}
                {publicFee > 0 && (
                  <div className="flex justify-between">
                    <span>不公开费</span>
                    <span>{formatMoney(publicFee)}</span>
                  </div>
                )}
                {extraFee > 0 && (
                  <div className="flex justify-between">
                    <span>{order.extraFeeName || "其他费用"}</span>
                    <span>{formatMoney(extraFee)}</span>
                  </div>
                )}
              </div>
            )}
            <div
              className={`flex justify-between items-center mt-3 pt-2 border-t-4 ${theme.border} ${theme.text}`}
            >
              <span className="text-xs font-semibold">优惠前应付</span>
              <span className="text-xs font-semibold">{formatMoney(beforeDiscount)}</span>
            </div>
            <div className={`mt-1 text-right text-xs space-y-0.5 ${theme.muted}`}>
              <div className="flex justify-end gap-4">
                <span>手续费</span>
                <span className="w-20 text-right">{formatMoney(fee)}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span>优惠</span>
                <span className="w-20 text-right">-{formatMoney(discountTotal)}</span>
              </div>
            </div>
            <div
              className={`flex justify-between items-center mt-2 pt-2 border-t-2 ${theme.border} ${theme.text}`}
            >
              <span className="text-base font-bold">优惠后金额</span>
              <span className="text-base font-bold">{formatMoney(payable)}</span>
            </div>
            <div className={`text-right mt-1 ${theme.amount}`}>
              <span className="text-base font-extrabold">实付 {formatMoney(paid)}</span>
            </div>
            <div className={`mt-1 text-right text-xs ${theme.muted}`}>
              定金 {formatMoney(deposit)} / 尾款 {formatMoney(balance)}
            </div>
            {(order.receiptNote ?? "").trim() && (
              <div className={`mt-3 text-center text-xs ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </div>
            )}
          </div>
        )}

        {layout === "invoice" && (
          <div style={{ width: theme.width }}>
            <div
              className={`flex justify-between items-end border-b-2 pb-3 mb-3 ${theme.border}`}
            >
              <div>
                <div className={`text-base font-bold ${theme.title}`}>报价单</div>
                <div className={`text-[11px] tracking-[0.2em] ${theme.muted}`}>QUOTATION</div>
              </div>
              <div className={`text-right text-xs ${theme.text} space-y-0.5`}>
                <div>订单编号 {orderId}</div>
                <div className={theme.muted}>下单日期 {orderDate}</div>
                <div className={theme.muted}>截稿日期 {deadline}</div>
              </div>
            </div>
            <table className={`w-full text-xs ${theme.text}`}>
              <thead>
                <tr className={`border ${theme.border}`}>
                  <th
                    className={`border ${theme.border} px-2 py-1.5 text-left font-semibold`}
                  >
                    项目
                  </th>
                  <th
                    className={`border ${theme.border} px-2 py-1.5 text-right font-semibold`}
                  >
                    单价
                  </th>
                  <th
                    className={`border ${theme.border} px-2 py-1.5 text-right font-semibold`}
                  >
                    数量
                  </th>
                  <th
                    className={`border ${theme.border} px-2 py-1.5 text-right font-semibold`}
                  >
                    小计
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemLines.map((item) => (
                  <tr key={item.id} className={`border ${theme.border}`}>
                    <td className={`border ${theme.border} px-2 py-1.5`}>
                      {displayItemName(item)}
                      {item.usageRate !== 0 && (
                        <span className={`ml-1 text-[11px] px-1 py-0.5 rounded ${theme.badge}`}>
                          {item.usage}
                        </span>
                      )}
                    </td>
                    <td className={`border ${theme.border} px-2 py-1.5 text-right`}>
                      {formatMoney(item.price)}
                    </td>
                    <td className={`border ${theme.border} px-2 py-1.5 text-right`}>
                      {item.quantity}
                    </td>
                    <td className={`border ${theme.border} px-2 py-1.5 text-right font-medium`}>
                      {item.itemDiscount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{formatMoney(item.adjusted)}</span>
                          <span className={`text-[11px] line-through ${theme.muted}`}>
                            {formatMoney(item.beforeItemDiscount)}
                          </span>
                        </div>
                      ) : (
                        formatMoney(item.beforeItemDiscount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={`mt-3 text-xs ${theme.text}`}>
              {(urgentFee > 0 || publicFee > 0 || extraFee > 0) && (
                <div className="space-y-0.5 mb-2">
                  {urgentFee > 0 && (
                    <div className="flex justify-between">
                      <span className={theme.muted}>加急费</span>
                      <span>{formatMoney(urgentFee)}</span>
                    </div>
                  )}
                  {publicFee > 0 && (
                    <div className="flex justify-between">
                      <span className={theme.muted}>不公开费</span>
                      <span>{formatMoney(publicFee)}</span>
                    </div>
                  )}
                  {extraFee > 0 && (
                    <div className="flex justify-between">
                      <span className={theme.muted}>{order.extraFeeName || "其他费用"}</span>
                      <span>{formatMoney(extraFee)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between border-t pt-1">
                <span className={theme.muted}>优惠前应付</span>
                <span className="font-semibold">{formatMoney(beforeDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.muted}>手续费</span>
                <span>{formatMoney(fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.muted}>优惠金额</span>
                <span>-{formatMoney(discountTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.muted}>优惠后金额</span>
                <span className="font-semibold">{formatMoney(payable)}</span>
              </div>
              <div
                className={`flex justify-between border-t-2 pt-1 mt-1 ${theme.border}`}
              >
                <span className={theme.muted}>实付金额</span>
                <span className={`font-bold ${theme.amount}`}>{formatMoney(paid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={theme.muted}>定金</span>
                <span>{formatMoney(deposit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={theme.muted}>尾款</span>
                <span>{formatMoney(balance)}</span>
              </div>
            </div>
            {(order.receiptNote ?? "").trim() && (
              <div className={`mt-3 text-center text-xs ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </div>
            )}
          </div>
        )}

        {layout === "waybill" && (
          <div className="font-mono text-xs" style={{ width: theme.width }}>
            <div
              className={`text-center text-base font-bold tracking-[0.4em] border-b-2 ${theme.border} pb-1`}
            >
              快 递 面 单
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`border border-dashed ${theme.border} p-1.5`}>
                <div className={`text-[11px] ${theme.muted}`}>企划 / 收件</div>
                <div className={`font-bold truncate ${theme.text}`}>{title}</div>
              </div>
              <div className={`border border-dashed ${theme.border} p-1.5`}>
                <div className={`text-[11px] ${theme.muted}`}>订单编号</div>
                <div className={`font-bold truncate ${theme.text}`}>{orderId}</div>
              </div>
              <div className={`border border-dashed ${theme.border} p-1.5`}>
                <div className={`text-[11px] ${theme.muted}`}>下单日期</div>
                <div className={theme.text}>{orderDate}</div>
              </div>
              <div className={`border border-dashed ${theme.border} p-1.5`}>
                <div className={`text-[11px] ${theme.muted}`}>截稿日期</div>
                <div className={theme.text}>{deadline}</div>
              </div>
            </div>
            <div className={`mt-3 text-xs font-bold ${theme.muted}`}>制品清单</div>
            <div className={`mt-1 space-y-1 ${theme.text}`}>
              {itemLines.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 border-b border-dashed ${theme.border} pb-1`}
                >
                  <span
                    className={`w-3.5 h-3.5 border ${theme.border} inline-block shrink-0`}
                  />
                  <span className="truncate flex-1">
                    {displayItemName(item)}
                    {item.usageRate !== 0 && (
                      <span className={`ml-1 text-[11px] ${theme.muted}`}>[{item.usage}]</span>
                    )}
                  </span>
                  <span className="shrink-0">
                    {item.itemDiscount > 0 ? (
                      <span className="flex flex-col items-end">
                        <span>{formatMoney(item.adjusted)}</span>
                        <span className={`text-[11px] line-through ${theme.muted}`}>
                          {formatMoney(item.beforeItemDiscount)}
                        </span>
                      </span>
                    ) : (
                      formatMoney(item.beforeItemDiscount)
                    )}
                  </span>
                </div>
              ))}
            </div>
            {(urgentFee > 0 || publicFee > 0 || extraFee > 0) && (
              <div className={`mt-2 text-xs space-y-0.5 ${theme.text}`}>
                {urgentFee > 0 && (
                  <div className="flex justify-between">
                    <span className={theme.muted}>加急费</span>
                    <span>{formatMoney(urgentFee)}</span>
                  </div>
                )}
                {publicFee > 0 && (
                  <div className="flex justify-between">
                    <span className={theme.muted}>不公开费</span>
                    <span>{formatMoney(publicFee)}</span>
                  </div>
                )}
                {extraFee > 0 && (
                  <div className="flex justify-between">
                    <span className={theme.muted}>{order.extraFeeName || "其他费用"}</span>
                    <span>{formatMoney(extraFee)}</span>
                  </div>
                )}
              </div>
            )}
            <div
              className={`flex justify-between mt-2 pt-2 border-t-2 ${theme.border} ${theme.text}`}
            >
              <span className="font-semibold">优惠前应付</span>
              <span className="font-semibold">{formatMoney(beforeDiscount)}</span>
            </div>
            <div className={`flex justify-between text-xs ${theme.muted}`}>
              <span>手续费 {formatMoney(fee)}</span>
              <span>优惠 -{formatMoney(discountTotal)}</span>
            </div>
            <div
              className={`flex justify-between mt-1 pt-1 border-t ${theme.border} ${theme.text}`}
            >
              <span className="font-bold">优惠后金额</span>
              <span className="font-bold">{formatMoney(payable)}</span>
            </div>
            <div className={`text-right text-base font-bold ${theme.amount}`}>
              实付 {formatMoney(paid)}
            </div>
            <div className={`flex justify-between text-xs ${theme.muted}`}>
              <span>定金 {formatMoney(deposit)}</span>
              <span>尾款 {formatMoney(balance)}</span>
            </div>
            <div className="mt-3 flex justify-center gap-[2px] h-8 items-stretch">
              {Array.from({ length: 42 }).map((_, i) => (
                <span
                  key={i}
                  className={i % 3 === 0 ? "w-[3px] bg-black/70" : "w-[1px] bg-black/40"}
                />
              ))}
            </div>
            {(order.receiptNote ?? "").trim() && (
              <div className={`mt-2 text-center text-[11px] ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </div>
            )}
          </div>
        )}

        {layout === "journal" && (
          <div
            style={{
              fontFamily: "'Comic Sans MS', 'Segoe Print', cursive",
              width: theme.width,
            }}
          >
            <div className={`text-center text-base font-bold ${theme.title}`}>
              ✿ {title} ✿
            </div>
            <div className={`text-center text-xs ${theme.muted}`}>~ 约稿清单 ~</div>
            <div className={`mt-2 text-xs space-y-0.5 ${theme.text}`}>
              <div className="flex justify-between">
                <span>订单编号：</span>
                <span>{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>下单日期：</span>
                <span>{orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span>截稿日期：</span>
                <span>{deadline}</span>
              </div>
            </div>
            <div className={`mt-3 space-y-1.5 ${theme.text}`}>
              {itemLines.map((item) => (
                <div key={item.id} className="flex items-baseline gap-2">
                  <span>☐</span>
                  <span className={`flex-1 border-b border-dotted ${theme.border}`}>
                    {displayItemName(item)}
                  </span>
                  <span className="font-medium">
                    {item.itemDiscount > 0 ? (
                      <span className="flex flex-col items-end">
                        <span>{formatMoney(item.adjusted)}</span>
                        <span className={`text-[11px] line-through ${theme.muted}`}>
                          {formatMoney(item.beforeItemDiscount)}
                        </span>
                      </span>
                    ) : (
                      formatMoney(item.beforeItemDiscount)
                    )}
                  </span>
                </div>
              ))}
            </div>
            {(urgentFee > 0 || publicFee > 0 || extraFee > 0) && (
              <div className={`mt-2 text-xs space-y-0.5 ${theme.text}`}>
                {urgentFee > 0 && (
                  <div className="flex justify-between">
                    <span>✦ 加急费</span>
                    <span>{formatMoney(urgentFee)}</span>
                  </div>
                )}
                {publicFee > 0 && (
                  <div className="flex justify-between">
                    <span>✦ 不公开费</span>
                    <span>{formatMoney(publicFee)}</span>
                  </div>
                )}
                {extraFee > 0 && (
                  <div className="flex justify-between">
                    <span>✦ {order.extraFeeName || "其他费用"}</span>
                    <span>{formatMoney(extraFee)}</span>
                  </div>
                )}
              </div>
            )}
            <div
              className={`mt-3 pt-2 border-t-2 border-dashed ${theme.border} ${theme.text}`}
            >
              <div className="flex justify-between">
                <span>优惠前应付</span>
                <span className="font-semibold">{formatMoney(beforeDiscount)}</span>
              </div>
              <div className={`flex justify-between text-xs ${theme.muted}`}>
                <span>
                  手续费 {formatMoney(fee)} / 优惠 -{formatMoney(discountTotal)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>优惠后金额</span>
                <span className="font-semibold">{formatMoney(payable)}</span>
              </div>
            </div>
            <div className={`text-right mt-2 ${theme.amount}`}>
              <span className="text-base font-extrabold">★ 实付 {formatMoney(paid)}</span>
            </div>
            <div className={`text-right text-xs ${theme.muted}`}>
              定金 {formatMoney(deposit)} / 尾款 {formatMoney(balance)}
            </div>
            {(order.receiptNote ?? "").trim() && (
              <div className={`mt-3 text-center text-xs italic ${theme.muted}`}>
                "{order.receiptNote?.trim()}"
              </div>
            )}
          </div>
        )}

        {layout === "fruit" && (
          <div className="text-xs" style={{ width: theme.width }}>
            <div className="text-center mb-3">
              <div className={`text-base font-bold ${theme.title}`}>{title}</div>
              <div className={`mt-2 text-xs space-y-0.5 ${theme.text}`}>
                <div className="flex justify-between">
                  <span className={theme.muted}>订单编号：</span>
                  <span>{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.muted}>下单日期：</span>
                  <span>{orderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.muted}>截稿日期：</span>
                  <span>{deadline}</span>
                </div>
              </div>
            </div>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <table className="w-full text-xs">
              <thead>
                <tr className={theme.text}>
                  <th className="text-left py-1 font-normal">商品</th>
                  <th className="text-center py-1 font-normal w-10">数量</th>
                  <th className="text-right py-1 font-normal w-16">单价</th>
                  <th className="text-right py-1 font-normal w-16">小计</th>
                </tr>
              </thead>
              <tbody>
                {itemLines.map((item) => (
                  <tr key={item.id} className={theme.text}>
                    <td className="py-1 align-top">
                      {displayItemName(item)}
                      {item.usageRate !== 0 && (
                        <span className={`ml-1 text-[10px] ${theme.muted}`}>
                          [{item.usage}]
                        </span>
                      )}
                    </td>
                    <td className="py-1 text-center align-top">{item.quantity}</td>
                    <td className="py-1 text-right align-top">{formatMoney(item.price)}</td>
                    <td className="py-1 text-right align-top font-medium">
                      {item.itemDiscount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{formatMoney(item.adjusted)}</span>
                          <span className={`text-[10px] line-through ${theme.muted}`}>
                            {formatMoney(item.beforeItemDiscount)}
                          </span>
                        </div>
                      ) : (
                        formatMoney(item.beforeItemDiscount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <div className={`flex justify-between items-center py-1 ${theme.text}`}>
              <span className="text-xs font-semibold">优惠前应付</span>
              <span className="text-xs font-semibold">{formatMoney(beforeDiscount)}</span>
            </div>
            <div className={`text-xs space-y-0.5 ${theme.muted}`}>
              <div className="flex justify-between">
                <span>支付方式</span>
                <span>{order.paymentMethod || "未选择"}</span>
              </div>
              {(urgentFee > 0 || publicFee > 0 || extraFee > 0 || fee > 0 || discountTotal > 0) && (
                <>
                  {urgentFee > 0 && (
                    <div className="flex justify-between">
                      <span>加急费</span>
                      <span>{formatMoney(urgentFee)}</span>
                    </div>
                  )}
                  {publicFee > 0 && (
                    <div className="flex justify-between">
                      <span>不公开费</span>
                      <span>{formatMoney(publicFee)}</span>
                    </div>
                  )}
                  {extraFee > 0 && (
                    <div className="flex justify-between">
                      <span>{order.extraFeeName || "其他费用"}</span>
                      <span>{formatMoney(extraFee)}</span>
                    </div>
                  )}
                  {fee > 0 && (
                    <div className="flex justify-between">
                      <span>手续费</span>
                      <span>{formatMoney(fee)}</span>
                    </div>
                  )}
                  {discountTotal > 0 && (
                    <div className="flex justify-between">
                      <span>优惠金额</span>
                      <span>-{formatMoney(discountTotal)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={`border-t-2 ${theme.border} my-2`} />
            <div className={`flex justify-between items-center ${theme.text}`}>
              <span className="text-xs font-semibold">优惠后金额</span>
              <span className="text-xs font-semibold">{formatMoney(payable)}</span>
            </div>
              <div className={`flex justify-between items-center ${theme.text}`}>
                <span className="text-xs font-bold">实付</span>
                <span className={`text-base font-bold ${theme.amount}`}>{formatMoney(paid)}</span>
              </div>
            <div className={`flex justify-between text-xs ${theme.muted}`}>
              <span>定金 {formatMoney(deposit)}</span>
              <span>尾款 {formatMoney(balance)}</span>
            </div>
            <div className={`border-t border-dashed ${theme.border} my-2`} />
            <div className="text-center">
              <div className={`text-xs font-bold ${theme.title}`}>✦ 感谢光临 ✦</div>
              <div className={`text-[11px] mt-0.5 ${theme.muted}`}>电子小票 · 凭此退换</div>
            </div>
            {(order.receiptNote ?? "").trim() && (
              <div className={`mt-2 text-center text-[11px] ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </div>
            )}
          </div>
        )}

        {(layout === "classic" || !layout) && (
          <div style={{ width: theme.width }}>
            <div className="text-center mb-4">
              <h2 className={`text-base font-bold mb-1 ${theme.title}`}>{title}</h2>
              <p className={`text-xs ${theme.muted}`}>报价单</p>
            </div>

            <div className={`text-xs ${theme.text} space-y-1 mb-3`}>
              <div className="flex justify-between">
                <span className={`${theme.muted}`}>订单编号：</span>
                <span>{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${theme.muted}`}>下单日期：</span>
                <span>{orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${theme.muted}`}>截稿日期：</span>
                <span>{deadline}</span>
              </div>
            </div>

            <div className={`border-t-2 border-b-2 ${theme.border} py-0.5 mb-3`} />

            <table className="w-full text-xs mb-3">
              <thead>
                <tr className={`border-b ${theme.border} ${theme.text}`}>
                  <th className="text-left py-1.5 font-semibold">制品</th>
                  <th className="text-right py-1.5 font-semibold">单价</th>
                  <th className="text-right py-1.5 font-semibold">数量</th>
                  <th className="text-right py-1.5 font-semibold">小计</th>
                </tr>
              </thead>
              <tbody>
                {itemLines.map((item) => (
                  <tr key={item.id} className={theme.text}>
                    <td className="py-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${theme.dot}`} />
                      <span>{displayItemName(item)}</span>
                      {item.usageRate !== 0 && (
                        <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded ${theme.badge}`}>
                          {item.usage}
                        </span>
                      )}
                    </td>
                    <td className="text-right py-1.5">{formatMoney(item.price)}</td>
                    <td className="text-right py-1.5">{item.quantity}</td>
                    <td className="text-right py-1.5">
                      {item.itemDiscount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{formatMoney(item.adjusted)}</span>
                          <span className={`text-[11px] line-through ${theme.muted}`}>
                            {formatMoney(item.beforeItemDiscount)}
                          </span>
                        </div>
                      ) : (
                        formatMoney(item.beforeItemDiscount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={`border-t ${theme.border} pt-3 mb-3`}>
              <h4 className={`text-xs font-semibold text-right mb-2 ${theme.text}`}>附加费</h4>
              <div className={`text-xs space-y-1 ${theme.text}`}>
                <div className="flex justify-end gap-6">
                  <span className={theme.muted}>加急费：</span>
                  <span className="w-24 text-right">{formatMoney(urgentFee)}</span>
                </div>
                <div className="flex justify-end gap-6">
                  <span className={theme.muted}>不公开费：</span>
                  <span className="w-24 text-right">{formatMoney(publicFee)}</span>
                </div>
                {extraFee > 0 && (
                  <div className="flex justify-end gap-6">
                    <span className={theme.muted}>{order.extraFeeName || "其他费用"}：</span>
                    <span className="w-24 text-right">{formatMoney(extraFee)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`border-t-2 border-b-2 ${theme.border} py-0.5 mb-3`} />

            <div className="space-y-3">
              <div className="text-right">
                <div className={`text-xs font-semibold mb-1 ${theme.text}`}>
                  优惠前应付：{formatMoney(beforeDiscount)}
                </div>
                <div className={`text-xs space-y-1 ${theme.muted}`}>
                  <div className="flex justify-end gap-6">
                    <span>手续费：</span>
                    <span className="w-24 text-right">{formatMoney(fee)}</span>
                  </div>
                  <div className="flex justify-end gap-6">
                    <span>优惠金额：</span>
                    <span className="w-24 text-right">-{formatMoney(discountTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-xs font-semibold mb-1 ${theme.text}`}>
                  优惠后金额：{formatMoney(payable)}
                </div>
                <div className={`text-base font-bold mb-2 ${theme.amount}`}>
                  实付金额 {formatMoney(paid)}
                </div>
                <div className={`text-xs space-y-1 ${theme.muted}`}>
                  <div className="flex justify-end gap-6">
                    <span>定金：</span>
                    <span className="w-24 text-right">{formatMoney(deposit)}</span>
                  </div>
                  <div className="flex justify-end gap-6">
                    <span>尾款：</span>
                    <span className="w-24 text-right">{formatMoney(balance)}</span>
                  </div>
                </div>
              </div>
            </div>

            {(order.receiptNote ?? "").trim() && (
              <p className={`mt-4 text-center text-xs ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </p>
            )}
          </div>
        )}

        {layout === "minimal" && (
          <div
            className={`font-mono text-xs ${theme.text}`}
            style={{ width: theme.width }}
          >
            <div
              className={`text-center text-base font-bold tracking-widest mb-3 ${theme.title}`}
            >
              {title}
            </div>
            <div className={`space-y-1 text-xs ${theme.muted}`}>
              <div className="flex justify-between">
                <span>订单编号：</span>
                <span>{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>下单日期：</span>
                <span>{orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span>截稿日期：</span>
                <span>{deadline}</span>
              </div>
            </div>
            <div className={`border-t ${theme.border} my-3`} />
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${theme.border}`}>
                  <th className="text-left py-1.5 font-normal">稿件</th>
                  <th className="text-right py-1.5 font-normal">单价</th>
                  <th className="text-right py-1.5 font-normal">数量</th>
                  <th className="text-right py-1.5 font-normal">小计</th>
                </tr>
              </thead>
              <tbody>
                {itemLines.map((item, idx) => (
                  <tr key={item.id} className={theme.text}>
                    <td className="py-1.5">
                      {idx + 1}. {displayItemName(item)}
                      {item.usageRate !== 0 && (
                        <span className={`ml-1 text-[10px] ${theme.muted}`}>({item.usage})</span>
                      )}
                    </td>
                    <td className="text-right py-1.5">{formatMoney(item.price)}</td>
                    <td className="text-right py-1.5">{item.quantity}件</td>
                    <td className="text-right py-1.5">
                      {item.itemDiscount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span>{formatMoney(item.adjusted)}</span>
                          <span className={`text-[11px] line-through ${theme.muted}`}>
                            {formatMoney(item.beforeItemDiscount)}
                          </span>
                        </div>
                      ) : (
                        formatMoney(item.beforeItemDiscount)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={`border-t border-dashed ${theme.border} my-3`} />
            <div className={`border-t ${theme.border} my-3`} />
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium">实付金额</span>
                <span className={`text-base font-bold ${theme.amount}`}>{formatMoney(paid)}</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className={theme.muted}>需付定金（{order.manualDepositRate ?? 50}%）</span>
                <span>{formatMoney(deposit)}</span>
              </div>
            </div>
            <div className={`border-t ${theme.border} my-3`} />
            <div className={`border-t-2 border-b-2 ${theme.border} py-1 mb-3`} />
            <div className={`text-center text-xs ${theme.muted}`}>
              <div>温馨提示</div>
              <div>感谢惠顾</div>
            </div>
            {(order.receiptNote ?? "").trim() && (
              <p className={`mt-3 text-center text-xs ${theme.muted}`}>
                {order.receiptNote?.trim()}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

OrderReceipt.displayName = "OrderReceipt";
