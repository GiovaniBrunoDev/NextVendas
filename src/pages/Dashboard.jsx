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
  FaCreditCard,
  FaMoneyBillWave,
  FaReceipt,
  FaShoppingCart,
  FaSmile,
  FaTruck,
} from "react-icons/fa";

const periodos = [
  { value: "dia", label: "Hoje" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "tudo", label: "Todo período" },
];

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const calcularLucroVenda = (venda) => {
  const desconto = Number(venda.desconto || 0);
  const subtotalItens = venda.itens.reduce((soma, item) => {
    const produto = item.variacaoProduto?.produto;
    const preco = Number(item.precoUnitario ?? produto?.preco ?? 0);
    return soma + preco * item.quantidade;
  }, 0);
  const subtotalProdutos = Number(venda.subtotalProdutos ?? subtotalItens);
  const receitaProdutos = Math.max(subtotalProdutos - desconto, 0);
  const custoProdutos = venda.itens.reduce((soma, item) => {
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
    <div className="lojia-surface p-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(36,48,43,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase text-slate-500">{titulo}</p>
          <p className="mt-1.5 truncate text-xl font-semibold text-slate-950">
            {isNumeric ? <AnimatedNumber value={valor} format={format} /> : valor}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#16A36B]/10 text-sm text-[#020C2C]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FeaturedMetricCard({ titulo, valor }) {
  return (
    <div className="lojia-hero-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <p className="text-xs text-white/62">Período</p>
            <p className="mt-0.5 text-sm font-medium text-white/85">Selecionado acima</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [vendas, setVendas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [rankingProdutos, setRankingProdutos] = useState([]);
  const [vendasFiltradas, setVendasFiltradas] = useState([]);
  const [periodo, setPeriodo] = useState("dia");

  const [total, setTotal] = useState(0);
  const [qtdProdutos, setQtdProdutos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [clientesAtendidos, setClientesAtendidos] = useState(0);
  const [lucro, setLucro] = useState(0);
  const [taxasEntrega, setTaxasEntrega] = useState(0);
  const [formaPagamentoMaisUsada, setFormaPagamentoMaisUsada] = useState("N/A");
  const [verMaisRanking, setVerMaisRanking] = useState(false);

  const [carregando, setCarregando] = useState(true);

  const periodoAtual = useMemo(
    () => periodos.find((item) => item.value === periodo)?.label || "Período",
    [periodo]
  );

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const [resVendas, resPedidos] = await Promise.all([
          api.get("/vendas"),
          api.get("/pedidos"),
        ]);

        const vendasData = Array.isArray(resVendas.data) ? resVendas.data : [];
        const pedidosData = Array.isArray(resPedidos.data) ? resPedidos.data : [];
        setVendas(vendasData);
        setPedidos(pedidosData);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    const hoje = new Date();
    const inicio7Dias = new Date(hoje);
    inicio7Dias.setDate(hoje.getDate() - 6);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const filtrarPorPeriodo = (venda) => {
      const dataVenda = new Date(venda.data);
      const dataVendaStr = dataVenda.toDateString();
      const hojeStr = hoje.toDateString();

      if (periodo === "dia") return dataVendaStr === hojeStr;
      if (periodo === "7dias") return dataVenda >= inicio7Dias && dataVenda <= hoje;
      if (periodo === "mes") return dataVenda >= inicioMes && dataVenda <= hoje;
      if (periodo === "tudo") return true;
      return false;
    };

    const vendasPeriodo = vendas.filter(filtrarPorPeriodo);
    setVendasFiltradas(vendasPeriodo);

    const totalPeriodo = vendasPeriodo.reduce((acc, venda) => acc + Number(venda.total || 0), 0);
    const totalProdutos = vendasPeriodo.reduce(
      (acc, venda) =>
        acc +
        venda.itens.reduce((soma, item) => soma + Number(item.quantidade || 0), 0),
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
          venda.itens.forEach((item) => {
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

  }, [vendas, periodo]);

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
    return pedido.horarioEntrega ? `${data} as ${pedido.horarioEntrega}` : data;
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
      <div className="lojia-surface p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Visao geral</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">
              {vendasFiltradas.length} vendas analisadas em {periodoAtual.toLowerCase()}.
            </p>
          </div>

          <div className="grid w-full grid-cols-4 gap-1 rounded-lg border border-[#E5DED2] bg-[#F7F5EF] p-1 sm:inline-flex sm:w-auto">
            {periodos.map((item) => {
              const ativo = periodo === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setPeriodo(item.value)}
                  className={`min-h-9 min-w-0 rounded-md px-1 text-[10px] font-medium transition sm:flex-none sm:px-3 sm:text-sm ${
                    ativo
                      ? "bg-white text-[#020C2C] shadow-sm"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                  }`}
                >
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <FeaturedMetricCard
        titulo="Faturamento"
        valor={total}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Vendas"
          valor={vendasFiltradas.length}
          icon={<FaShoppingCart />}
        />
        <MetricCard
          titulo="Produtos"
          valor={qtdProdutos}
          icon={<FaBoxOpen />}
        />
        <MetricCard
          titulo="Ticket médio"
          valor={ticketMedio}
          isCurrency
          icon={<FaReceipt />}
        />
        <MetricCard
          titulo="Lucro bruto"
          valor={lucro}
          isCurrency
          icon={<FaChartLine />}
        />
        <MetricCard
          titulo="Clientes"
          valor={clientesAtendidos}
          icon={<FaSmile />}
        />
        <MetricCard
          titulo="Entregas"
          valor={taxasEntrega}
          isCurrency
          icon={<FaTruck />}
        />
        <MetricCard
          titulo="Pedidos"
          valor={pedidos.length}
          icon={<FaClipboardList />}
        />
        <MetricCard
          titulo="Pagamento"
          valor={formaPagamentoMaisUsada}
          icon={<FaCreditCard />}
        />
      </div>

      <div className="lojia-surface p-4">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Evolucao das vendas</h3>
            <p className="text-sm text-slate-500">{periodoAtual}</p>
          </div>
          <p className="text-sm font-medium text-slate-700">{formatCurrency(total)}</p>
        </div>

        {dadosGrafico.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
            <div>
              <p className="text-sm font-medium text-slate-700">Nenhuma venda no período</p>
              <p className="mt-1 text-xs text-slate-500">O grafico aparece quando houver vendas.</p>
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
                  color: "#0f172a",
                  fontSize: "12px",
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#16A36B"
                strokeWidth={2.4}
                dot={{ r: 3, stroke: "#16A36B", strokeWidth: 2, fill: "#ffffff" }}
                activeDot={{ r: 5, stroke: "#16A36B", strokeWidth: 2, fill: "#ffffff" }}
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
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhum pedido em aberto no momento.
            </p>
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
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhuma venda registrada neste período.
            </p>
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
