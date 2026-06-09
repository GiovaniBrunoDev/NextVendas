import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  Check,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Package,
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
  { label: "Estoque", icon: Boxes },
  { label: "Clientes", icon: Users },
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
    value: "R$ 142",
    detail: "+9,1%",
    icon: CreditCard,
  },
];

export default function LojiaHeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[980px] py-12 lg:py-20">
      <style>
        {`
          @keyframes lojiaDashboardFloat {
            0%, 100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-9px);
            }
          }

          @keyframes lojiaFloatingCard {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }

            50% {
              transform: translateY(-9px) rotate(1deg);
            }
          }

          @keyframes lojiaFloatingCardReverse {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }

            50% {
              transform: translateY(8px) rotate(-1deg);
            }
          }

          @keyframes lojiaPulse {
            0%, 100% {
              opacity: .35;
              transform: scale(1);
            }

            50% {
              opacity: .7;
              transform: scale(1.06);
            }
          }

          @keyframes lojiaGraphDraw {
            from {
              stroke-dashoffset: 1000;
            }

            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes lojiaDotMove {
            0% {
              opacity: 0;
              offset-distance: 0%;
            }

            15% {
              opacity: 1;
            }

            85% {
              opacity: 1;
            }

            100% {
              opacity: 0;
              offset-distance: 100%;
            }
          }

          .lojia-dashboard-float {
            animation: lojiaDashboardFloat 7s ease-in-out infinite;
          }

          .lojia-floating-card {
            animation: lojiaFloatingCard 5.5s ease-in-out infinite;
          }

          .lojia-floating-card-reverse {
            animation: lojiaFloatingCardReverse 6.5s ease-in-out infinite;
          }

          .lojia-pulse {
            animation: lojiaPulse 5s ease-in-out infinite;
          }

          .lojia-graph-line {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: lojiaGraphDraw 3s ease forwards;
          }

          @media (prefers-reduced-motion: reduce) {
            .lojia-dashboard-float,
            .lojia-floating-card,
            .lojia-floating-card-reverse,
            .lojia-pulse,
            .lojia-graph-line {
              animation: none !important;
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>

      {/* Iluminação */}
      <div className="lojia-pulse absolute left-1/2 top-1/2 -z-10 h-[75%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16A34A]/15 blur-[110px]" />

      {/* Linhas de dados */}
      <svg
        viewBox="0 0 1000 680"
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      >
        <defs>
          <linearGradient id="lojiaDataLine" x1="0" x2="1">
            <stop offset="0%" stopColor="#16A34A" stopOpacity="0" />
            <stop offset="50%" stopColor="#16A34A" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M130 190 C260 100, 360 130, 450 210"
          fill="none"
          stroke="url(#lojiaDataLine)"
          strokeWidth="2"
          strokeDasharray="5 9"
        />

        <path
          d="M620 100 C790 65, 900 160, 870 275"
          fill="none"
          stroke="url(#lojiaDataLine)"
          strokeWidth="2"
          strokeDasharray="5 9"
        />

        <path
          d="M650 510 C790 610, 900 540, 895 410"
          fill="none"
          stroke="url(#lojiaDataLine)"
          strokeWidth="2"
          strokeDasharray="5 9"
        />

        {[170, 360, 540, 760, 880].map((cx, index) => (
          <circle
            key={cx}
            cx={cx}
            cy={index % 2 === 0 ? 185 : 505}
            r="4"
            fill="#16A34A"
            opacity="0.45"
          />
        ))}
      </svg>

      {/* Card flutuante: venda */}
      <div className="lojia-floating-card absolute left-0 top-[23%] z-30 hidden rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_20px_55px_rgba(15,23,42,0.13)] backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECFDF5] text-[#16A34A]">
            <Check size={18} strokeWidth={3} />
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-500">
              Venda realizada
            </p>
            <p className="text-sm font-black text-[#0B1115]">R$ 189,90</p>
          </div>
        </div>
      </div>

      {/* Card flutuante: estoque */}
      <div className="lojia-floating-card-reverse absolute right-0 top-[17%] z-30 hidden rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_20px_55px_rgba(15,23,42,0.13)] backdrop-blur-xl xl:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECFDF5] text-[#16A34A]">
            <Boxes size={18} />
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-500">
              Estoque atualizado
            </p>
            <p className="text-sm font-black text-[#0B1115]">
              Tamanho 39
            </p>
          </div>
        </div>
      </div>

      {/* Card flutuante: faturamento */}
      <div className="lojia-floating-card absolute bottom-[14%] right-[3%] z-30 hidden rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_20px_55px_rgba(15,23,42,0.13)] backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECFDF5] text-[#16A34A]">
            <TrendingUp size={18} />
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-500">
              Crescimento
            </p>
            <p className="text-sm font-black text-[#16A34A]">+18,6%</p>
          </div>
        </div>
      </div>

      {/* Ícone flutuante */}
      <div className="lojia-floating-card-reverse absolute bottom-[24%] left-[4%] z-30 hidden h-14 w-14 place-items-center rounded-2xl bg-[#0B1115] text-[#5EEA9F] shadow-[0_20px_50px_rgba(15,23,42,0.18)] lg:grid">
        <BarChart3 size={23} />
      </div>

      {/* Perspectiva 3D */}
      <div
        className="relative mx-auto w-[96%]"
        style={{
          perspective: "1700px",
        }}
      >
        <div className="lojia-dashboard-float">
          <div
            className="relative"
            style={{
              transform: "rotateY(-9deg) rotateX(3deg) rotateZ(-0.8deg)",
              transformStyle: "preserve-3d",
              transformOrigin: "center",
            }}
          >
            {/* Camada traseira para profundidade */}
            <div
              className="absolute inset-0 rounded-[2rem] bg-[#0B1115]/15 blur-sm"
              style={{
                transform: "translateZ(-45px) translateX(24px) translateY(24px)",
              }}
            />

            {/* Janela principal */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-2 shadow-[0_45px_120px_rgba(15,23,42,0.20)]">
              {/* Barra do navegador */}
              <div className="flex items-center justify-between rounded-t-[1.45rem] border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>

                <div className="rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-bold text-slate-500">
                  lojia.app/dashboard
                </div>

                <div className="w-12" />
              </div>

              <div className="grid min-h-[520px] grid-cols-[185px_1fr] overflow-hidden rounded-b-[1.45rem] bg-[#F6F8F7]">
                {/* Sidebar */}
                <aside className="relative bg-[#101816] p-5 text-white">
                  <div className="mb-7 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sm font-black text-[#101816]">
                      L
                    </div>

                    <div>
                      <p className="text-lg font-black leading-none">Lojia</p>
                      <p className="mt-1 text-[9px] font-semibold text-white/35">
                        Gestão da loja
                      </p>
                    </div>
                  </div>

                  <nav className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold ${
                            item.active
                              ? "bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/15"
                              : "text-white/50"
                          }`}
                        >
                          <Icon size={14} />
                          {item.label}
                        </div>
                      );
                    })}
                  </nav>

                  <div className="absolute bottom-5 left-5 flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[#16A34A] text-[10px] font-black">
                      G
                    </div>

                    <div>
                      <p className="text-[10px] font-black">Giovani</p>
                      <p className="text-[8px] font-semibold text-white/35">
                        Administrador
                      </p>
                    </div>
                  </div>
                </aside>

                {/* Dashboard estilizado */}
                <section className="bg-[#F6F8F7] p-5">
                  <div className="mb-5 flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Visão geral
                      </p>

                      <h3 className="mt-1 text-2xl font-black tracking-tight text-[#0B1115]">
                        Dashboard
                      </h3>

                      <p className="mt-1 text-[10px] font-semibold text-slate-500">
                        Acompanhe os resultados da sua loja.
                      </p>
                    </div>

                    <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[9px] font-black text-slate-500 shadow-sm">
                      Todo período
                    </div>
                  </div>

                  {/* Destaque faturamento */}
                  <div className="rounded-2xl bg-[#101A3A] p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-white/50">
                          Faturamento
                        </p>

                        <p className="mt-2 text-2xl font-black">
                          R$ 56.878,95
                        </p>
                      </div>

                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[#5EEA9F]">
                        <CircleDollarSign size={16} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[9px] font-black text-[#5EEA9F]">
                        +18,6% no período
                      </span>

                      <ArrowUpRight size={15} className="text-[#5EEA9F]" />
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {metricas.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[7px] font-black uppercase text-slate-400">
                                {item.label}
                              </p>

                              <p className="mt-2 text-xs font-black text-[#0B1115]">
                                {item.value}
                              </p>
                            </div>

                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#ECFDF5] text-[#16A34A]">
                              <Icon size={11} />
                            </div>
                          </div>

                          <p className="mt-2 text-[7px] font-black text-[#16A34A]">
                            {item.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gráfico */}
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-[#0B1115]">
                        Evolução das vendas
                      </p>

                      <span className="text-[8px] font-bold text-slate-400">
                        Este mês
                      </span>
                    </div>

                    <div className="relative mt-3 h-[145px] overflow-hidden">
                      <div className="absolute inset-0 grid grid-rows-4">
                        {[1, 2, 3, 4].map((item) => (
                          <div
                            key={item}
                            className="border-t border-dashed border-slate-200"
                          />
                        ))}
                      </div>

                      <svg
                        viewBox="0 0 500 160"
                        preserveAspectRatio="none"
                        className="relative h-full w-full"
                      >
                        <defs>
                          <linearGradient
                            id="lojiaStylizedArea"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#16A34A"
                              stopOpacity="0.24"
                            />
                            <stop
                              offset="100%"
                              stopColor="#16A34A"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>

                        <path
                          d="M0 125 C38 92, 72 112, 110 78 C148 42, 185 122, 225 92 C268 48, 305 126, 348 80 C390 35, 425 108, 460 62 C480 43, 492 48, 500 30 L500 160 L0 160 Z"
                          fill="url(#lojiaStylizedArea)"
                        />

                        <path
                          className="lojia-graph-line"
                          d="M0 125 C38 92, 72 112, 110 78 C148 42, 185 122, 225 92 C268 48, 305 126, 348 80 C390 35, 425 108, 460 62 C480 43, 492 48, 500 30"
                          fill="none"
                          stroke="#16A34A"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Cards inferiores */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-[8px] font-bold text-slate-400">
                        Pedidos em aberto
                      </p>

                      <p className="mt-2 text-xs font-black text-[#0B1115]">
                        R$ 119,90
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-[8px] font-bold text-slate-400">
                        Produto mais vendido
                      </p>

                      <p className="mt-2 text-xs font-black text-[#0B1115]">
                        Nike Air Force
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Camada lateral para reforçar o 3D */}
            <div
              className="absolute bottom-[3%] right-[-15px] top-[5%] w-[16px] rounded-r-xl bg-gradient-to-b from-[#25302D] to-[#0B1115] opacity-80"
              style={{
                transform: "translateZ(-20px)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}