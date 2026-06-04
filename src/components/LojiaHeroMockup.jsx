import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Nova venda", icon: ShoppingCart },
  { label: "Pedidos", icon: ShoppingBag },
  { label: "Produtos", icon: Package },
  { label: "Clientes", icon: Users },
  { label: "Estoque", icon: Boxes },
];

const metricas = [
  {
    label: "Vendas",
    value: "400",
    detail: "+12,5%",
    icon: ShoppingCart,
  },
  {
    label: "Produtos",
    value: "531",
    detail: "+8 novos",
    icon: Package,
  },
  {
    label: "Ticket médio",
    value: "R$ 142,20",
    detail: "+9,1%",
    icon: ReceiptText,
  },
  {
    label: "Lucro bruto",
    value: "R$ 31.978,65",
    detail: "+16,2%",
    icon: CircleDollarSign,
  },
];

export default function LojiaHeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[940px]">
      <style>
        {`
          @keyframes dashboardFloat {
            0%, 100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes graphDraw {
            from {
              stroke-dashoffset: 900;
            }

            to {
              stroke-dashoffset: 0;
            }
          }

          .dashboard-window {
            animation: dashboardFloat 7s ease-in-out infinite;
          }

          .dashboard-graph-line {
            stroke-dasharray: 900;
            stroke-dashoffset: 900;
            animation: graphDraw 3s ease forwards;
          }

          @media (prefers-reduced-motion: reduce) {
            .dashboard-window {
              animation: none !important;
            }

            .dashboard-graph-line {
              animation: none !important;
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>

      {/* Iluminação suave */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[75%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16A34A]/10 blur-[100px]" />

      <div className="dashboard-window overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-2 shadow-[0_35px_110px_rgba(15,23,42,0.15)] backdrop-blur-xl">
        {/* Barra superior do navegador */}
        <div className="flex items-center justify-between rounded-t-[1.5rem] border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>

          <div className="rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-bold text-slate-500">
            lojia.app/dashboard
          </div>

          <div className="w-12" />
        </div>

        <div className="grid min-h-[520px] grid-cols-[190px_1fr] overflow-hidden rounded-b-[1.5rem] bg-[#F6F8F7]">
          {/* Sidebar */}
          <aside className="relative bg-[#101816] p-5 text-white">
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-black text-[#101816]">
                L
              </div>

              <div>
                <p className="text-lg font-black leading-none">Lojia</p>
                <p className="mt-1 text-[10px] font-semibold text-white/35">
                  Gestão da loja
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.04] p-3">
              <p className="text-[9px] font-semibold text-white/35">
                Loja conectada
              </p>
              <p className="mt-1 text-xs font-black">Loja Esportiva</p>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold ${
                      item.active
                        ? "bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/15"
                        : "text-white/50"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </div>
                );
              })}
            </nav>

            <div className="absolute bottom-5 left-5 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#16A34A] text-[11px] font-black">
                G
              </div>

              <div>
                <p className="text-[11px] font-black">Giovani</p>
                <p className="text-[9px] font-semibold text-white/35">
                  Administrador
                </p>
              </div>
            </div>
          </aside>

          {/* Conteúdo do dashboard */}
          <section className="bg-[#F6F8F7] p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Visão geral
                </p>

                <h3 className="mt-1 text-3xl font-black tracking-tight text-[#0B1115]">
                  Dashboard
                </h3>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Acompanhe os resultados da sua loja.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black text-slate-500 shadow-sm">
                  Todo período
                  <ChevronDown size={12} />
                </div>

                <div className="relative grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 shadow-sm">
                  <Bell size={14} />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-2 rounded-2xl bg-[#101A3A] p-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-white/50">
                      Faturamento
                    </p>

                    <p className="mt-2 text-xl font-black">
                      R$ 56.878,95
                    </p>
                  </div>

                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[#5EEA9F]">
                    <CreditCard size={14} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[9px] font-black text-[#5EEA9F]">
                    +18,6% no período
                  </span>

                  <TrendingUp size={15} className="text-[#5EEA9F]" />
                </div>
              </div>

              {metricas.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400">
                          {item.label}
                        </p>

                        <p className="mt-2 text-sm font-black text-[#0B1115]">
                          {item.value}
                        </p>
                      </div>

                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#ECFDF5] text-[#16A34A]">
                        <Icon size={12} />
                      </div>
                    </div>

                    <p className="mt-2 text-[8px] font-black text-[#16A34A]">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Gráficos */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-[#0B1115]">
                    Evolução das vendas
                  </p>

                  <span className="text-[9px] font-bold text-slate-400">
                    Este mês
                  </span>
                </div>

                <div className="relative mt-4 h-[165px] overflow-hidden">
                  <div className="absolute inset-0 grid grid-rows-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="border-t border-slate-100" />
                    ))}
                  </div>

                  <svg
                    viewBox="0 0 500 160"
                    preserveAspectRatio="none"
                    className="relative h-full w-full"
                  >
                    <defs>
                      <linearGradient
                        id="dashboard-area-gradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#16A34A"
                          stopOpacity="0.22"
                        />
                        <stop
                          offset="100%"
                          stopColor="#16A34A"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    <path
                      d="M0 125 C35 92, 72 112, 105 82 C145 42, 182 120, 220 92 C262 55, 300 125, 342 82 C385 38, 420 104, 455 66 C475 48, 490 53, 500 36 L500 160 L0 160 Z"
                      fill="url(#dashboard-area-gradient)"
                    />

                    <path
                      className="dashboard-graph-line"
                      d="M0 125 C35 92, 72 112, 105 82 C145 42, 182 120, 220 92 C262 55, 300 125, 342 82 C385 38, 420 104, 455 66 C475 48, 490 53, 500 36"
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-black text-[#0B1115]">
                  Formas de pagamento
                </p>

                <div className="mt-5 flex justify-center">
                  <div className="relative h-24 w-24 rounded-full bg-[conic-gradient(#16A34A_0_42%,#101A3A_42%_77%,#8EE0B6_77%_92%,#E5E7EB_92%_100%)]">
                    <div className="absolute inset-5 grid place-items-center rounded-full bg-white">
                      <span className="text-[10px] font-black text-[#0B1115]">
                        400
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {[
                    ["Dinheiro", "42%", "#16A34A"],
                    ["Cartão", "35%", "#101A3A"],
                    ["PIX", "23%", "#8EE0B6"],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-[9px] font-bold text-slate-500"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {label}
                      </div>

                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cards inferiores */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[9px] font-bold text-slate-400">
                  Pedidos em aberto
                </p>

                <p className="mt-2 text-sm font-black text-[#0B1115]">
                  R$ 119,90
                </p>

                <p className="mt-1 text-[9px] font-semibold text-slate-400">
                  1 pedido pendente
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[9px] font-bold text-slate-400">
                  Produto mais vendido
                </p>

                <p className="mt-2 text-sm font-black text-[#0B1115]">
                  Nike Air Force Branco
                </p>

                <p className="mt-1 text-[9px] font-semibold text-slate-400">
                  57 vendas
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}