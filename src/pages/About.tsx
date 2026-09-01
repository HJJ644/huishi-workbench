import { useState } from "react";
import { FileText, Package, Settings, Cloud, Shield, MessageSquare } from "lucide-react";
import { Header } from "../components/Header";

const instructions = [
  {
    icon: FileText,
    title: "订单管理",
    items: [
      "点击订单页面的「+ 新建订单」按钮创建新约稿",
      "制品名称从仓库下拉选择，选中后自动带出单价；有变体的制品会显示二级规格选择",
      "支持添加多行制品、优惠项、其他费用（如邮费/材料费）",
      "表单右侧实时预览报价单小票，所见即所得",
      "点击「下载图片」可生成 PNG 报价单小票",
    ],
  },
  {
    icon: Package,
    title: "仓库管理",
    items: [
      "在仓库中维护你的制品价目表（名称、单位、单价）",
      "每个制品可添加用途费（如自用/商用，自定义名称和费率）",
      "支持为制品添加变体规格（如章节页 → 基础/同模，不同价格）",
      "新建订单时可直接选用仓库制品，无需重复输入价格",
    ],
  },
  {
    icon: Settings,
    title: "设置",
    items: [
      "手续费：配置各支付方式的手续费率，订单中选择支付方式后自动带入",
      "用途 / 加急 / 公开：自定义选项名称和对应费率",
      "所有设置项均支持增删改，修改后点击保存即可生效",
    ],
  },
  {
    icon: Cloud,
    title: "云同步",
    items: [
      "在「设置 - 云同步」填写 Supabase 项目地址与密钥（免费，需在 Supabase SQL Editor 执行一次建表 SQL）",
      "使用邮箱注册 / 登录账号",
      "开启自动备份后，数据变化会自动上传到云端",
      "换设备或重装浏览器后，登录同一账号即可从云端恢复数据",
      "本地与云端都有数据时，会提示你选择以哪边为准",
    ],
  },
  {
    icon: Shield,
    title: "数据安全",
    items: [
      "默认数据存储在浏览器本地（localStorage）",
      "可使用「导出数据」功能备份为 JSON 文件",
      "建议定期导出备份，防止意外丢失",
    ],
  },
];

export function About() {
  const [feedback, setFeedback] = useState("");

  return (
    <div>
      <Header title="关于" subtitle="操作说明与意见反馈" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface rounded-2xl border border-border p-4 sm:p-6">
          <h3 className="text-base font-semibold text-text mb-5 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            操作说明
          </h3>
          <div className="space-y-5">
            {instructions.map((section) => (
              <div key={section.title} className="bg-bg rounded-xl p-4">
                <h4 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-text-secondary" />
                  {section.title}
                </h4>
                <ul className="space-y-1.5">
                  {section.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-text-secondary leading-relaxed list-disc list-inside"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface rounded-2xl border border-border p-4 sm:p-6 h-fit">
          <h3 className="text-base font-semibold text-text mb-5 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            意见反馈
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            在使用过程中遇到问题、或有功能建议？欢迎反馈！
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请描述你的问题或建议..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-text-muted focus:border-accent resize-none"
          />
          <p className="text-xs text-text-muted mt-3">
            我们会尽快查看并改进
          </p>
          <div className="flex justify-end mt-4">
            <button className="px-5 py-2 rounded-lg bg-accent text-white text-sm hover:opacity-90 transition">
              提交反馈
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
