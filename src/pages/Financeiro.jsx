import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "react-toastify";
import api from "../services/api";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const percentual = (valor) => `${Number(valor || 0).toFixed(1)}%`;

const dataInput = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const hojeInput = () => dataInput(new Date());

const primeiroDiaMes = () => {
  const hoje = new Date();
  return dataInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
};

const dataCurta = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const dataHora = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const inputClass =
  "w-full rounded-lg border border-[#E5DED2] bg-[#FFFEFA] px-3 py-2.5 text-base outline-none transition placeholder:text-slate-400 focus:border-[#16A36B] focus:bg-white sm:text-sm";

const periodos = [
  { value: "hoje", label: "Hoje" },
  { value: "7dias", label: "7 dias" },
  { value: "mes", label: "Mês" },
  { value: "personalizado", label: "Período" },
];

const formasPagamento = ["dinheiro", "pix", "cartao", "boleto", "transferencia", "outro"];
const categoriasEntrada = ["recebimento", "venda externa", "ajuste", "reembolso", "outro"];
const categoriasSaida = ["fornecedor", "aluguel", "frete", "taxa", "funcionario", "marketing", "outro"];

const statusClasses = {
  pago: "bg-[#16A36B]/10 text-[#020C2C]",
  pendente: "bg-amber-50 text-amber-700",
  vencido: "bg-rose-50 text-rose-700",
};

const formInicial = (tipo = "saida") => ({
  tipo,
  valor: "",
  descricao: "",
  categoria: tipo === "saida" ? "fornecedor" : "recebimento",
  formaPagamento: "pix",
  status: "pago",
  data: hojeInput(),
  vencimento: "",
  clienteId: "",
});

