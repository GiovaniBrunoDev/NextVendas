import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Search,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Nova venda", icon: CircleDollarSign },
  { label: "Pedidos", icon: Package },
  { label: "Vendas", icon: ReceiptText },
  { label: "Clientes", icon: Users },
  { label: "Estoque", icon: Boxes },
  { label: "Consultar", icon: Search },
  { label: "Financeiro", icon: WalletCards },
  { label: "Relatórios", icon: BarChart3 },
];

const metricasPrincipais = [
  {
    label: "Vendas",
    value: "400",
    icon: ShoppingCart,
  },
  {
    label: "Produtos",
    value: "531",
    icon: ShoppingBag,
  },
  {
    label: "Ticket médio",
    value: "R$ 142,20",
    icon: ReceiptText,
  },
  {
    label: "Lucro bruto",
    value: "R$ 31.978,65",
    icon: BarChart3,
  },
];

const metricasSecundarias = [
  {
    label: "Clientes",
    value: "188",
    icon: Users,
  },
  {
    label: "Entregas",
    value: "R$ 2.273,98",
    icon: Truck,
  },
  {
    label: "Pedidos",
    value: "1",
    icon: Package,
  },
  {
    label: "Pagamento",
    value: "dinheiro",
    icon: CreditCard,
  },
];

const produtosMaisVendidos = [
  {
    position: "1",
    name: "Nike Air Force Branco Trad 1 linha",
    sales: "57 vendas",
  },
  {
    position: "2",
    name: "Adidas Campus Preto/Nude",
    sales: "38 vendas",
  },
  {
    position: "3",
    name: "Adidas Campus Preto/Branco Bic",
    sales: "32 vendas",
  },
];

