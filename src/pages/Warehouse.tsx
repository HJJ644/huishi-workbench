import { useState } from "react";
import { Plus, Trash2, X, GripVertical, LayoutGrid, List, ChevronUp, ChevronDown } from "lucide-react";
import { Header } from "../components/Header";
import { Modal } from "../components/Modal";
import { useApp } from "../store/AppContext";
import type { Product, ProductVariant } from "../types";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

const emptyProduct: Product = {
  id: "",
  name: "",
  unit: "",
  price: 0,
  defaultUsage: "",
  surcharges: [],
  variants: [],
};

type ViewMode = "grid" | "list";

export function Warehouse() {
  const { products, feeGroups, dispatch, showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product>(emptyProduct);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const usageItems = feeGroups.find((g) => g.title === "用途")?.items ?? [];

  function openAdd() {
    setEditing({ ...emptyProduct, id: generateId() });
    setModalOpen(true);
  }

  function saveProduct() {
    if (!editing.name.trim()) return;
    const exists = products.some((p) => p.id === editing.id);
    if (exists) {
      dispatch({ type: "UPDATE_PRODUCT", payload: editing });
    } else {
      dispatch({ type: "ADD_PRODUCT", payload: editing });
    }
    showToast("保存成功");
    setModalOpen(false);
    setEditing(emptyProduct);
  }

  function addSurcharge() {
    const item = usageItems[0];
    if (!item) return;
    setEditing({
      ...editing,
      surcharges: [
        ...editing.surcharges,
        {
          id: generateId(),
          name: item.name,
          rate: item.rate,
          feeItemId: item.id,
        },
      ],
    });
  }

  function selectSurcharge(surchargeId: string, feeItemId: string) {
    const item = usageItems.find((u) => u.id === feeItemId);
    if (!item) return;
    setEditing({
      ...editing,
      surcharges: editing.surcharges.map((s) =>
        s.id === surchargeId
          ? { ...s, name: item.name, rate: item.rate, feeItemId: item.id }
          : s
      ),
    });
  }

  function removeSurcharge(id: string) {
    setEditing({
      ...editing,
      surcharges: editing.surcharges.filter((s) => s.id !== id),
    });
  }

  function addVariant() {
    setEditing({
      ...editing,
      variants: [
        ...editing.variants,
        { id: generateId(), name: "", price: 0 },
      ],
    });
  }

  function updateVariant(
    id: string,
    field: keyof ProductVariant,
    value: string | number
  ) {
    setEditing({
      ...editing,
      variants: editing.variants.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    });
  }

  function removeVariant(id: string) {
    setEditing({
      ...editing,
      variants: editing.variants.filter((v) => v.id !== id),
    });
  }

  function moveProduct(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    dispatch({ type: "SET_PRODUCTS", payload: next });
    showToast("位置已调整");
  }

  return (
    <div>
      <Header title="仓库" subtitle="制品库与价目管理" />

      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-text">制品库</h3>
            <p className="text-sm text-text-secondary mt-1">
              管理你的约稿制品、单价和附加费用模板
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                viewMode === "grid"
                  ? "bg-tag text-white"
                  : "bg-bg text-text-secondary border border-border hover:bg-bg/80"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              网格
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                viewMode === "list"
                  ? "bg-tag text-white"
                  : "bg-bg text-text-secondary border border-border hover:bg-bg/80"
              }`}
            >
              <List className="w-4 h-4" />
              列表
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="rounded-xl border border-border p-5 hover:shadow-sm transition group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-text">
                      {product.name}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">{product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition sm:opacity-100">
                    <button
                      onClick={() => moveProduct(index, "up")}
                      disabled={index === 0}
                      className="p-1.5 text-text-muted hover:text-text disabled:opacity-30 rounded-md hover:bg-bg"
                      title="上移"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveProduct(index, "down")}
                      disabled={index === products.length - 1}
                      className="p-1.5 text-text-muted hover:text-text disabled:opacity-30 rounded-md hover:bg-bg"
                      title="下移"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-xl font-semibold text-text">
                  ¥{product.price.toFixed(2)}
                  <span className="text-sm font-normal text-text-secondary">
                    {" "}
                    / {product.unit}
                  </span>
                </div>
                {product.surcharges.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.surcharges.map((s) => (
                      <span
                        key={s.id}
                        className="text-xs px-2 py-1 rounded-md bg-bg text-text-secondary"
                      >
                        {s.name} {s.rate > 0 ? `+${s.rate}%` : ""}
                      </span>
                    ))}
                  </div>
                )}
                {product.variants.length > 0 && (
                  <div className="mt-3 text-xs text-text-secondary">
                    {product.variants.map((v) => v.name).join(" / ")}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(product);
                      setModalOpen(true);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-tag text-white text-xs hover:opacity-90 transition"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() =>
                      dispatch({ type: "DELETE_PRODUCT", payload: product.id })
                    }
                    className="px-3 py-2 rounded-lg text-danger text-xs hover:bg-red-50 transition"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border mb-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-bg text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium w-10"></th>
                  <th className="px-4 py-3 font-medium">制品名称</th>
                  <th className="px-4 py-3 font-medium">单位</th>
                  <th className="px-4 py-3 font-medium">单价</th>
                  <th className="px-4 py-3 font-medium">用途费</th>
                  <th className="px-4 py-3 font-medium">变体</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className="border-t border-border hover:bg-bg/50 transition"
                  >
                    <td className="px-4 py-3">
                      <GripVertical className="w-4 h-4 text-text-muted" />
                    </td>
                    <td className="px-4 py-3 font-medium text-text">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {product.unit}
                    </td>
                    <td className="px-4 py-3 text-text">
                      ¥{product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {product.surcharges.length > 0
                        ? product.surcharges
                            .map((s) => `${s.name}${s.rate > 0 ? ` +${s.rate}%` : ""}`)
                            .join("、")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {product.variants.length > 0
                        ? product.variants.map((v) => v.name).join(" / ")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => moveProduct(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 text-text-muted hover:text-text disabled:opacity-30 rounded-md hover:bg-bg"
                          title="上移"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveProduct(index, "down")}
                          disabled={index === products.length - 1}
                          className="p-1.5 text-text-muted hover:text-text disabled:opacity-30 rounded-md hover:bg-bg"
                          title="下移"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditing(product);
                            setModalOpen(true);
                          }}
                          className="ml-2 px-3 py-1.5 rounded-md bg-tag text-white text-xs hover:opacity-90 transition"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() =>
                            dispatch({ type: "DELETE_PRODUCT", payload: product.id })
                          }
                          className="px-3 py-1.5 rounded-md text-danger text-xs hover:bg-red-50 transition"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                      暂无制品，点击下方添加
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-text-muted text-text-secondary hover:bg-bg transition"
        >
          <Plus className="w-4 h-4" />
          添加制品
        </button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="添加制品"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2 rounded-lg border border-border text-sm text-text hover:bg-bg"
            >
              取消
            </button>
            <button
              onClick={saveProduct}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm hover:opacity-90"
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-text mb-1.5">
              制品名称 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="如：全身立绘、Q版头像、章节页"
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text mb-1.5">单位</label>
              <input
                type="text"
                placeholder="张"
                value={editing.unit}
                onChange={(e) =>
                  setEditing({ ...editing, unit: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-text mb-1.5">单价 (¥)</label>
              <input
                type="number"
                value={editing.price}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    price: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:border-accent"
              />
              <p className="text-xs text-text-muted mt-1">
                有变体时此项为默认/参考价
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-text mb-2">
              用途费（与费用设置同步）
            </label>
            {usageItems.length === 0 ? (
              <p className="text-xs text-text-muted">
                请先在费用设置中添加「用途」费率。
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {editing.surcharges.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <select
                        value={s.feeItemId || s.name}
                        onChange={(e) =>
                          selectSurcharge(s.id, e.target.value)
                        }
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:border-accent"
                      >
                        <option value="">请选择用途费</option>
                        {usageItems.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}（{u.rate}%）
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-text-secondary w-12 text-right">
                        {s.rate}%
                      </span>
                      <button
                        onClick={() => removeSurcharge(s.id)}
                        className="p-2 text-text-muted hover:text-danger rounded-md hover:bg-red-50 transition"
                        title="删除该用途费"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addSurcharge}
                  disabled={usageItems.length === 0}
                  className="mt-2 flex items-center gap-1 text-sm text-accent hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> 添加用途费
                </button>
              </>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-text">变体 / 子集</span>
              <span className="text-xs text-text-muted">
                可选，用于同制品不同规格不同定价（如：基础/同模、黑白/彩色）
              </span>
            </div>
            <div className="space-y-2">
              {editing.variants.map((v) => (
                <div key={v.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="变体名称"
                    value={v.name}
                    onChange={(e) =>
                      updateVariant(v.id, "name", e.target.value)
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:border-accent"
                  />
                  <input
                    type="number"
                    placeholder="价格"
                    value={v.price}
                    onChange={(e) =>
                      updateVariant(v.id, "price", Number(e.target.value))
                    }
                    className="w-28 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:border-accent"
                  />
                  <button
                    onClick={() => removeVariant(v.id)}
                    className="p-2 text-text-muted hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addVariant}
              className="mt-2 flex items-center gap-1 text-sm text-accent hover:opacity-80"
            >
              <Plus className="w-4 h-4" /> 添加变体
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