export default function Financeiro() {
  const [dados, setDados] = useState(null);
  const [dadosLucro, setDadosLucro] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoLucro, setCarregandoLucro] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aba, setAba] = useState("financeiro");
  const [periodo, setPeriodo] = useState("mes");
  const [inicio, setInicio] = useState(primeiroDiaMes());
  const [fim, setFim] = useState(hojeInput());
  const [modalLancamentoAberto, setModalLancamentoAberto] = useState(false);
  const [form, setForm] = useState(formInicial("saida"));

  async function carregarFinanceiro() {
    if (periodo === "personalizado" && (!inicio || !fim)) return;

    try {
      setCarregando(true);
      const params = { periodo };
      if (periodo === "personalizado") {
        params.inicio = inicio;
        params.fim = fim;
      }
      const { data } = await api.get("/financeiro", { params });
      setDados(data);
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
      toast.error(error.response?.data?.error || "Erro ao carregar financeiro.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarLucro() {
    if (periodo === "personalizado" && (!inicio || !fim)) return;

    try {
      setCarregandoLucro(true);
      const params = { periodo: periodo === "hoje" ? "dia" : periodo };
      if (periodo === "personalizado") {
        params.inicio = inicio;
        params.fim = fim;
      }
      const { data } = await api.get("/relatorios/lucro", { params });
      setDadosLucro(data);
    } catch (error) {
      console.error("Erro ao carregar lucro:", error);
      toast.error(error.response?.data?.error || "Erro ao carregar lucro bruto.");
    } finally {
      setCarregandoLucro(false);
    }
  }

  async function carregarClientes() {
    try {
      const { data } = await api.get("/clientes");
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      setClientes([]);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    carregarFinanceiro();
    carregarLucro();
  }, [periodo, inicio, fim]);

  const resumo = dados?.resumo || {};
  const lancamentos = dados?.lancamentos || [];
  const contasReceber = dados?.contasReceber || [];
  const pagamentos = useMemo(() => Object.entries(dados?.porPagamento || {}), [dados]);
  const categorias = form.tipo === "saida" ? categoriasSaida : categoriasEntrada;

  function abrirLancamento(tipo = "saida") {
    setForm(formInicial(tipo));
    setModalLancamentoAberto(true);
  }

  function atualizarForm(campo, valor) {
    setForm((prev) => {
      const proximo = { ...prev, [campo]: valor };
      if (campo === "tipo") {
        proximo.categoria = valor === "saida" ? "fornecedor" : "recebimento";
        proximo.status = valor === "saida" ? "pago" : prev.status;
      }
      return proximo;
    });
  }

  async function recarregarTudo() {
    await Promise.all([carregarFinanceiro(), carregarLucro()]);
  }

  async function salvarLancamento(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      await api.post("/financeiro/lancamentos", {
        ...form,
        clienteId: form.clienteId || null,
        vencimento: form.vencimento || null,
      });
      toast.success("Lançamento registrado.");
      setModalLancamentoAberto(false);
      setForm(formInicial(form.tipo));
      await recarregarTudo();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao salvar lançamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function marcarPago(id) {
    try {
      await api.patch(`/financeiro/lancamentos/${id}/pagar`);
      toast.success("Conta marcada como paga.");
      await recarregarTudo();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao marcar como pago.");
    }
  }

  async function removerLancamento(id) {
    try {
      await api.delete(`/financeiro/lancamentos/${id}`);
      toast.success("Lançamento removido.");
      await recarregarTudo();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao remover lançamento.");
    }
  }

  if (carregando && !dados) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F7F5EF]">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#020C2C]" />
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando financeiro...</p>
      </div>
    );
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="lojia-hero-panel mb-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Financeiro da loja</h1>
          <p className="mt-1 text-sm text-white/68">
            Acompanhe vendas, despesas, recebimentos, contas pendentes e lucro bruto.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3">
          <p className="text-xs font-medium uppercase text-white/62">
            {aba === "lucro" ? "Lucro bruto" : "Saldo estimado"}
          </p>
          <p className="mt-1 text-3xl font-semibold text-white">
            {aba === "lucro" ? moeda(dadosLucro?.resumo?.lucro) : moeda(resumo.saldoEstimado)}
          </p>
        </div>
      </div>

      <section className="lojia-surface mb-6 p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {[
                { value: "financeiro", label: "Financeiro" },
                { value: "lucro", label: "Lucro bruto" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAba(item.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    aba === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {periodos.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriodo(item.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    periodo === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {periodo === "personalizado" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={inputClass} />
                <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className={inputClass} />
              </div>
            )}

            {aba === "financeiro" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => abrirLancamento("saida")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#020C2C] px-4 text-sm font-semibold text-white transition hover:bg-[#081743]"
                >
                  <Plus size={17} /> Despesa
                </button>
                <button
                  type="button"
                  onClick={() => abrirLancamento("entrada")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  <Plus size={17} /> Entrada
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {aba === "financeiro" ? (
        <FinanceiroResumo
          resumo={resumo}
          lancamentos={lancamentos}
          contasReceber={contasReceber}
          pagamentos={pagamentos}
          onPagar={marcarPago}
          onRemover={removerLancamento}
        />
      ) : (
        <LucroResumo dados={dadosLucro} carregando={carregandoLucro} />
      )}

      {modalLancamentoAberto && (
        <LancamentoModal
          form={form}
          clientes={clientes}
          categorias={categorias}
          salvando={salvando}
          onChange={atualizarForm}
          onSubmit={salvarLancamento}
          onClose={() => setModalLancamentoAberto(false)}
        />
      )}
    </div>
  );
}

function FinanceiroResumo({ resumo, lancamentos, contasReceber, pagamentos, onPagar, onRemover }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Faturamento" value={moeda(resumo.faturamento)} icon={ReceiptText} destaque />
        <StatCard label="Recebido" value={moeda(resumo.recebido)} icon={ArrowDownLeft} />
        <StatCard label="A receber" value={moeda(resumo.aReceber)} icon={Clock3} />
        <StatCard label="Despesas" value={moeda(resumo.despesas)} icon={ArrowUpRight} danger />
        <StatCard label="Custo produtos" value={moeda(resumo.custoProdutos)} icon={Wallet} />
        <StatCard label="Lucro bruto" value={moeda(resumo.lucroBruto)} icon={Banknote} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="lojia-surface overflow-hidden">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-950">Lançamentos</h2>
              <p className="text-sm text-slate-500">
                Vendas entram automaticamente. Use os botões acima para despesas, entradas e recebíveis.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {lancamentos.length > 0 ? (
                lancamentos.map((item) => (
                  <LancamentoItem key={item.id} item={item} onPagar={onPagar} onRemover={onRemover} />
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">Nenhum lançamento no período.</div>
              )}
            </div>
          </section>

          <section className="lojia-surface overflow-hidden">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-950">Contas a receber</h2>
              <p className="text-sm text-slate-500">Recebimentos pendentes até o fim do período selecionado.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {contasReceber.length > 0 ? (
                contasReceber.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{item.descricao}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.cliente?.nome || "Sem cliente"} | vence {dataCurta(item.vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClasses[item.status] || statusClasses.pendente}`}>
                        {item.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-950">{moeda(item.valor)}</span>
                      <button
                        type="button"
                        onClick={() => onPagar(item.id)}
                        className="inline-flex h-8 items-center rounded-lg bg-[#16A36B] px-3 text-xs font-semibold text-white"
                      >
                        Recebido
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">Nenhuma conta a receber pendente.</div>
              )}
            </div>
          </section>
        </div>

        <aside className="lojia-surface p-5">
          <h2 className="text-base font-semibold text-slate-950">Formas de pagamento</h2>
          <div className="mt-4 space-y-2">
            {pagamentos.length > 0 ? (
              pagamentos.map(([forma, valor]) => (
                <div key={forma} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    <CreditCard size={15} /> {forma}
                  </span>
                  <span className="font-semibold text-slate-950">{moeda(valor)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhum recebimento no período.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function LucroResumo({ dados, carregando }) {
  const resumo = dados?.resumo || {};
  const vendas = dados?.vendas || [];

  if (carregando && !dados) {
    return (
      <div className="lojia-surface flex min-h-[320px] items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#020C2C]" />
          <p className="mt-4 text-sm font-medium text-slate-600">Calculando lucro bruto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lucro bruto" value={moeda(resumo.lucro)} icon={Banknote} destaque />
        <StatCard label="Receita produtos" value={moeda(resumo.receitaProdutos)} icon={ArrowDownLeft} />
        <StatCard label="Custo produtos" value={moeda(resumo.custoProdutos)} icon={Wallet} />
        <StatCard label="Margem" value={percentual(resumo.margem)} icon={ReceiptText} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <section className="lojia-surface p-5">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Lucro por dia</h2>
              <p className="text-sm text-slate-500">Receita de produtos menos custo das mercadorias.</p>
            </div>
            <p className="text-sm font-semibold text-slate-700">{moeda(resumo.lucro)}</p>
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
                formatter={(value) => moeda(value)}
              />
              <Bar dataKey="lucro" fill="#020C2C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <aside className="lojia-surface p-5">
          <h2 className="text-base font-semibold text-slate-950">Composição</h2>
          <div className="mt-4 space-y-3 text-sm">
            <LinhaResumo label="Faturamento total" value={moeda(resumo.faturamento)} />
            <LinhaResumo label="Subtotal produtos" value={moeda(resumo.subtotalProdutos)} />
            <LinhaResumo label="Descontos" value={`- ${moeda(resumo.descontos)}`} />
            <LinhaResumo label="Taxas de entrega" value={moeda(resumo.taxasEntrega)} />
            <LinhaResumo label="Custo mercadorias" value={`- ${moeda(resumo.custoProdutos)}`} />
            <div className="border-t border-slate-200 pt-3">
              <LinhaResumo label="Vendas analisadas" value={resumo.vendas || 0} strong />
              <LinhaResumo label="Lucro bruto" value={moeda(resumo.lucro)} strong />
            </div>
          </div>
        </aside>
      </div>

      <section className="lojia-surface overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-950">Vendas no cálculo</h2>
          <p className="text-sm text-slate-500">As vendas antigas usam o custo atual do produto como fallback.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
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
              {vendas.map((venda) => (
                <tr key={venda.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-950">#{venda.id}</td>
                  <td className="px-4 py-3 text-slate-500">{dataHora(venda.data)}</td>
                  <td className="px-4 py-3 text-slate-700">{venda.cliente}</td>
                  <td className="px-4 py-3 text-slate-700">{moeda(venda.receitaProdutos)}</td>
                  <td className="px-4 py-3 text-slate-700">{moeda(venda.custoProdutos)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-950">{moeda(venda.lucro)}</td>
                  <td className="px-4 py-3 text-slate-700">{percentual(venda.margem)}</td>
                </tr>
              ))}
              {vendas.length === 0 && (
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

function LancamentoModal({ form, clientes, categorias, salvando, onChange, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              {form.tipo === "saida" ? "Lançar despesa" : "Lançar entrada"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Registre uma despesa, entrada manual ou conta a receber.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            aria-label="Fechar lançamento"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div>
            <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Tipo</span>
            <div className="grid grid-cols-2 rounded-lg border border-[#E5DED2] bg-[#FFFEFA] p-1">
              {[
                { value: "entrada", label: "Entrada" },
                { value: "saida", label: "Saída" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange("tipo", item.value)}
                  className={`rounded-md px-2 py-2 text-sm font-semibold transition ${
                    form.tipo === item.value ? "bg-[#020C2C] text-white" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label>
            <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Descrição</span>
            <input
              value={form.descricao}
              onChange={(e) => onChange("descricao", e.target.value)}
              className={inputClass}
              placeholder={form.tipo === "saida" ? "Ex: pagamento fornecedor" : "Ex: parcela cliente"}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Valor</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.valor}
                onChange={(e) => onChange("valor", e.target.value)}
                className={inputClass}
                placeholder="0,00"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Data</span>
              <input type="date" value={form.data} onChange={(e) => onChange("data", e.target.value)} className={inputClass} />
            </label>
          </div>

          <label>
            <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Categoria</span>
            <select value={form.categoria} onChange={(e) => onChange("categoria", e.target.value)} className={inputClass}>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Status</span>
              <select value={form.status} onChange={(e) => onChange("status", e.target.value)} className={inputClass}>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Forma</span>
              <select value={form.formaPagamento} onChange={(e) => onChange("formaPagamento", e.target.value)} className={inputClass}>
                {formasPagamento.map((forma) => (
                  <option key={forma} value={forma}>
                    {forma}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {form.status === "pendente" && (
            <label>
              <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Vencimento</span>
              <input type="date" value={form.vencimento} onChange={(e) => onChange("vencimento", e.target.value)} className={inputClass} />
            </label>
          )}

          <label>
            <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Cliente</span>
            <select value={form.clienteId} onChange={(e) => onChange("clienteId", e.target.value)} className={inputClass}>
              <option value="">Sem cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-2 border-t border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:p-5">
          <button
            type="submit"
            disabled={salvando}
            className="lojia-primary-action inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-60"
          >
            <Plus size={17} /> {salvando ? "Salvando..." : "Salvar lançamento"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, destaque = false, danger = false }) {
  return (
    <div className={`lojia-surface p-4 ${destaque ? "border-[#020C2C]" : ""}`}>
      <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <Icon size={15} className={danger ? "text-rose-600" : "text-[#16A36B]"} />
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function LancamentoItem({ item, onPagar, onRemover }) {
  const saida = item.tipo === "saida";
  const Icon = saida ? ArrowUpRight : ArrowDownLeft;

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          saida ? "bg-rose-50 text-rose-600" : "bg-[#16A36B]/10 text-[#020C2C]"
        }`}>
          <Icon size={17} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{item.descricao}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {dataCurta(item.data)} | {item.categoria}
            {item.cliente?.nome ? ` | ${item.cliente.nome}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClasses[item.status] || statusClasses.pendente}`}>
          {item.status}
        </span>
        <span className={`text-sm font-semibold ${saida ? "text-rose-600" : "text-slate-950"}`}>
          {saida ? "- " : "+ "}
          {moeda(item.valor)}
        </span>
        {!item.bloqueado && item.status !== "pago" && (
          <button
            type="button"
            onClick={() => onPagar(item.id)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#16A36B]/30 px-2 text-xs font-semibold text-[#020C2C]"
          >
            <CheckCircle2 size={14} /> Pago
          </button>
        )}
        {!item.bloqueado && (
          <button
            type="button"
            onClick={() => onRemover(item.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600"
            aria-label="Remover lançamento"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
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
