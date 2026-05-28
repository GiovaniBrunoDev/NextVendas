import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";

const recursos = [
  {
    titulo: "Venda com menos passos",
    texto: "Monte a venda, finalize o pagamento e gere recibos com uma rotina direta para o balcão.",
    icon: ReceiptText,
  },
  {
    titulo: "Pedidos organizados",
    texto: "Reserve numerações, acompanhe entregas e transforme pedidos confirmados em venda.",
    icon: ClipboardList,
  },
  {
    titulo: "Estoque por variação",
    texto: "Controle produtos por numeração, entrada de reposição, custo, marca e fornecedor.",
    icon: Package,
  },
  {
    titulo: "Clientes sempre à mão",
    texto: "Consulte histórico, endereço e dados importantes sem depender de planilhas soltas.",
    icon: UsersRound,
  },
];

const passos = [
  "Cadastre produtos, numerações e custos.",
  "Venda no balcão ou reserve como pedido.",
  "Acompanhe estoque, clientes e resultados.",
];

export default function Institucional() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFFEFA] text-[#020C2C]">
      <section className="relative flex min-h-[88dvh] flex-col overflow-hidden bg-[#020C2C] text-white">
        <img
          src="/login-stock-hero.png"
          alt="Pessoa organizando estoque de calçados com computador exibindo sistema"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.34]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,31,36,0.96)_0%,rgba(24,31,36,0.86)_42%,rgba(24,31,36,0.32)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#FFFEFA] via-[#FFFEFA]/35 to-transparent" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/institucional" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-white/12 bg-white">
              <img src="/lojia-icon.svg" alt="Lojia" className="h-full w-full object-cover" />
            </span>
            <span className="text-lg font-semibold text-white">Lojia</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/72 md:flex">
            <a href="#recursos" className="transition hover:text-white">
              Recursos
            </a>
            <a href="#rotina" className="transition hover:text-white">
              Rotina
            </a>
            <a href="#contato" className="transition hover:text-white">
              Começar
            </a>
          </nav>

          <Link
            to="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/14 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
          >
            Entrar
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase text-white/78 backdrop-blur">
              <Sparkles size={14} className="text-[#16A36B]" />
              Sistema para lojas pequenas
            </span>
            <h1 className="mt-7 text-5xl font-semibold leading-[0.98] text-white sm:text-6xl lg:text-7xl">
              Lojia
            </h1>
            <p className="mt-5 text-xl font-medium text-white/86 sm:text-2xl">
              Sua loja no controle.
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Um sistema simples e bonito para vender, reservar pedidos, controlar estoque por numeração e enxergar o que acontece na loja todos os dias.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#16A36B] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(22,163,107,0.25)] transition hover:bg-[#020C2C]"
              >
                Acessar sistema <ArrowRight size={17} />
              </Link>
              <a
                href="#recursos"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/14 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
              >
                Conhecer recursos
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="relative z-20 mx-auto -mt-10 grid w-full max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {recursos.map((recurso) => {
          const Icon = recurso.icon;
          return (
            <article key={recurso.titulo} className="rounded-lg border border-[#E5DED2] bg-[#FFFEFA] p-5 shadow-[0_16px_34px_rgba(24,31,36,0.08)]">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A36B]/10 text-[#020C2C]">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold text-[#020C2C]">{recurso.titulo}</h2>
              <p className="mt-3 text-sm leading-6 text-[#66736D]">{recurso.texto}</p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:px-8">
        <div>
          <span className="text-xs font-semibold uppercase text-[#020C2C]">Feito para o dia a dia</span>
          <h2 className="mt-3 text-3xl font-semibold text-[#020C2C] sm:text-4xl">
            O lojista não precisa de um sistema complicado para trabalhar bem.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#66736D]">
            A Lojia concentra as partes mais importantes da operação em uma experiência limpa: vender, reservar, repor, consultar e acompanhar o resultado da loja.
          </p>

          <div className="mt-8 space-y-3">
            {passos.map((passo) => (
              <div key={passo} className="flex items-start gap-3 text-sm font-medium text-[#020C2C]">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#16A36B]" />
                <span>{passo}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#E5DED2] bg-[#F7F5EF] p-3 shadow-[0_18px_44px_rgba(24,31,36,0.08)]">
          <div className="rounded-lg border border-[#E5DED2] bg-[#FFFEFA] p-4">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#020C2C] text-white">
                  <Store size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#020C2C]">Resumo da loja</p>
                  <p className="text-xs text-[#66736D]">Visão simples para decidir rápido</p>
                </div>
              </div>
              <span className="rounded-full bg-[#16A36B]/10 px-3 py-1 text-xs font-semibold text-[#020C2C]">
                online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Faturamento", "R$ 2.345,80", ShoppingBag],
                ["Pedidos", "12 ativos", ClipboardList],
                ["Estoque", "382 itens", Package],
                ["Lucro bruto", "R$ 814,40", BarChart3],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-lg border border-[#E5DED2] bg-white p-4">
                  <Icon size={18} className="text-[#16A36B]" />
                  <p className="mt-4 text-xs font-medium uppercase text-[#66736D]">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-[#020C2C]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="rotina" className="bg-[#F7F5EF]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-[4.5rem] sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-1">
            <span className="text-xs font-semibold uppercase text-[#020C2C]">Rotina mais leve</span>
            <h2 className="mt-3 text-3xl font-semibold text-[#020C2C]">
              Menos improviso. Mais controle.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
            {[
              ["PDV", "Venda rápida com carrinho, desconto, entrega e recibo."],
              ["Pedidos", "Reserva de estoque até a confirmação da venda."],
              ["Estoque", "Reposição, custo, fornecedor, marca e numeração."],
            ].map(([titulo, texto]) => (
              <article key={titulo} className="rounded-lg border border-[#E5DED2] bg-[#FFFEFA] p-5">
                <h3 className="text-base font-semibold text-[#020C2C]">{titulo}</h3>
                <p className="mt-3 text-sm leading-6 text-[#66736D]">{texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-[#020C2C] px-5 py-10 text-center text-white sm:px-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-[#16A36B]">
            <ShieldCheck size={24} />
          </div>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-white">
            Uma base profissional para sua loja crescer sem perder o controle.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/68">
            Comece pelo essencial: produtos, clientes, pedidos, vendas e estoque. O resto evolui junto com a operação.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#16A36B] px-5 text-sm font-semibold text-white transition hover:bg-[#020C2C]"
            >
              Entrar na Lojia <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
