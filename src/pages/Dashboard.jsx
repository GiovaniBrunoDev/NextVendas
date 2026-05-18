import { useEffect, useState } from "react";
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
  FaShoppingCart,
  FaMoneyBillWave,
  FaBoxOpen,
  FaReceipt,
  FaSmile,
  FaTruck,
  FaCreditCard,
  FaChartLine,
} from "react-icons/fa";
import { TrendingUp, TrendingDown, Minus } from "react-feather";

const periodos = [
  { value: "dia", label: "Hoje" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "tudo", label: "Todo o período" },
];

export default function Dashboard() {
  const [vendas, setVendas] = useState([]);
  const [produtosCriticos, setProdutosCriticos] = useState([]);
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
  const [verMaisEstoque, setVerMaisEstoque] = useState(false);

  const [totalAnterior, setTotalAnterior] = useState(0);
  const [vendasAnterior, setVendasAnterior] = useState(0);
  const [qtdProdutosAnterior, setQtdProdutosAnterior] = useState(0);
  const [ticketMedioAnterior, setTicketMedioAnterior] = useState(0);
  const [lucroAnterior, setLucroAnterior] = useState(0);
  const [clientesAnterior, setClientesAnterior] = useState(0);
  const [taxasEntregaAnterior, setTaxasEntregaAnterior] = useState(0);

  const [carregando, setCarregando] = useState(true);

  const formatCurrency = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);

  const calcVariacao = (atual, anterior) =>
    anterior ? ((atual - anterior) / anterior) * 100 : 0;

  const periodoAtual = periodos.find((item) => item.value === periodo)?.label || "Período";

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        const [resVendas, resProdutos] = await Promise.all([
          api.get("/vendas"),
          api.get("/produtos"),
        ]);

        const vendasData = resVendas.data;
        const produtos = resProdutos.data;
        setVendas(vendasData);

        const criticos = produtos.filter((p) => {
          const totalVar = p.variacoes.length;
          if (totalVar === 0) return false;
          const zerados = p.variacoes.filter((v) => v.estoque === 0).length;
          return zerados / totalVar >= 0.5;
        });
        setProdutosCriticos(criticos);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!vendas.length) return;

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

    const totalPeriodo = vendasPeriodo.reduce((acc, v) => acc + v.total, 0);
    const totalProdutos = vendasPeriodo.reduce(
      (acc, v) => acc + v.itens.reduce((soma, i) => soma + i.quantidade, 0),
      0
    );
    const ticket = vendasPeriodo.length ? totalPeriodo / vendasPeriodo.length : 0;

    let lucroTotal = 0;
    vendasPeriodo.forEach((venda) => {
      venda.itens.forEach((item) => {
        const produto = item.variacaoProduto?.produto;
        if (produto) {
          const lucroUnitario =
            produto.preco - produto.custoUnitario - produto.outrosCustos;
          lucroTotal += lucroUnitario * item.quantidade;
        }
      });
    });

    const clientes = new Set(vendasPeriodo.map((v) => v.clienteId).filter(Boolean));
    const clientesAtendidosPeriodo = clientes.size;

    const totalTaxasEntrega = vendasPeriodo.reduce(
      (acc, v) => acc + (v.taxaEntrega || 0),
      0
    );

    const pagamentos = {};
    vendasPeriodo.forEach((v) => {
      const metodo = v.formaPagamento || "Indefinido";
      pagamentos[metodo] = (pagamentos[metodo] || 0) + 1;
    });
    const maisUsado =
      Object.entries(pagamentos).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const mapa = {};
    vendasPeriodo.forEach((v) => {
      const dia = new Date(v.data).toLocaleDateString("pt-BR");
      mapa[dia] = (mapa[dia] || 0) + v.total;
    });

    const grafico = Object.entries(mapa)
      .map(([dia, total]) => ({ dia, total }))
      .sort((a, b) => {
        const [d1, m1, y1] = a.dia.split("/");
        const [d2, m2, y2] = b.dia.split("/");
        return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
      });

    let vendasPeriodoAnterior = [];

    if (periodo === "dia") {
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      vendasPeriodoAnterior = vendas.filter(
        (v) => new Date(v.data).toDateString() === ontem.toDateString()
      );
    }
    if (periodo === "7dias") {
      const inicio7DiasPassados = new Date(inicio7Dias);
      inicio7DiasPassados.setDate(inicio7Dias.getDate() - 7);
      vendasPeriodoAnterior = vendas.filter(
        (v) => new Date(v.data) >= inicio7DiasPassados && new Date(v.data) < inicio7Dias
      );
    }
    if (periodo === "mes") {
      const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      vendasPeriodoAnterior = vendas.filter(
        (v) => new Date(v.data) >= inicioMesAnterior && new Date(v.data) <= fimMesAnterior
      );
    }

    const totalPeriodoAnterior = vendasPeriodoAnterior.reduce((acc, v) => acc + v.total, 0);
    const totalProdutosPeriodoAnterior = vendasPeriodoAnterior.reduce(
      (acc, v) => acc + v.itens.reduce((soma, i) => soma + i.quantidade, 0),
      0
    );
    const ticketPeriodoAnterior = vendasPeriodoAnterior.length
      ? totalPeriodoAnterior / vendasPeriodoAnterior.length
      : 0;

    let lucroPeriodoAnterior = 0;
    vendasPeriodoAnterior.forEach((venda) => {
      venda.itens.forEach((item) => {
        const produto = item.variacaoProduto?.produto;
        if (produto) {
          const lucroUnitario =
            produto.preco - produto.custoUnitario - produto.outrosCustos;
          lucroPeriodoAnterior += lucroUnitario * item.quantidade;
        }
      });
    });

    const clientesPeriodoAnterior = new Set(
      vendasPeriodoAnterior.map((v) => v.clienteId).filter(Boolean)
    ).size;

    const taxasEntregaPeriodoAnterior = vendasPeriodoAnterior.reduce(
      (acc, v) => acc + (v.taxaEntrega || 0),
      0
    );

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
            if (produto) acc[produto.nome] = (acc[produto.nome] || 0) + item.quantidade;
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

    setTotalAnterior(totalPeriodoAnterior);
    setVendasAnterior(vendasPeriodoAnterior.length);
    setQtdProdutosAnterior(totalProdutosPeriodoAnterior);
    setTicketMedioAnterior(ticketPeriodoAnterior);
    setLucroAnterior(lucroPeriodoAnterior);
    setClientesAnterior(clientesPeriodoAnterior);
    setTaxasEntregaAnterior(taxasEntregaPeriodoAnterior);
  }, [vendas, periodo]);

  function MetricCard({ titulo, valor, isCurrency = false, variacao, icon }) {
    const isNumeric = typeof valor === "number";
    const format = isCurrency ? formatCurrency : (v) => Math.round(v);

    return (
      <div className="relative min-h-[96px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {variacao !== undefined && (
          <div
            className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              variacao > 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : variacao < 0
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {variacao > 0 && <TrendingUp size={13} />}
            {variacao < 0 && <TrendingDown size={13} />}
            {variacao === 0 && <Minus size={13} />}
            {Math.abs(variacao).toFixed(1)}%
          </div>
        )}

        <div className="flex items-start gap-3 pr-16">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-600">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
            <p className="mt-1 truncate text-xl font-semibold text-slate-950">
              {isNumeric ? <AnimatedNumber value={valor} format={format} /> : valor}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            {vendasFiltradas.length} vendas analisadas em {periodoAtual.toLowerCase()}.
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
          {periodos.map((item) => {
            const ativo = periodo === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setPeriodo(item.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  ativo
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Vendas"
          valor={vendasFiltradas.length}
          variacao={calcVariacao(vendasFiltradas.length, vendasAnterior)}
          icon={<FaShoppingCart />}
        />
        <MetricCard
          titulo="Total Faturado"
          valor={total}
          isCurrency
          variacao={calcVariacao(total, totalAnterior)}
          icon={<FaMoneyBillWave />}
        />
        <MetricCard
          titulo="Produtos Vendidos"
          valor={qtdProdutos}
          variacao={calcVariacao(qtdProdutos, qtdProdutosAnterior)}
          icon={<FaBoxOpen />}
        />
        <MetricCard
          titulo="Ticket Médio"
          valor={ticketMedio}
          isCurrency
          variacao={calcVariacao(ticketMedio, ticketMedioAnterior)}
          icon={<FaReceipt />}
        />
        <MetricCard
          titulo="Lucro Estimado"
          valor={lucro}
          isCurrency
          variacao={calcVariacao(lucro, lucroAnterior)}
          icon={<FaChartLine />}
        />
        <MetricCard
          titulo="Clientes Atendidos"
          valor={clientesAtendidos}
          variacao={calcVariacao(clientesAtendidos, clientesAnterior)}
          icon={<FaSmile />}
        />
        <MetricCard
          titulo="Taxas de Entrega"
          valor={taxasEntrega}
          isCurrency
          variacao={calcVariacao(taxasEntrega, taxasEntregaAnterior)}
          icon={<FaTruck />}
        />
        <MetricCard
          titulo="Pagamento Mais Usado"
          valor={formaPagamentoMaisUsada}
          icon={<FaCreditCard />}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Evolução das vendas</h3>
            <p className="text-sm text-slate-500">{periodoAtual}</p>
          </div>
          <p className="text-sm font-medium text-slate-700">{formatCurrency(total)}</p>
        </div>

        <ResponsiveContainer width="100%" height={260}>
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
              stroke="#334155"
              strokeWidth={2.5}
              dot={{ r: 3, stroke: "#334155", strokeWidth: 2, fill: "#ffffff" }}
              activeDot={{ r: 5, stroke: "#334155", strokeWidth: 2, fill: "#ffffff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Estoque baixo</h3>
              <p className="text-sm text-slate-500">Produtos com atenção operacional</p>
            </div>
          </div>

          {produtosCriticos.filter((p) => {
            const estoque = p.variacoes.reduce((acc, v) => acc + v.estoque, 0);
            return estoque < Math.floor(12 * 0.5);
          }).length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Nenhum produto com estoque crítico.
            </p>
          ) : (
            <>
              <ul className="space-y-4">
                {produtosCriticos
                  .filter((p) => p.variacoes.reduce((acc, v) => acc + v.estoque, 0) < Math.floor(12 * 0.5))
                  .slice(0, verMaisEstoque ? produtosCriticos.length : 5)
                  .map((p) => {
                    const estoqueDisponivel = p.variacoes
                      .filter((v) => v.estoque > 0)
                      .reduce((acc, v) => acc + v.estoque, 0);
                    const porcentagem = Math.round((estoqueDisponivel / 12) * 100);
                    return (
                      <li key={p.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex justify-between gap-4 text-sm font-medium text-slate-900">
                          <span className="truncate">{p.nome}</span>
                          <span className="shrink-0 text-slate-500">{estoqueDisponivel} de 12</span>
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-slate-700 transition-all"
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                        <p className="mt-2 text-right text-xs text-slate-500">{porcentagem}% disponível</p>
                      </li>
                    );
                  })}
              </ul>
              {produtosCriticos.length > 5 && (
                <button
                  onClick={() => setVerMaisEstoque(!verMaisEstoque)}
                  className="mt-4 text-sm font-medium text-slate-700 hover:text-slate-950"
                >
                  {verMaisEstoque ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-950">Produtos mais vendidos</h3>
            <p className="text-sm text-slate-500">{periodoAtual}</p>
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
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
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
