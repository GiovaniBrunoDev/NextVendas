import { useEffect, useState } from "react";
import LojiaHeroMockup from "../components/LojiaHeroMockup";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ChevronDown,
  CreditCard,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

export default function LandingPage() {
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -70px 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const navItems = [
    { label: "Visão geral", href: "#visao" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Recursos", href: "#recursos" },
    { label: "Planos", href: "#planos" },
  ];

  const metricas = [
    { value: "PDV", label: "vendas rápidas" },
    { value: "SKU", label: "estoque por tamanho" },
    { value: "Lucro", label: "controle financeiro" },
    { value: "Online", label: "acesso pelo navegador" },
  ];

  const etapas = [
    {
      icon: Tags,
      number: "01",
      title: "Cadastre os produtos",
      text: "Adicione nome, preço, custo, imagem, vídeo e numerações disponíveis.",
    },
    {
      icon: CreditCard,
      number: "02",
      title: "Venda pelo PDV",
      text: "Selecione o produto, escolha o tamanho e finalize a venda rapidamente.",
    },
    {
      icon: BarChart3,
      number: "03",
      title: "Acompanhe o resultado",
      text: "Veja vendas, lucro, produtos mais vendidos e estoque atualizado.",
    },
  ];

  const recursos = [
    {
      icon: CreditCard,
      title: "PDV rápido",
      text: "Venda com poucos cliques em uma tela limpa e fácil de usar.",
    },
    {
      icon: Boxes,
      title: "Estoque por numeração",
      text: "Controle o saldo de cada tamanho individualmente.",
    },
    {
      icon: BarChart3,
      title: "Dashboard completo",
      text: "Acompanhe vendas, lucro e desempenho da loja.",
    },
    {
      icon: Tags,
      title: "Cadastro de produtos",
      text: "Organize preço, custo, imagens, vídeos e variações.",
    },
    {
      icon: Users,
      title: "Clientes e histórico",
      text: "Registre clientes e acompanhe compras anteriores.",
    },
    {
      icon: ShoppingBag,
      title: "Venda avulsa",
      text: "Registre vendas fora do estoque sem bagunçar seus produtos.",
    },
  ];

  const planos = [
    {
      name: "Inicial",
      price: "R$ 49",
      description: "Para lojas pequenas que querem sair da planilha.",
      featured: false,
      items: [
        "PDV de vendas",
        "Cadastro de produtos",
        "Controle de estoque",
        "Dashboard básico",
      ],
    },
    {
      name: "Profissional",
      price: "R$ 89",
      description: "Para lojas que querem controlar tudo com mais clareza.",
      featured: true,
      items: [
        "Tudo do Inicial",
        "Estoque por numeração",
        "Cadastro de clientes",
        "Relatórios completos",
        "Catálogo online",
      ],
    },
    {
      name: "Premium",
      price: "R$ 149",
      description: "Para lojas em crescimento que precisam de mais recursos.",
      featured: false,
      items: [
        "Tudo do Profissional",
        "Múltiplos usuários",
        "Suporte prioritário",
        "Recursos avançados",
      ],
    },
  ];

  const faq = [
    {
      q: "O Lojia serve para loja de calçados?",
      a: "Sim. O Lojia foi pensado para lojas que controlam produtos por numeração, como calçados, roupas e acessórios.",
    },
    {
      q: "Consigo controlar estoque por tamanho?",
      a: "Sim. Cada produto pode ter variações de numeração com estoque individual.",
    },
    {
      q: "Funciona no celular?",
      a: "Sim. A interface é responsiva e pode ser usada no computador, tablet ou celular.",
    },
    {
      q: "Preciso instalar algo?",
      a: "Não. O sistema funciona pelo navegador.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F7F3] text-[#0B1115]">
      <style>
        {`
          @keyframes floatSoft {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes mockupShine {
            0% {
              transform: translateX(-120%) rotate(12deg);
              opacity: 0;
            }
            20% {
              opacity: .35;
            }
            60% {
              opacity: .14;
            }
            100% {
              transform: translateX(120%) rotate(12deg);
              opacity: 0;
            }
          }

          @keyframes gridMove {
            from {
              background-position: 0 0;
            }
            to {
              background-position: 56px 56px;
            }
          }

          @keyframes softPulse {
            0%, 100% {
              transform: scale(1);
              opacity: .65;
            }
            50% {
              transform: scale(1.035);
              opacity: .9;
            }
          }

          @keyframes menuDrop {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .reveal {
            opacity: 0;
            transform: translateY(24px) scale(.985);
            filter: blur(10px);
            transition:
              opacity .8s ease,
              transform .8s cubic-bezier(.22, 1, .36, 1),
              filter .8s ease;
          }

          .reveal.is-visible {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }

          .float-soft {
            animation: floatSoft 5.5s ease-in-out infinite;
          }

          .float-soft-delay {
            animation: floatSoft 6.5s ease-in-out infinite;
            animation-delay: 1s;
          }

          .hero-grid {
            animation: gridMove 28s linear infinite;
          }

          .soft-pulse {
            animation: softPulse 4.5s ease-in-out infinite;
          }

          .mockup-shine {
            position: relative;
            overflow: hidden;
          }

          .mockup-shine::after {
            content: "";
            position: absolute;
            top: -30%;
            left: 0;
            width: 34%;
            height: 160%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.18),
              transparent
            );
            animation: mockupShine 7.5s ease-in-out infinite;
            pointer-events: none;
          }

          .menu-animate {
            animation: menuDrop .24s ease both;
          }

          @media (prefers-reduced-motion: reduce) {
            .reveal,
            .float-soft,
            .float-soft-delay,
            .hero-grid,
            .soft-pulse,
            .mockup-shine::after,
            .menu-animate {
              animation: none !important;
              transition: none !important;
              opacity: 1 !important;
              transform: none !important;
              filter: none !important;
            }
          }
        `}
      </style>

      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/70 bg-white/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/lojia-logo.png"
              alt="Lojia"
              className="h-10 w-auto object-contain"
            />
          </a>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 text-sm font-bold text-slate-600 shadow-sm lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 transition hover:bg-[#ECFDF5] hover:text-[#15803D]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="/login"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Entrar
            </a>

            <a
              href="/cadastro"
              className="inline-flex items-center gap-2 rounded-full bg-[#0B1115] px-5 py-2.5 text-sm font-black text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#16A34A]"
            >
              Começar agora
              <ArrowRight size={16} />
            </a>
          </div>

          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
          >
            {menuAberto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuAberto && (
          <div className="menu-animate border-t border-slate-100 bg-white px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-4 text-sm font-bold text-slate-700">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuAberto(false)}
                >
                  {item.label}
                </a>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <a
                  href="/login"
                  className="rounded-full border border-slate-200 px-4 py-3 text-center"
                >
                  Entrar
                </a>
                <a
                  href="/cadastro"
                  className="rounded-full bg-[#16A34A] px-4 py-3 text-center text-white"
                >
                  Começar
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <section id="visao" className="relative pt-32 lg:pt-36">
        <div className="soft-pulse absolute left-[-120px] top-16 -z-10 h-80 w-80 rounded-full bg-[#16A34A]/10 blur-[100px]" />

        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,#DFF5E8_0%,transparent_28%),radial-gradient(circle_at_85%_10%,#EEF7F1_0%,transparent_25%),linear-gradient(180deg,#F7F7F3_0%,#FFFFFF_55%,#F7F7F3_100%)]" />

        <div
          className="hero-grid absolute inset-0 -z-10 opacity-[0.2]"
          style={{
            backgroundImage:
              "linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 lg:px-8 lg:py-28 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="reveal">

            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-[#0B1115] sm:text-6xl lg:text-6xl">
              Controle estoque, vendas e relatórios da sua loja em um só lugar.

            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              O Lojia é um sistema PDV simples e moderno para organizar vendas,
              estoque por numeração, clientes, produtos e resultados da sua loja.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B1115] px-7 py-4 text-sm font-black text-white shadow-2xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#16A34A]"
              >
                Começar agora
                <ArrowRight size={18} />
              </a>

              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#16A34A]/30 hover:text-[#15803D]"
              >
                Ver como funciona
              </a>
            </div>

            <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                "Sem planilha confusa",
                "Baixa automática",
                "Controle por tamanho",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0B1115] text-white">
                    <Check size={15} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative min-w-0 w-full reveal lg:justify-self-stretch"
            style={{ transitionDelay: "160ms" }}
          >
            <div className="mx-auto w-full max-w-[1040px]">
              <LojiaHeroMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-32">
        <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          {metricas.map((item, index) => (
            <div
              key={item.label}
              className="reveal rounded-[1.5rem] bg-[#F7FAF8] px-5 py-7 text-center transition duration-300 hover:-translate-y-1 hover:bg-[#0B1115] hover:text-white hover:shadow-xl hover:shadow-slate-900/10"
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <p className="text-3xl font-black tracking-tight">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-bold opacity-70">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-36">
        <div className="reveal mx-auto max-w-4xl text-center">
          <span className="text-sm font-black uppercase tracking-wide text-[#16A34A]">
            Como funciona
          </span>

          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] lg:text-6xl">
            Simples para começar. Completo para controlar.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            O lojista entende o fluxo em poucos segundos: cadastra, vende e
            acompanha os resultados.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {etapas.map((etapa, index) => {
            const Icon = etapa.icon;

            return (
              <div
                key={etapa.number}
                className="reveal group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 lg:p-9"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#16A34A]/10 transition group-hover:bg-[#16A34A]/15" />

                <div className="relative">
                  <div className="mb-7 flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[#ECFDF5] text-[#16A34A]">
                      <Icon size={25} />
                    </div>

                    <p className="text-sm font-black text-[#16A34A]">
                      {etapa.number}
                    </p>
                  </div>

                  <h3 className="text-2xl font-black tracking-tight">
                    {etapa.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {etapa.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-32">
        <div className="grid gap-7 lg:grid-cols-3">
          <div className="reveal rounded-[2.3rem] bg-[#0B1115] p-9 text-white lg:col-span-1 lg:p-10">
            <div className="mb-6 grid h-14 w-14 place-items-center rounded-3xl bg-[#16A34A]">
              <ShieldCheck size={28} />
            </div>

            <h2 className="text-4xl font-black tracking-[-0.04em]">
              Menos erro. Mais controle.
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/60">
              O Lojia resolve os principais problemas de quem vende com
              estoque, numeração e controle manual.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
            {[
              ["Antes", "Planilhas confusas", "Depois", "Painel visual e simples"],
              ["Antes", "Erro na numeração", "Depois", "Estoque por tamanho"],
              ["Antes", "Lucro sem clareza", "Depois", "Custo e venda no painel"],
              ["Antes", "Venda demorada", "Depois", "PDV rápido e objetivo"],
            ].map(([a, b, c, d], index) => (
              <div
                key={b}
                className="reveal rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-red-400">
                    {a}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-700">{b}</p>
                </div>

                <div className="mt-3 rounded-3xl bg-[#ECFDF5] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#15803D]">
                    {c}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-700">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-36">
        <div className="reveal mx-auto max-w-4xl text-center">
          <span className="text-sm font-black uppercase tracking-wide text-[#16A34A]">
            Recursos
          </span>

          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] lg:text-6xl">
            Tudo que sua loja precisa em um só lugar.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Recursos simples de entender, bonitos de usar e úteis para a rotina
            de venda.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recursos.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="reveal group rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-2xl hover:shadow-slate-900/10 lg:p-8"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-3xl bg-[#ECFDF5] text-[#16A34A] transition group-hover:bg-[#16A34A] group-hover:text-white">
                    <Icon size={24} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#16A34A]"
                  />
                </div>

                <h3 className="text-xl font-black tracking-tight">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0B1115] py-32 text-white lg:py-40">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[#16A34A]/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#5EEA9F]/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl gap-16 px-5 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:px-8">
          <div className="reveal">
            <span className="text-sm font-black uppercase tracking-wide text-[#5EEA9F]">
              Diferencial para calçados
            </span>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] lg:text-6xl">
              Controle o estoque por tamanho, sem complicar sua rotina.
            </h2>

            <p className="mt-6 text-base leading-8 text-white/60">
              Em vez de controlar apenas o produto geral, o Lojia permite
              visualizar o saldo de cada numeração. Isso evita erros e deixa a
              venda mais segura.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Controle por tamanho",
                "Baixa automática",
                "Busca rápida",
                "Produtos com variações",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-2xl bg-[#16A34A]">
                    <Check size={16} />
                  </div>
                  <p className="text-sm font-bold">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="rounded-[2rem] bg-white p-5 text-[#0B1115]">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black">Tênis Casual Branco</p>
                  <p className="text-sm font-semibold text-slate-500">
                    Código: LJ-303-BRANCO
                  </p>
                </div>

                <div className="rounded-full bg-[#ECFDF5] px-4 py-2 text-xs font-black text-[#15803D]">
                  Em estoque
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { size: "36", qty: "8 un." },
                  { size: "37", qty: "14 un." },
                  { size: "38", qty: "21 un." },
                  { size: "39", qty: "6 un." },
                  { size: "40", qty: "12 un." },
                  { size: "41", qty: "9 un." },
                  { size: "42", qty: "3 un." },
                  { size: "43", qty: "0 un." },
                ].map((item) => (
                  <div
                    key={item.size}
                    className={`rounded-3xl border p-4 text-center transition hover:-translate-y-1 ${item.qty === "0 un."
                      ? "border-slate-100 bg-slate-50 opacity-45"
                      : item.size === "39"
                        ? "border-[#16A34A] bg-[#ECFDF5]"
                        : "border-[#16A34A]/10 bg-[#F7FAF8]"
                      }`}
                  >
                    <p className="text-3xl font-black">{item.size}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {item.qty}
                    </p>
                  </div>
                ))}
              </div>

              <button className="mt-5 w-full rounded-3xl bg-[#16A34A] py-4 text-sm font-black text-white shadow-xl shadow-[#16A34A]/20 transition hover:-translate-y-0.5 hover:bg-[#15803D]">
                Adicionar à venda
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-5 py-28 lg:px-8 lg:py-36">
        <div className="reveal mx-auto max-w-4xl text-center">
          <span className="text-sm font-black uppercase tracking-wide text-[#16A34A]">
            Planos
          </span>

          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] lg:text-6xl">
            Escolha o plano ideal para sua loja.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Comece com o essencial e evolua conforme sua operação crescer.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {planos.map((plano, index) => (
            <div
              key={plano.name}
              className={`reveal relative rounded-[2.3rem] border p-8 shadow-sm transition duration-300 hover:-translate-y-1 lg:p-9 ${plano.featured
                ? "border-[#16A34A] bg-[#0B1115] text-white shadow-2xl shadow-slate-900/15"
                : "border-slate-200 bg-white text-[#0B1115]"
                }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {plano.featured && (
                <div className="mb-5 inline-flex rounded-full bg-[#16A34A] px-4 py-2 text-xs font-black text-white">
                  Mais recomendado
                </div>
              )}

              <h3 className="text-2xl font-black">{plano.name}</h3>

              <p
                className={`mt-3 text-sm leading-6 ${plano.featured ? "text-white/60" : "text-slate-600"
                  }`}
              >
                {plano.description}
              </p>

              <div className="mt-8 flex items-end gap-1">
                <p className="text-5xl font-black tracking-tight">
                  {plano.price}
                </p>
                <p
                  className={`pb-2 text-sm font-bold ${plano.featured ? "text-white/45" : "text-slate-500"
                    }`}
                >
                  /mês
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {plano.items.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check
                      size={17}
                      className={
                        plano.featured ? "text-[#5EEA9F]" : "text-[#16A34A]"
                      }
                    />
                    <p
                      className={`text-sm font-bold ${plano.featured ? "text-white/75" : "text-slate-700"
                        }`}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <a
                href="/cadastro"
                className={`mt-9 inline-flex w-full items-center justify-center rounded-full px-5 py-4 text-sm font-black transition ${plano.featured
                  ? "bg-[#16A34A] text-white hover:bg-[#15803D]"
                  : "bg-[#F0FDF7] text-[#15803D] hover:bg-[#16A34A] hover:text-white"
                  }`}
              >
                Quero testar o Lojia
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-5 py-28 lg:px-8 lg:py-32">
        <div className="reveal text-center">
          <span className="text-sm font-black uppercase tracking-wide text-[#16A34A]">
            Dúvidas frequentes
          </span>

          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] lg:text-5xl">
            Perguntas sobre o Lojia
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {faq.map((item, index) => (
            <details
              key={item.q}
              className="reveal group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#16A34A]/30 hover:shadow-xl hover:shadow-slate-900/5"
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black">
                {item.q}
                <ChevronDown
                  size={19}
                  className="shrink-0 text-slate-400 transition group-open:rotate-180"
                />
              </summary>

              <p className="mt-4 text-sm leading-6 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-32 pt-10 lg:px-8 lg:pb-40">
        <div className="reveal relative overflow-hidden rounded-[2.5rem] bg-[#0B1115] p-10 text-center text-white shadow-2xl shadow-slate-900/15 lg:p-20">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#16A34A]/15 blur-[80px]" />

          <div className="relative">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-white/15">
              <TrendingUp size={30} />
            </div>

            <h2 className="mx-auto max-w-4xl text-4xl font-black tracking-[-0.05em] lg:text-6xl">
              Sua loja mais organizada, rápida e fácil de controlar.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/75">
              Comece a controlar vendas, estoque e lucro com um PDV moderno
              feito para a rotina de lojas.
            </p>

            <a
              href="/cadastro"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-[#0B1115] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#ECFDF5]"
            >
              Começar agora
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <img
              src="/lojia-logo.png"
              alt="Lojia"
              className="h-10 w-auto object-contain"
            />

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Lojia é um sistema PDV moderno para lojas que querem vender,
              controlar estoque e acompanhar resultados com simplicidade.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-sm font-black">Produto</p>
              <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                <a href="#como-funciona" className="block hover:text-[#16A34A]">
                  Como funciona
                </a>
                <a href="#recursos" className="block hover:text-[#16A34A]">
                  Recursos
                </a>
                <a href="#planos" className="block hover:text-[#16A34A]">
                  Planos
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm font-black">Acesso</p>
              <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                <a href="/login" className="block hover:text-[#16A34A]">
                  Entrar
                </a>
                <a href="/cadastro" className="block hover:text-[#16A34A]">
                  Criar conta
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm font-black">Contato</p>
              <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                <a href="#" className="block hover:text-[#16A34A]">
                  Instagram
                </a>
                <a href="#" className="block hover:text-[#16A34A]">
                  Suporte
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-5 text-center text-xs font-semibold text-slate-500">
          © {new Date().getFullYear()} Lojia. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  );
}