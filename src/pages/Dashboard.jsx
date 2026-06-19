import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AnimatedNumber } from "../components/AnimatedNumber";
import {
  FaBoxOpen,
  FaChartLine,
  FaClipboardList,
  FaCheckCircle,
  FaCreditCard,
  FaMoneyBillWave,
  FaPlay,
  FaReceipt,
  FaRegHandPaper,
  FaStore,
  FaShoppingCart,
  FaSmile,
  FaTruck,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { getLojaConfiguracoesSalvasKey } from "../hooks/useLojaConfiguracoes";

const periodos = [
  { value: "dia", label: "Hoje" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "personalizado", label: "Personalizado" },
  { value: "tudo", label: "Todo período" },
];

const toDateInputValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const dataInicioDia = (value) => {
  if (!value) return null;
  const data = new Date(`${value}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
};

const dataFimDia = (value) => {
  if (!value) return null;
  const data = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(data.getTime()) ? null : data;
};

const formatDateLabel = (value) => {
  const data = dataInicioDia(value);
  return data ? data.toLocaleDateString("pt-BR") : "";
};

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const calcularLucroVenda = (venda) => {
  const desconto = Number(venda.desconto || 0);
  const itens = venda.itens || [];
  const subtotalItens = itens.reduce((soma, item) => {
    const produto = item.variacaoProduto?.produto;
    const preco = Number(item.precoUnitario ?? produto?.preco ?? 0);
    return soma + preco * item.quantidade;
  }, 0);
  const subtotalProdutos = Number(venda.subtotalProdutos ?? subtotalItens);
  const receitaProdutos = Math.max(subtotalProdutos - desconto, 0);
  const custoProdutos = itens.reduce((soma, item) => {
    const produto = item.variacaoProduto?.produto;
    const custoUnitario = Number(item.custoUnitario ?? produto?.custoUnitario ?? 0);
    const outrosCustos = Number(item.outrosCustos ?? produto?.outrosCustos ?? 0);
    return soma + (custoUnitario + outrosCustos) * item.quantidade;
  }, 0);

  return receitaProdutos - custoProdutos;
};

function MetricCard({ titulo, valor, isCurrency = false, icon }) {
  const isNumeric = typeof valor === "number";
  const format = isCurrency ? formatCurrency : (v) => Math.round(v);

  return (
    <div className="lojia-surface rounded-xl border-slate-200/80 bg-white/90 p-4 shadow-[0_10px_28px_rgba(11,17,21,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(11,17,21,0.075)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-500">{titulo}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950">
            {isNumeric ? <AnimatedNumber value={valor} format={format} /> : valor}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm text-[#0B1115] ring-1 ring-slate-200/80">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FeaturedMetricCard({ titulo, valor, periodoAtual }) {
  return (
    <div className="lojia-hero-panel overflow-hidden p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/70">{titulo}</p>
          <p className="mt-1.5 text-3xl font-semibold text-white sm:text-4xl">
            <AnimatedNumber value={valor} format={formatCurrency} />
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[#71E2A9]">
            <FaMoneyBillWave />
          </div>
          <div>
            <p className="text-xs text-white/62">Resumo</p>
            <p className="mt-0.5 text-sm font-medium text-white/85">{periodoAtual}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { usuario, lojaAtual } = useAuth();
  const [vendas, setVendas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [rankingProdutos, setRankingProdutos] = useState([]);
  const [vendasFiltradas, setVendasFiltradas] = useState([]);
  const [periodo, setPeriodo] = useState("dia");
  const [dataInicio, setDataInicio] = useState(() => toDateInputValue(new Date()));
  const [dataFim, setDataFim] = useState(() => toDateInputValue(new Date()));
  const [boasVindasVista, setBoasVindasVista] = useState(false);
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);

  const [total, setTotal] = useState(0);
  const [qtdProdutos, setQtdProdutos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [clientesAtendidos, setClientesAtendidos] = useState(0);
  const [lucro, setLucro] = useState(0);
  const [taxasEntrega, setTaxasEntrega] = useState(0);
  const [formaPagamentoMaisUsada, setFormaPagamentoMaisUsada] = useState("N/A");
  const [verMaisRanking, setVerMaisRanking] = useState(false);

  const [carregando, setCarregando] = useState(true);

  const lojaId = lojaAtual?.loja?.id || "global";
  const boasVindasKey = `lojia_onboarding_boas_vindas_visto_${lojaId}`;
  const onboardingConcluidoKey = `lojia_onboarding_concluido_${lojaId}`;

  const periodoAtual = useMemo(() => {
    if (periodo === "personalizado") {
      const inicio = formatDateLabel(dataInicio);
      const fim = formatDateLabel(dataFim);
      if (inicio && fim) return `${inicio} até ${fim}`;
      return "Período personalizado";
    }

    return periodos.find((item) => item.value === periodo)?.label || "Período";
  }, [dataFim, dataInicio, periodo]);

  const primeiroNome = useMemo(() => {
    const nome = String(usuario?.nome || "lojista").trim();
    return nome.split(/\s+/)[0] || "lojista";
  }, [usuario?.nome]);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const [resVendas, resPedidos, resProdutos, resClientes] = await Promise.all([
          api.get("/vendas"),
          api.get("/pedidos"),
          api.get("/produtos"),
          api.get("/clientes"),
        ]);

        const vendasData = Array.isArray(resVendas.data) ? resVendas.data : [];
        const pedidosData = Array.isArray(resPedidos.data) ? resPedidos.data : [];
        const produtosData = Array.isArray(resProdutos.data) ? resProdutos.data : [];
        const clientesData = Array.isArray(resClientes.data) ? resClientes.data : [];
        setVendas(vendasData);
        setPedidos(pedidosData);
        setProdutos(produtosData);
        setClientes(clientesData);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onboardingAntigoKey = `lojia_onboarding_oculto_${lojaId}`;
    const primeiroAcessoAntigoKey = `lojia_onboarding_primeiro_acesso_visto_${lojaId}`;
    const fluxoAntigoOculto =
      localStorage.getItem(onboardingAntigoKey) === "1" ||
      localStorage.getItem(primeiroAcessoAntigoKey) === "1";

    setBoasVindasVista(
      localStorage.getItem(boasVindasKey) === "1" || fluxoAntigoOculto
    );
    setOnboardingConcluido(
      localStorage.getItem(onboardingConcluidoKey) === "1" ||
        localStorage.getItem(onboardingAntigoKey) === "1"
    );
  }, [boasVindasKey, lojaId, onboardingConcluidoKey]);

  useEffect(() => {
    const hoje = new Date();
    const inicio7Dias = new Date(hoje);
    inicio7Dias.setDate(hoje.getDate() - 6);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioPersonalizado = dataInicioDia(dataInicio);
    const fimPersonalizado = dataFimDia(dataFim);

    const filtrarPorPeriodo = (venda) => {
      const dataVenda = new Date(venda.data);
      const dataVendaStr = dataVenda.toDateString();
      const hojeStr = hoje.toDateString();

      if (periodo === "dia") return dataVendaStr === hojeStr;
      if (periodo === "7dias") return dataVenda >= inicio7Dias && dataVenda <= hoje;
      if (periodo === "mes") return dataVenda >= inicioMes && dataVenda <= hoje;
      if (periodo === "personalizado") {
        if (!inicioPersonalizado || !fimPersonalizado) return false;
        return dataVenda >= inicioPersonalizado && dataVenda <= fimPersonalizado;
      }
      if (periodo === "tudo") return true;
      return false;
    };

    const vendasPeriodo = vendas.filter(filtrarPorPeriodo);
    setVendasFiltradas(vendasPeriodo);

    const totalPeriodo = vendasPeriodo.reduce((acc, venda) => acc + Number(venda.total || 0), 0);
    const totalProdutos = vendasPeriodo.reduce(
      (acc, venda) =>
        acc +
          (venda.itens || []).reduce((soma, item) => soma + Number(item.quantidade || 0), 0),
      0
    );
    const ticket = vendasPeriodo.length ? totalPeriodo / vendasPeriodo.length : 0;

    const lucroTotal = vendasPeriodo.reduce(
      (soma, venda) => soma + calcularLucroVenda(venda),
      0
    );

    const clientes = new Set(vendasPeriodo.map((venda) => venda.clienteId).filter(Boolean));
    const clientesAtendidosPeriodo = clientes.size;

    const totalTaxasEntrega = vendasPeriodo.reduce(
      (acc, venda) => acc + Number(venda.taxaEntrega || 0),
      0
    );

    const pagamentos = {};
    vendasPeriodo.forEach((venda) => {
      const metodo = venda.formaPagamento || "Indefinido";
      pagamentos[metodo] = (pagamentos[metodo] || 0) + 1;
    });
    const maisUsado =
      Object.entries(pagamentos).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const mapa = {};
    vendasPeriodo.forEach((venda) => {
      const dia = new Date(venda.data).toLocaleDateString("pt-BR");
      mapa[dia] = (mapa[dia] || 0) + Number(venda.total || 0);
    });

    const grafico = Object.entries(mapa)
      .map(([dia, totalDia]) => ({ dia, total: totalDia }))
      .sort((a, b) => {
        const [d1, m1, y1] = a.dia.split("/");
        const [d2, m2, y2] = b.dia.split("/");
        return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
      });

    setTotal(totalPeriodo);
    setQtdProdutos(totalProdutos);
    setTicketMedio(ticket);
    setLucro(lucroTotal);
    setClientesAtendidos(clientesAtendidosPeriodo);
    setTaxasEntrega(totalTaxasEntrega);
    setFormaPagamentoMaisUsada(maisUsado);
    setDadosGrafico(grafico);
    setRankingProdutos(
      Object.entries(
        vendasPeriodo.reduce((acc, venda) => {
          (venda.itens || []).forEach((item) => {
            const produto = item.variacaoProduto?.produto;
            const nome = produto?.nome || item.nomeManual;
            if (nome) acc[nome] = (acc[nome] || 0) + Number(item.quantidade || 0);
          });
          return acc;
        }, {})
      )
        .map(([nome, quantidadeVendida], index) => ({
          id: index,
          nome,
          quantidadeVendida,
        }))
        .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
    );

  }, [dataFim, dataInicio, vendas, periodo]);

  const lojaSemOperacao =
    produtos.length === 0 && vendas.length === 0 && pedidos.length === 0 && clientes.length === 0;
  const configuracoesSalvas =
    typeof window !== "undefined" &&
    localStorage.getItem(getLojaConfiguracoesSalvasKey(lojaId)) === "1";

  const onboardingSteps = [
    {
      titulo: "Adicionar produto",
      descricao: "Inclua foto, preço, custo e grade antes da primeira venda.",
      destino: "estoque",
      pronto: produtos.length > 0,
    },
    {
      titulo: "Venda teste",
      descricao: "Valide carrinho, pagamento e recibo antes de operar no dia a dia.",
      destino: "vendas",
      pronto: vendas.length > 0,
    },
    {
      titulo: "Configurar loja",
      descricao: "Revise recibo, taxa padrão e dados que aparecem para o cliente.",
      destino: "minha-conta",
      pronto: Boolean(lojaAtual?.loja?.nome) && configuracoesSalvas,
    },
    {
      titulo: "Adicionar cliente",
      descricao: "Salve um cliente para pedidos, entregas e recibos mais rápidos.",
      destino: "clientes",
      pronto: clientes.length > 0,
    },
  ];

  const onboardingPendente = onboardingSteps.some((step) => !step.pronto);
  const mostrarBoasVindasPrimeiroAcesso =
    lojaSemOperacao && !boasVindasVista && !onboardingConcluido;
  const mostrarChecklistOnboarding =
    boasVindasVista && !onboardingConcluido && onboardingPendente;
  const totalOnboardingConcluido = onboardingSteps.filter((step) => step.pronto).length;
  const progressoOnboarding = onboardingSteps.length
    ? (totalOnboardingConcluido / onboardingSteps.length) * 100
    : 0;

  function marcarBoasVindasVista() {
    if (typeof window !== "undefined") {
      localStorage.setItem(boasVindasKey, "1");
    }
    setBoasVindasVista(true);
  }

  function iniciarOnboarding(destino = "onboarding") {
    marcarBoasVindasVista();
    onNavigate?.(destino);
  }

  function concluirOnboarding() {
    if (typeof window !== "undefined") {
      localStorage.setItem(onboardingConcluidoKey, "1");
      localStorage.setItem(boasVindasKey, "1");
    }
    setBoasVindasVista(true);
    setOnboardingConcluido(true);
  }

  const pedidosOrdenados = useMemo(
    () =>
      [...pedidos].sort((a, b) => {
        const dataA = a.dataEntrega ? new Date(a.dataEntrega).getTime() : new Date(a.dataCriacao).getTime();
        const dataB = b.dataEntrega ? new Date(b.dataEntrega).getTime() : new Date(b.dataCriacao).getTime();
        return dataA - dataB;
      }),
    [pedidos]
  );

  const totalPedidosAbertos = pedidos.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0);

  function formatPedidoDate(pedido) {
    if (!pedido.dataEntrega) return "Sem entrega definida";
    const data = new Date(pedido.dataEntrega).toLocaleDateString("pt-BR");
    return pedido.horarioEntrega ? `${data} às ${pedido.horarioEntrega}` : data;
  }

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700" />
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="lojia-page min-h-screen space-y-4 p-4 sm:p-6">
      <div className="lojia-surface rounded-xl bg-white/90 p-4 shadow-[0_12px_30px_rgba(11,17,21,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#16A34A]/10 text-[#0B1115] ring-1 ring-[#16A34A]/15">
              <FaRegHandPaper />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-slate-500">Dashboard</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">Olá, {primeiroNome}</h2>
              <p className="mt-1 text-sm text-slate-500">Aqui está o resumo da sua operação.</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <div className="flex w-full flex-wrap gap-1 rounded-lg border border-[#E5DED2] bg-[#F7F5EF] p-1 sm:w-auto">
              {periodos.map((item) => {
                const ativo = periodo === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setPeriodo(item.value)}
                    className={`min-h-9 flex-1 rounded-md px-2 text-[11px] font-medium transition sm:flex-none sm:px-3 sm:text-sm ${
                      ativo
                        ? "bg-white text-[#0B1115] shadow-sm"
                        : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {periodo === "personalizado" && (
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                <label className="min-w-0">
                  <span className="sr-only">Data inicial</span>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(event) => setDataInicio(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/10"
                  />
                </label>
                <label className="min-w-0">
                  <span className="sr-only">Data final</span>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(event) => setDataFim(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/10"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarBoasVindasPrimeiroAcesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Boas-vindas a Lojia"
            className="relative w-full max-w-3xl overflow-hidden rounded-[1.4rem] border border-white/20 bg-white shadow-[0_28px_80px_rgba(11,17,21,0.28)]"
          >
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative overflow-hidden bg-[#F8FAF8] p-6 sm:p-7">
                <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#16A34A]/10 blur-2xl" />
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#16A34A] ring-1 ring-slate-200">
                    <FaStore />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase text-slate-400">Primeiro acesso</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Comece pelo que faz a loja vender.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Primeiro cadastre produtos. Depois faça uma venda teste. Os outros ajustes ficam em segundo plano.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="mb-5">
                  <h4 className="text-lg font-semibold text-slate-950">Comece com um roteiro guiado</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    A Lojia mostra o caminho ideal e atualiza o progresso conforme você usa.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {onboardingSteps.slice(0, 2).map((step, index) => (
                    <div key={step.titulo} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{step.titulo}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{step.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => iniciarOnboarding("onboarding")}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-[#15803D]"
                  >
                    <FaPlay size={12} />
                    Começar pelos produtos
                  </button>
                  <button
                    type="button"
                    onClick={marcarBoasVindasVista}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    Fazer depois
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {mostrarChecklistOnboarding && (
        <section className="lojia-surface overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Implantação da loja</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">Finalize o essencial para operar melhor</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
                {totalOnboardingConcluido}/{onboardingSteps.length}
              </span>
              <button
                type="button"
                onClick={() => iniciarOnboarding("onboarding")}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#16A34A] px-3 text-sm font-semibold text-white transition hover:bg-[#15803D]"
              >
                Continuar
              </button>
            </div>
          </div>

          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full rounded-r-full bg-[#16A34A] transition-all"
              style={{ width: `${progressoOnboarding}%` }}
            />
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            {onboardingSteps.map((step) => (
              <button
                key={step.titulo}
                type="button"
                onClick={() => iniciarOnboarding(step.destino)}
                className="group rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-950">{step.titulo}</span>
                  {step.pronto ? (
                    <FaCheckCircle className="shrink-0 text-[#16A34A]" />
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{step.descricao}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end border-t border-slate-200/80 px-4 py-3">
            <button
              type="button"
              onClick={concluirOnboarding}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Ocultar roteiro
            </button>
          </div>
        </section>
      )}

      <FeaturedMetricCard
        titulo="Sua loja vendeu"
        valor={total}
        periodoAtual={periodoAtual}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard titulo="Vendas" valor={vendasFiltradas.length} icon={<FaShoppingCart />} />
        <MetricCard titulo="Produtos" valor={qtdProdutos} icon={<FaBoxOpen />} />
        <MetricCard titulo="Ticket médio" valor={ticketMedio} isCurrency icon={<FaReceipt />} />
        <MetricCard titulo="Lucro bruto" valor={lucro} isCurrency icon={<FaChartLine />} />
        <MetricCard titulo="Clientes" valor={clientesAtendidos} icon={<FaSmile />} />
        <MetricCard titulo="Entregas" valor={taxasEntrega} isCurrency icon={<FaTruck />} />
        <MetricCard titulo="Pedidos" valor={pedidos.length} icon={<FaClipboardList />} />
        <MetricCard titulo="Pagamento" valor={formaPagamentoMaisUsada} icon={<FaCreditCard />} />
      </div>

      <div className="lojia-surface p-4">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Evolução das vendas</h3>
            <p className="text-sm text-slate-500">{periodoAtual}</p>
          </div>
          <p className="text-sm font-medium text-slate-700">{formatCurrency(total)}</p>
        </div>

        {dadosGrafico.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
            <div>
              <p className="text-sm font-medium text-slate-700">Nenhuma venda no período</p>
              <p className="mt-1 text-xs text-slate-500">O gráfico aparece quando houver vendas.</p>
              <button
                type="button"
                onClick={() => onNavigate?.("vendas")}
                className="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                Abrir nova venda
              </button>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                  color: "#0B1115",
                  fontSize: "12px",
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#16A34A"
                strokeWidth={2.4}
                dot={{ r: 3, stroke: "#16A34A", strokeWidth: 2, fill: "#ffffff" }}
                activeDot={{ r: 5, stroke: "#16A34A", strokeWidth: 2, fill: "#ffffff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="lojia-surface p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Pedidos em aberto</h3>
              <p className="text-sm text-slate-500">{formatCurrency(totalPedidosAbertos)} em pedidos pendentes.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {pedidos.length}
            </span>
          </div>

          {pedidosOrdenados.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Nenhum pedido em aberto no momento.</p>
              <p className="mt-1 text-xs text-slate-500">
                Use pedidos para reservar estoque e confirmar a venda depois.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.("pedidos")}
                className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                Abrir pedidos
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pedidosOrdenados.slice(0, 6).map((pedido) => (
                <li key={pedido.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {pedido.cliente?.nome || "Cliente não informado"}
                      </span>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                        {pedido.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{formatPedidoDate(pedido)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-700">
                    {formatCurrency(pedido.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lojia-surface p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Produtos mais vendidos</h3>
              <p className="text-sm text-slate-500">{periodoAtual}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {rankingProdutos.length}
            </span>
          </div>

          {rankingProdutos.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Nenhuma venda registrada neste período.</p>
              <p className="mt-1 text-xs text-slate-500">
                {produtos.length === 0
                  ? "Cadastre o primeiro produto para iniciar a operação."
                  : "Assim que vender, seus produtos mais fortes aparecem aqui."}
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.(produtos.length === 0 ? "estoque" : "vendas")}
                className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                {produtos.length === 0 ? "Cadastrar produto" : "Abrir nova venda"}
              </button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-100">
                {rankingProdutos
                  .slice(0, verMaisRanking ? rankingProdutos.length : 5)
                  .map((produto, index) => (
                    <li key={produto.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-900">{produto.nome}</span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-700">
                        {produto.quantidadeVendida} vendas
                      </span>
                    </li>
                  ))}
              </ul>
              {rankingProdutos.length > 5 && (
                <button
                  onClick={() => setVerMaisRanking(!verMaisRanking)}
                  className="mt-4 text-sm font-medium text-slate-700 hover:text-slate-950"
                >
                  {verMaisRanking ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
