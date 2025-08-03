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

export default function Dashboard() {
  const [vendas, setVendas] = useState([]);
  const [vendasFiltradas, setVendasFiltradas] = useState([]);
  const [periodo, setPeriodo] = useState("dia");

  const [total, setTotal] = useState(0);
  const [qtdProdutos, setQtdProdutos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [clientesAtendidos, setClientesAtendidos] = useState(0);
  const [lucro, setLucro] = useState(0);
  const [entregas, setEntregas] = useState(0);
  const [formaPagamentoMaisUsada, setFormaPagamentoMaisUsada] = useState("N/A");
  const [produtosCriticos, setProdutosCriticos] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [rankingProdutos, setRankingProdutos] = useState([]);

  const formatCurrency = valor =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resVendas, resProdutos] = await Promise.all([
          api.get("/vendas"),
          api.get("/produtos"),
        ]);

        const vendasData = resVendas.data;
        const produtos = resProdutos.data;
        setVendas(vendasData);

        const criticos = produtos.filter(p => {
          const totalVar = p.variacoes.length;
          if (totalVar === 0) return false;
          const zerados = p.variacoes.filter(v => v.estoque === 0).length;
          return zerados / totalVar >= 0.5;
        });
        setProdutosCriticos(criticos);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    const hoje = new Date();
    const inicio7Dias = new Date(hoje);
    inicio7Dias.setDate(hoje.getDate() - 6);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const filtrarPorPeriodo = venda => {
      const dataVenda = new Date(venda.data);
      if (periodo === "dia") {
        return dataVenda.toISOString().slice(0, 10) === hoje.toISOString().slice(0, 10);
      }
      if (periodo === "7dias") {
        return dataVenda >= inicio7Dias && dataVenda <= hoje;
      }
      if (periodo === "mes") {
        return dataVenda >= inicioMes && dataVenda <= hoje;
      }
      return false;
    };

    const vendasPeriodo = vendas.filter(filtrarPorPeriodo);
    setVendasFiltradas(vendasPeriodo);

    const totalPeriodo = vendasPeriodo.reduce((acc, v) => acc + v.total, 0);
    const totalProdutos = vendasPeriodo.reduce(
      (acc, v) => acc + v.itens.reduce((soma, i) => soma + i.quantidade, 0),
      0
    );
    const ticket =
      vendasPeriodo.length > 0 ? totalPeriodo / vendasPeriodo.length : 0;

    let lucroTotal = 0;
    const ranking = {};
    vendasPeriodo.forEach(venda => {
      venda.itens.forEach(item => {
        const produto = item.variacaoProduto?.produto;
        if (produto) {
          const lucroUnitario =
            produto.preco - produto.custoUnitario - produto.outrosCustos;
          lucroTotal += lucroUnitario * item.quantidade;

          ranking[produto.nome] = (ranking[produto.nome] || 0) + item.quantidade;
        }
      });
    });

    const rankingFinal = Object.entries(ranking)
      .map(([nome, quantidadeVendida], index) => ({
        id: index,
        nome,
        quantidadeVendida,
      }))
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

    const clientes = new Set(vendasPeriodo.map(v => v.clienteId).filter(Boolean));
    const clientesAtendidos = clientes.size;

    const entregas = vendasPeriodo.filter(v => v.tipoEntrega === "Entrega").length;

    const pagamentos = {};
    vendasPeriodo.forEach(v => {
      const metodo = v.formaPagamento || "Indefinido";
      pagamentos[metodo] = (pagamentos[metodo] || 0) + 1;
    });
    const maisUsado = Object.entries(pagamentos)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const mapa = {};
    vendasPeriodo.forEach(v => {
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

    setTotal(totalPeriodo);
    setQtdProdutos(totalProdutos);
    setTicketMedio(ticket);
    setLucro(lucroTotal);
    setClientesAtendidos(clientesAtendidos);
    setEntregas(entregas);
    setFormaPagamentoMaisUsada(maisUsado);
    setDadosGrafico(grafico);
    setRankingProdutos(rankingFinal);
  }, [vendas, periodo]);

  function Card({ titulo, valor, isCurrency = false }) {
  const format = isCurrency
    ? v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
    : v => Math.round(v);

  const icons = {
    "Vendas": <FaShoppingCart className="text-indigo-500 text-xl" />,
    "Total Vendido": <FaMoneyBillWave className="text-green-500 text-xl" />,
    "Produtos Vendidos": <FaBoxOpen className="text-yellow-500 text-xl" />,
    "Ticket Médio": <FaReceipt className="text-blue-500 text-xl" />,
    "Lucro Estimado": <FaChartLine className="text-pink-500 text-xl" />,
    "Clientes Atendidos": <FaSmile className="text-purple-500 text-xl" />,
    "Entregas Realizadas": <FaTruck className="text-orange-500 text-xl" />,
    "Pagamento Mais Usado": <FaCreditCard className="text-gray-500 text-xl" />,
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
        {icons[titulo] || <FaChartLine className="text-gray-400 text-xl" />}
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{titulo}</span>
        <span className="text-xl font-semibold text-gray-800 mt-1">
          <AnimatedNumber value={valor} format={format} />
        </span>
      </div>
    </div>
  );
}


  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard</h2>

      {/* Filtros */}
      <div className="flex gap-4 mb-4">
        {["dia", "7dias", "mes"].map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-4 py-2 rounded ${
              periodo === p
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {p === "dia" ? "Hoje" : p === "7dias" ? "Últimos 7 dias" : "Mês"}
          </button>
        ))}
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card titulo="Vendas" valor={vendasFiltradas.length} />
        <Card titulo="Total Vendido" valor={total} isCurrency />
        <Card titulo="Produtos Vendidos" valor={qtdProdutos} />
        <Card titulo="Ticket Médio" valor={ticketMedio} isCurrency />
        <Card titulo="Lucro Estimado" valor={lucro} isCurrency />
        <Card titulo="Clientes Atendidos" valor={clientesAtendidos} />
        <Card titulo="Entregas Realizadas" valor={entregas} />
        <Card titulo="Pagamento Mais Usado" valor={formaPagamentoMaisUsada} />
      </div>

      {/* Cards laterais */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Coluna esquerda */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          {/* Estoque Baixo */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">🚨 Estoque Baixo</h3>
            {produtosCriticos.length === 0 ? (
              <p className="text-green-600 text-sm">Nenhum produto com estoque crítico! 🎉</p>
            ) : (
              <ul className="space-y-3">
                {produtosCriticos.map(p => {
                  const total = p.variacoes.length;
                  const indisponiveis = p.variacoes.filter(v => v.estoque === 0).length;
                  const disponiveis = total - indisponiveis;
                                    const porcentagem = Math.round((disponiveis / total) * 100);

                  let cor = "bg-red-400";
                  if (porcentagem >= 80) cor = "bg-green-400";
                  else if (porcentagem >= 50) cor = "bg-yellow-400";

                  return (
                    <li key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{p.nome}</p>
                        <p className="text-xs text-gray-500">
                          {indisponiveis} de {total} variações indisponíveis
                        </p>
                      </div>
                      <div className="w-full sm:w-48">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`${cor} h-3 transition-all duration-500`}
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 text-right mt-1">
                          {porcentagem}% disponível
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Gráfico de Vendas */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              📈 Evolução das Vendas ({periodo === "dia" ? "Hoje" : periodo === "7dias" ? "Últimos 7 dias" : "Mês"})
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosGrafico} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                  formatter={value => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6, stroke: "#4F46E5", strokeWidth: 2, fill: "#fff" }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coluna direita - Ranking de Produtos */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              🏆 Produtos Mais Vendidos ({periodo === "dia" ? "Hoje" : periodo === "7dias" ? "Últimos 7 dias" : "Mês"})
            </h3>
            {rankingProdutos.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma venda registrada neste período.</p>
            ) : (
              <ul className="space-y-3">
                {rankingProdutos.map((produto, index) => (
                  <li key={produto.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-600 w-6 text-center">
                        {index + 1}.
                      </span>
                      <p className="text-sm text-gray-700">{produto.nome}</p>
                    </div>
                    <span className="text-sm font-medium text-indigo-600">
                      {produto.quantidadeVendida} vendas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}