import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronRight,
  Circle,
  Home,
  PackagePlus,
  ReceiptText,
  Settings2,
  ShoppingCart,
  Store,
  TimerReset,
  UserRoundPlus,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { getLojaConfiguracoesSalvasKey } from "../hooks/useLojaConfiguracoes";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function getStorageKey(lojaId, tipo) {
  return `lojia_onboarding_${tipo}_${lojaId || "global"}`;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function MiniStatus({ done }) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${
        done ? "bg-[#16A34A]/10 text-[#15803D]" : "bg-slate-100 text-slate-500"
      }`}
    >
      {done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      {done ? "Concluído" : "Pendente"}
    </span>
  );
}

function TimelineStep({ step, active, index, onNavigate }) {
  const Icon = step.icon;

  return (
    <motion.button
      variants={fadeUp}
      type="button"
      onClick={() => onNavigate(step.destino)}
      className={`group w-full rounded-2xl border p-4 text-left transition ${
        active
          ? "border-slate-300 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
          : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white"
      }`}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            step.pronto ? "bg-[#16A34A]/10 text-[#16A34A]" : active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">0{index + 1}</span>
            <MiniStatus done={step.pronto} />
          </div>
          <p className="mt-2 text-base font-semibold text-slate-950">{step.titulo}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{step.descricaoCurta}</p>
        </div>

        <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
      </div>
    </motion.button>
  );
}

function SecondaryTask({ task, onNavigate }) {
  const Icon = task.icon;

  return (
    <motion.button
      variants={fadeUp}
      type="button"
      onClick={() => onNavigate(task.destino)}
      className="group w-full rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left transition hover:border-slate-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            task.pronto ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-950">{task.titulo}</p>
            {task.pronto ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
            ) : (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#16A34A]" />
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{task.descricao}</p>
        </div>
      </div>
    </motion.button>
  );
}

export default function OnboardingInicial({ onNavigate }) {
  const { usuario, lojaAtual } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const loja = lojaAtual?.loja;
  const lojaId = loja?.id || "global";
  const configuracoesSalvas =
    typeof window !== "undefined" &&
    localStorage.getItem(getLojaConfiguracoesSalvasKey(lojaId)) === "1";

  const primeiroNome = useMemo(() => {
    const nome = String(usuario?.nome || "lojista").trim();
    return nome.split(/\s+/)[0] || "lojista";
  }, [usuario?.nome]);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const [resProdutos, resVendas, resPedidos, resClientes] = await Promise.allSettled([
          api.get("/produtos"),
          api.get("/vendas"),
          api.get("/pedidos"),
          api.get("/clientes"),
        ]);

        if (resProdutos.status === "fulfilled") {
          setProdutos(Array.isArray(resProdutos.value.data) ? resProdutos.value.data : []);
        }
        if (resVendas.status === "fulfilled") {
          setVendas(Array.isArray(resVendas.value.data) ? resVendas.value.data : []);
        }
        if (resPedidos.status === "fulfilled") {
          setPedidos(Array.isArray(resPedidos.value.data) ? resPedidos.value.data : []);
        }
        if (resClientes.status === "fulfilled") {
          setClientes(Array.isArray(resClientes.value.data) ? resClientes.value.data : []);
        }
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const passosPrincipais = useMemo(
    () => [
      {
        titulo: "Adicionar produtos",
        headline: "Cadastre os produtos que mais vendem.",
        descricao:
          "Comece com poucos itens bem cadastrados: foto, preço, custo e grade. Isso já deixa o estoque pronto para vender sem bagunça.",
        descricaoCurta: "Foto, preço, custo e grade para começar com estoque confiável.",
        destino: "estoque",
        pronto: produtos.length > 0,
        icon: PackagePlus,
        acao: produtos.length > 0 ? "Revisar produtos" : "Cadastrar primeiro produto",
        tempo: "3 min",
      },
      {
        titulo: "Venda teste",
        headline: "Faça uma venda simples para validar tudo.",
        descricao:
          "Depois do primeiro produto, finalize uma venda teste para conferir carrinho, pagamento, recibo e fluxo do balcão.",
        descricaoCurta: "Valide carrinho, pagamento e recibo antes de atender clientes.",
        destino: "vendas",
        pronto: vendas.length > 0,
        icon: ShoppingCart,
        acao: vendas.length > 0 ? "Abrir PDV" : "Fazer venda teste",
        tempo: "2 min",
      },
    ],
    [produtos.length, vendas.length]
  );

  const tarefasSecundarias = useMemo(
    () => [
      {
        titulo: "Dados da loja",
        descricao: "Recibo, taxa padrão e informações visíveis para o cliente.",
        destino: "minha-conta",
        pronto: Boolean(loja?.nome) && configuracoesSalvas,
        icon: Store,
      },
      {
        titulo: "Clientes",
        descricao: "Facilita entrega, pedido e histórico de compra.",
        destino: "clientes",
        pronto: clientes.length > 0,
        icon: UserRoundPlus,
      },
      {
        titulo: "Pedido teste",
        descricao: "Valide reserva de estoque e confirmação posterior.",
        destino: "pedidos",
        pronto: pedidos.length > 0,
        icon: ReceiptText,
      },
    ],
    [clientes.length, configuracoesSalvas, loja?.nome, pedidos.length]
  );

  const principaisConcluidos = passosPrincipais.filter((passo) => passo.pronto).length;
  const progressoPrincipal = passosPrincipais.length
    ? (principaisConcluidos / passosPrincipais.length) * 100
    : 0;
  const pendenciasSecundarias = tarefasSecundarias.filter((task) => !task.pronto).length;
  const proximaAcao =
    passosPrincipais.find((passo) => !passo.pronto) || passosPrincipais[passosPrincipais.length - 1];
  const onboardingMinimoConcluido = principaisConcluidos === passosPrincipais.length;
  const ProximaIcon = proximaAcao.icon;

  function marcarBoasVindasVista() {
    if (typeof window === "undefined") return;
    localStorage.setItem(getStorageKey(lojaId, "boas_vindas_visto"), "1");
  }

  function navegar(destino) {
    marcarBoasVindasVista();
    onNavigate?.(destino);
  }

  function finalizar() {
    if (typeof window !== "undefined") {
      localStorage.setItem(getStorageKey(lojaId, "boas_vindas_visto"), "1");
      localStorage.setItem(getStorageKey(lojaId, "concluido"), "1");
    }
    onNavigate?.("dashboard");
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F7F4] p-4 text-slate-950 sm:p-6">
      <motion.main
        className="mx-auto max-w-7xl space-y-5"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.header
          variants={fadeUp}
          className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/[0.85] p-3 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3 px-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <BadgeCheck size={21} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">Implantação Lojia</p>
              <p className="text-xs text-slate-500">{loja?.nome || "Sua loja"} pronta para operar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F8FAF8] p-1.5">
            <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm">
              {formatPercent(progressoPrincipal)}
            </span>
            <span className="px-2 text-xs font-medium text-slate-500">fluxo principal</span>
          </div>
        </motion.header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          <motion.div variants={stagger} className="space-y-5">
            <motion.section
              variants={fadeUp}
              className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]"
            >
              <div className="grid min-h-[440px] lg:grid-cols-[0.78fr_1.22fr]">
                <div className="border-b border-slate-100 bg-[#FBFCF9] p-6 lg:border-b-0 lg:border-r sm:p-8">
                  <div className="flex h-full flex-col justify-between gap-8">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        <TimerReset size={14} className="text-[#16A34A]" />
                        Próxima ação
                      </span>
                      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                        {primeiroNome}, vamos fazer a loja vender.
                      </h1>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                        O onboarding agora mostra só o que importa no começo. Primeiro produto,
                        depois venda teste. Todo o resto fica separado para ajustar com calma.
                      </p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Produto</span>
                        <span>Venda teste</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className="h-full rounded-full bg-[#16A34A]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressoPrincipal}%` }}
                          transition={{ duration: 0.75, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <motion.div
                    key={proximaAcao.titulo}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex h-full flex-col"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <ProximaIcon size={24} />
                      </span>
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
                        <TimerReset size={14} />
                        {proximaAcao.tempo}
                      </div>
                    </div>

                    <div className="mt-10">
                      <MiniStatus done={proximaAcao.pronto} />
                      <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                        {onboardingMinimoConcluido ? "Fluxo principal concluído." : proximaAcao.headline}
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                        {onboardingMinimoConcluido
                          ? "Produto e venda teste já passaram. Você pode ir para o dashboard ou conferir os ajustes secundários."
                          : proximaAcao.descricao}
                      </p>
                    </div>

                    <div className="mt-auto pt-8">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            onboardingMinimoConcluido ? finalizar() : navegar(proximaAcao.destino)
                          }
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#16A34A] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(22,163,74,0.22)] transition hover:bg-[#15803D]"
                        >
                          {onboardingMinimoConcluido ? "Ir para o dashboard" : proximaAcao.acao}
                          <ArrowRight size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navegar(onboardingMinimoConcluido ? "dashboard" : "onboarding")}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {onboardingMinimoConcluido ? "Revisar ajustes" : "Ver roteiro"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            <motion.section variants={stagger} className="grid gap-4 lg:grid-cols-2">
              {passosPrincipais.map((step, index) => (
                <TimelineStep
                  key={step.titulo}
                  step={step}
                  index={index}
                  active={proximaAcao.titulo === step.titulo && !onboardingMinimoConcluido}
                  onNavigate={navegar}
                />
              ))}
            </motion.section>
          </motion.div>

          <motion.aside variants={fadeUp} className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <section className="overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
              <div className="border-b border-slate-100 bg-[#FBFCF9] p-5">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Bell size={20} />
                    {pendenciasSecundarias > 0 && (
                      <motion.span
                        className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#16A34A] px-1 text-[11px] font-bold text-white"
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {pendenciasSecundarias}
                      </motion.span>
                    )}
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Segundo plano</h2>
                    <p className="text-xs text-slate-500">Ajustes úteis, sem travar a primeira venda.</p>
                  </div>
                </div>
              </div>

              <motion.div variants={stagger} className="space-y-3 p-4">
                {tarefasSecundarias.map((task) => (
                  <SecondaryTask key={task.titulo} task={task} onNavigate={navegar} />
                ))}
              </motion.div>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200/80 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.045)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Settings2 size={19} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">Regra do começo</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Produto bom cadastrado e venda teste feita. Depois disso, o restante melhora a operação,
                    mas não bloqueia o lojista.
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={finalizar}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <CheckCircle2 size={16} />
                Marcar como concluído
              </button>
              <button
                type="button"
                onClick={() => navegar("dashboard")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-transparent px-4 text-sm font-semibold text-slate-600 transition hover:bg-white"
              >
                <Home size={16} />
                Voltar ao dashboard
              </button>
            </div>
          </motion.aside>
        </section>

        {carregando && (
          <motion.div
            className="fixed inset-x-0 bottom-4 z-20 mx-auto w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Atualizando progresso...
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