export default function LojiaHeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[1040px]">
      <style>
        {`
          @keyframes lojiaDashboardFloat {
            0%, 100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-7px);
            }
          }

          @keyframes lojiaGraphDraw {
            from {
              stroke-dashoffset: 1500;
            }

            to {
              stroke-dashoffset: 0;
            }
          }

          .lojia-dashboard-window {
            animation: lojiaDashboardFloat 7s ease-in-out infinite;
          }

          .lojia-dashboard-line {
            stroke-dasharray: 1500;
            stroke-dashoffset: 1500;
            animation: lojiaGraphDraw 3.5s ease forwards;
          }

          @media (prefers-reduced-motion: reduce) {
            .lojia-dashboard-window {
              animation: none !important;
            }

            .lojia-dashboard-line {
              animation: none !important;
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>

      <div className="absolute left-1/2 top-1/2 -z-10 h-[80%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16A34A]/10 blur-[110px]" />

      <div className="lojia-dashboard-window overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_35px_110px_rgba(15,23,42,0.16)]">
        <div className="grid min-h-[610px] grid-cols-[190px_1fr] bg-[#F6F7F4]">
          {/* Sidebar */}
          <aside className="relative flex flex-col bg-[#0C1418] px-4 py-5 text-white">
            <div className="mb-6 flex items-center justify-center border-b border-white/10 pb-6">
              <img
                src="/lojia-logo.png"
                alt="Lojia"
                className="h-10 w-auto object-contain"
              />
            </div>

            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold transition ${
                      item.active
                        ? "bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/15"
                        : "text-white/55"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </div>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4">
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[10px] font-black">
                  G
                </div>

                <div>
                  <p className="text-[10px] font-black">Giovani</p>
                  <p className="text-[8px] font-semibold text-white/40">
                    Admin
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 px-2 text-[10px] font-bold text-white/45">
                <LogOut size={13} />
                Sair
              </div>
            </div>
          </aside>

          {/* Conteúdo */}
          <section className="overflow-hidden bg-[#F6F7F4] p-5">
            {/* Visão geral */}
            <div className="rounded-xl border border-[#E6E7E2] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-wide text-slate-500">
                    Visão geral
                  </p>

                  <h3 className="mt-1 text-xl font-black text-[#0B1115]">
                    Dashboard
                  </h3>

                  <p className="mt-1 text-[9px] font-semibold text-slate-500">
                    400 vendas analisadas em todo período.
                  </p>
                </div>

                <div className="flex items-center rounded-lg border border-[#DDD9D0] bg-[#FAF9F5] p-1">
                  {["Hoje", "Últimos 7 dias", "Este mês", "Todo período"].map(
                    (item, index) => (
                      <div
                        key={item}
                        className={`rounded-md px-3 py-2 text-[8px] font-bold ${
                          index === 3
                            ? "bg-white text-[#0B1115] shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Faturamento */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#101A20] px-4 py-4 text-white shadow-sm">
              <div>
                <p className="text-[9px] font-bold text-white/65">
                  Faturamento
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight">
                  R$ 56.878,95
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[#5EEA9F]">
                  <WalletCards size={14} />
                </div>

                <div>
                  <p className="text-[8px] font-bold text-white/55">Período</p>
                  <p className="text-[9px] font-black">Selecionado acima</p>
                </div>
              </div>
            </div>

            {/* Primeira linha de métricas */}
            <div className="mt-3 grid grid-cols-4 gap-3">
              {metricasPrincipais.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#E6E7E2] bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-500">
                          {item.label}
                        </p>

                        <p className="mt-2 text-sm font-black text-[#0B1115]">
                          {item.value}
                        </p>
                      </div>

                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#E9F7EF] text-[#0B1115]">
                        <Icon size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Segunda linha de métricas */}
            <div className="mt-3 grid grid-cols-4 gap-3">
              {metricasSecundarias.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#E6E7E2] bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-500">
                          {item.label}
                        </p>

                        <p className="mt-2 text-sm font-black text-[#0B1115]">
                          {item.value}
                        </p>
                      </div>

                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#E9F7EF] text-[#0B1115]">
                        <Icon size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gráfico */}
            <div className="mt-3 rounded-xl border border-[#E6E7E2] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-[#0B1115]">
                    Evolução das vendas
                  </p>

                  <p className="mt-1 text-[8px] font-semibold text-slate-500">
                    Todo período
                  </p>
                </div>

                <p className="text-[9px] font-black text-slate-500">
                  R$ 56.878,95
                </p>
              </div>

              <div className="relative mt-4 h-[155px]">
                <div className="absolute inset-0 grid grid-rows-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="border-t border-dashed border-slate-200"
                    />
                  ))}
                </div>

                <svg
                  viewBox="0 0 900 180"
                  preserveAspectRatio="none"
                  className="relative h-full w-full"
                >
                  <path
                    d="M0 145 L18 125 L34 151 L51 88 L67 141 L84 126 L102 122 L119 142 L136 112 L153 145 L170 92 L187 140 L204 132 L221 149 L238 116 L255 135 L272 110 L289 146 L306 140 L323 120 L340 151 L357 131 L374 112 L391 142 L408 120 L425 128 L442 145 L459 110 L476 133 L493 60 L510 120 L527 92 L544 135 L561 108 L578 144 L595 126 L612 113 L629 72 L646 125 L663 96 L680 137 L697 92 L714 126 L731 102 L748 141 L765 116 L782 75 L799 130 L816 112 L833 144 L850 122 L867 103 L884 136 L900 120"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lojia-dashboard-line"
                  />
                </svg>
              </div>
            </div>

            {/* Cards inferiores */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E6E7E2] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-[#0B1115]">
                      Pedidos em aberto
                    </p>

                    <p className="mt-1 text-[8px] font-semibold text-slate-500">
                      R$ 119,90 em pedidos pendentes.
                    </p>
                  </div>

                  <span className="rounded-full border border-[#DDD9D0] px-2 py-1 text-[8px] font-bold text-slate-500">
                    1
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-[#0B1115]">Eder</p>
                    <p className="mt-1 text-[7px] font-semibold text-slate-400">
                      07/06/2026 às 16:00
                    </p>
                  </div>

                  <p className="text-[9px] font-black text-slate-600">
                    R$ 119,90
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6E7E2] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-[#0B1115]">
                      Produtos mais vendidos
                    </p>

                    <p className="mt-1 text-[8px] font-semibold text-slate-500">
                      Todo período
                    </p>
                  </div>

                  <span className="rounded-full border border-[#DDD9D0] px-2 py-1 text-[8px] font-bold text-slate-500">
                    100
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {produtosMaisVendidos.map((produto) => (
                    <div
                      key={produto.position}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[#DDD9D0] bg-[#FAF9F5] text-[7px] font-black text-slate-500">
                          {produto.position}
                        </span>

                        <p className="truncate text-[8px] font-black text-[#0B1115]">
                          {produto.name}
                        </p>
                      </div>

                      <p className="shrink-0 text-[7px] font-bold text-slate-500">
                        {produto.sales}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}