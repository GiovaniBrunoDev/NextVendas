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
import { TrendingUp, TrendingDown, Minus } from 'react-feather'; // ou 'react-icons/fi'


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

  // Valores do período anterior
  const [totalAnterior, setTotalAnterior] = useState(0);
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
      if (periodo === "tudo") return true; // ✅ novo filtro
      return false;
    };

    const vendasPeriodo = vendas.filter(filtrarPorPeriodo);
    setVendasFiltradas(vendasPeriodo);

    // Valores atuais
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
    const clientesAtendidos = clientes.size;

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

    // --------------------------
    // Valores do período anterior
    // --------------------------
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
    if (periodo === "tudo") {
      vendasPeriodoAnterior = [];
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

    // --------------------------
    // Salvar estados
    // --------------------------
    setTotal(totalPeriodo);
    setQtdProdutos(totalProdutos);
    setTicketMedio(ticket);
    setLucro(lucroTotal);
    setClientesAtendidos(clientesAtendidos);
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
    setQtdProdutosAnterior(totalProdutosPeriodoAnterior);
    setTicketMedioAnterior(ticketPeriodoAnterior);
    setLucroAnterior(lucroPeriodoAnterior);
    setClientesAnterior(clientesPeriodoAnterior);
    setTaxasEntregaAnterior(taxasEntregaPeriodoAnterior);
  }, [vendas, periodo]);

  // ===============================
  // Tela de carregamento
  // ===============================
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-300 border-r-slate-400 animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-700 font-medium text-lg animate-pulse">
          Carregando seu dashboard...
        </p>
      </div>
    );
  }

  // ===============================
  // Card com variação
  // ===============================
  function Card({ titulo, valor, isCurrency = false, variacao }) {
    const format = isCurrency
      ? (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
      : (v) => Math.round(v);

    const icons = {
      Vendas: <FaShoppingCart className="text-gray-600 text-xl" />,
      "Total Faturado": <FaMoneyBillWave className="text-green-500 text-xl" />,
      "Produtos Vendidos": <FaBoxOpen className="text-gray-600 text-xl" />,
      "Ticket Médio": <FaReceipt className="text-gray-600 text-xl" />,
      "Lucro Estimado": <FaChartLine className="text-blue-500 text-xl" />,
      "Clientes Atendidos": <FaSmile className="text-gray-600 text-xl" />,
      "Taxas de Entrega": <FaTruck className="text-gray-600 text-xl" />,
      "Pagamento Mais Usada": <FaCreditCard className="text-gray-600 text-xl" />,
    };

    const variacaoClasse =
      variacao > 0
        ? "bg-green-100 text-green-600"
        : variacao < 0
          ? "bg-red-100 text-red-600"
          : "bg-gray-100 text-gray-500";


    return (
      <div className="relative bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3">
        {/* Badge de variação no canto superior direito */}
        {variacao !== undefined && (
          <div
            className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium flex items-center gap-1
      ${variacao > 0 ? "text-green-500" : variacao < 0 ? "text-red-500" : "text-gray-500"}`}
          >
            {/* Ícone de tendência */}
            {variacao > 0 && <TrendingUp size={16} className="mr-1.5" />}
            {variacao < 0 && <TrendingDown size={16} className="mr-1.5" />}
            {variacao === 0 && <Minus size={16} className="mr-1.5" />}

            {/* Valor percentual */}
            {Math.abs(variacao).toFixed(1)}%
          </div>
        )}




        <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 text-lg">
          {icons[titulo] || <FaChartLine />}
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-400">{titulo}</span>
          <span className="text-xl font-semibold text-gray-800 mt-0.5">
            <AnimatedNumber value={valor} format={format} />
          </span>
        </div>
      </div>
    );


  }

  // --------------------------
  // Retorno JSX
  // --------------------------
  return (
    <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h2>
        <div className="flex flex-col items-start gap-2 text-sm font-medium text-gray-500">
          {/* Botão Exportar */}
          <button className="hover:text-gray-900 transition-colors">Exportar</button>

          {/* Selector de período */}
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
            {["dia", "7dias", "mes", "tudo"].map((p) => {

              const ativo = periodo === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`relative px-3 sm:px-4 py-1 text-sm font-medium rounded-lg transition-all duration-200
            ${ativo
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    }`}
                >
                  {p === "dia"
                    ? "Hoje"
                    : p === "7dias"
                      ? "Últimos 7 dias"
                      : p === "mes"
                        ? "Este mês"
                        : "Todo o período"}

                </button>
              );
            })}
          </div>
        </div>


      </div>

      {/* Cards de Indicadores com comparação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          titulo="Vendas"
          valor={vendasFiltradas.length}
          variacao={calcVariacao(vendasFiltradas.length, clientesAnterior)}
        />
        <Card
          titulo="Total Faturado"
          valor={total}
          isCurrency
          variacao={calcVariacao(total, totalAnterior)}
        />
        <Card
          titulo="Produtos Vendidos"
          valor={qtdProdutos}
          variacao={calcVariacao(qtdProdutos, qtdProdutosAnterior)}
        />
        <Card
          titulo="Ticket Médio"
          valor={ticketMedio}
          isCurrency
          variacao={calcVariacao(ticketMedio, ticketMedioAnterior)}
        />
        <Card
          titulo="Lucro Estimado"
          valor={lucro}
          isCurrency
          variacao={calcVariacao(lucro, lucroAnterior)}
        />
        <Card
          titulo="Clientes Atendidos"
          valor={clientesAtendidos}
          variacao={calcVariacao(clientesAtendidos, clientesAnterior)}
        />
        <Card
          titulo="Taxas de Entrega"
          valor={taxasEntrega}
          isCurrency
          variacao={calcVariacao(taxasEntrega, taxasEntregaAnterior)}
        />
        <Card
          titulo="Forma de Pagamento Mais Usada"
          valor={formaPagamentoMaisUsada}
        />
      </div>

      {/* Gráfico de vendas */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Evolução das Vendas (
          {periodo === "dia"
            ? "Hoje"
            : periodo === "7dias"
              ? "Últimos 7 dias"
              : periodo === "mes"
                ? "Este mês"
                : "Todo o período"}
          )

        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5, stroke: "#2563eb", strokeWidth: 2, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estoque Baixo e Ranking */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Estoque Baixo */}
        <div className="flex-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estoque Baixo</h3>
            {produtosCriticos.filter(p => {
              const estoque = p.variacoes.reduce((acc, v) => acc + v.estoque, 0);
              return estoque < Math.floor(12 * 0.5);
            }).length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum produto com estoque crítico.</p>
            ) : (
              <>
                <ul className="space-y-4">
                  {produtosCriticos
                    .filter(p => p.variacoes.reduce((acc, v) => acc + v.estoque, 0) < Math.floor(12 * 0.5))
                    .slice(0, verMaisEstoque ? produtosCriticos.length : 5)
                    .map(p => {
                      const estoqueDisponivel = p.variacoes
                        .filter(v => v.estoque > 0)
                        .reduce((acc, v) => acc + v.estoque, 0);
                      const porcentagem = Math.round((estoqueDisponivel / 12) * 100);
                      return (
                        <li key={p.id} className="space-y-1">
                          <div className="flex justify-between text-sm font-medium text-gray-800">
                            <span>{p.nome}</span>
                            <span className="text-gray-500">{estoqueDisponivel} de 12 pares</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full">
                            <div
                              className="bg-red-400 h-2 rounded-full transition-all"
                              style={{ width: `${porcentagem}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-right text-gray-500">{porcentagem}% disponível</p>
                        </li>
                      );
                    })}
                </ul>
                {produtosCriticos.length > 5 && (
                  <button
                    onClick={() => setVerMaisEstoque(!verMaisEstoque)}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    {verMaisEstoque ? "Ver menos" : "Ver mais"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Ranking Produtos Mais Vendidos */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Produtos Mais Vendidos</h3>
            {rankingProdutos.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhuma venda registrada neste período.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {rankingProdutos
                    .slice(0, verMaisRanking ? rankingProdutos.length : 5)
                    .map((produto, index) => (
                      <li key={produto.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 font-semibold w-5 text-right">{index + 1}.</span>
                          <span className="text-sm text-gray-800">{produto.nome}</span>
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{produto.quantidadeVendida} vendas</span>
                      </li>
                    ))}
                </ul>
                {rankingProdutos.length > 5 && (
                  <button
                    onClick={() => setVerMaisRanking(!verMaisRanking)}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    {verMaisRanking ? "Ver menos" : "Ver mais"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

