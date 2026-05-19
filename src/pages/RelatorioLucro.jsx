import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaChartLine, FaMoneyBillWave, FaPercentage, FaReceipt } from "react-icons/fa";

const periodos = [
  { value: "dia", label: "Hoje" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "mes", label: "Este mês" },
  { value: "tudo", label: "Todo o período" },
];

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const formatPercent = (valor) => `${Number(valor || 0).toFixed(1)}%`;

const formatDate = (data) =>
  new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RelatorioLucro() {
  const [periodo, setPeriodo] = useState("mes");
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarRelatorio();
  }, [periodo]);

  async function carregarRelatorio() {
    try {
      setCarregando(true);
      const res = await api.get(`/relatorios/lucro?periodo=${periodo}`);
      setDados(res.data);
    } catch (error) {
      console.error("Erro ao carregar lucro:", error);
      toast.error("Erro ao carregar relatório de lucro.");
    } finally {
      setCarregando(false);
    }
  }

  const resumo = dados?.resumo || {};
  const periodoAtual = periodos.find((item) => item.value === periodo)?.label || "Período";

  const cards = useMemo(
    () => [
      {
        label: "Lucro real",
        value: formatCurrency(resumo.lucro),
        icon: <FaChartLine />,
        destaque: true,
      },
      {
        label: "Receita de produtos",
        value: formatCurrency(resumo.receitaProdutos),
        icon: <FaMoneyBillWave />,
      },
      {
        label: "Custo dos produtos",
        value: formatCurrency(resumo.custoProdutos),
        icon: <FaReceipt />,
      },
      {
        label: "Margem",
        value: formatPercent(resumo.margem),
        icon: <FaPercentage />,
      },
    ],
    [resumo]
  );

  if (carregando && !dados) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Calculando lucro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Lucro real</h1>
          <p className="mt-1 text-sm text-slate-500">
            Receita de produtos menos desconto e custo das mercadorias vendidas.
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
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border p-4 shadow-sm ${
              card.destaque
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-950"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  card.destaque ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {card.icon}
              </div>
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide ${card.destaque ? "text-slate-300" : "text-slate-500"}`}>
                  {card.label}
                </p>
                <p className="mt-1 text-xl font-semibold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Lucro por dia</h2>
              <p className="text-sm text-slate-500">{periodoAtual}</p>
            </div>
            <p className="text-sm font-medium text-slate-700">{formatCurrency(resumo.lucro)}</p>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dados?.porDia || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
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
              <Bar dataKey="lucro" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Composição</h2>
          <div className="mt-4 space-y-3 text-sm">
            <LinhaResumo label="Faturamento total" value={formatCurrency(resumo.faturamento)} />
            <LinhaResumo label="Subtotal produtos" value={formatCurrency(resumo.subtotalProdutos)} />
            <LinhaResumo label="Descontos" value={`- ${formatCurrency(resumo.descontos)}`} />
            <LinhaResumo label="Taxas de entrega" value={formatCurrency(resumo.taxasEntrega)} />
            <LinhaResumo label="Custo mercadorias" value={`- ${formatCurrency(resumo.custoProdutos)}`} />
            <div className="border-t border-slate-200 pt-3">
              <LinhaResumo label="Vendas analisadas" value={resumo.vendas || 0} strong />
              <LinhaResumo label="Lucro real" value={formatCurrency(resumo.lucro)} strong />
            </div>
          </div>
        </aside>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-950">Vendas no cálculo</h2>
          <p className="text-sm text-slate-500">As vendas antigas usam o custo atual do produto como fallback.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Receita</th>
                <th className="px-4 py-3">Custo</th>
                <th className="px-4 py-3">Lucro</th>
                <th className="px-4 py-3">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(dados?.vendas || []).map((venda) => (
                <tr key={venda.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-950">#{venda.id}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(venda.data)}</td>
                  <td className="px-4 py-3 text-slate-700">{venda.cliente}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(venda.receitaProdutos)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(venda.custoProdutos)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-950">{formatCurrency(venda.lucro)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatPercent(venda.margem)}</td>
                </tr>
              ))}
              {(dados?.vendas || []).length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                    Nenhuma venda encontrada neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LinhaResumo({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}
