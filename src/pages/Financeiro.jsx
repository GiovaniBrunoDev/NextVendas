import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const hojeInput = () => new Date().toISOString().slice(0, 10);

const primeiroDiaMes = () => {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
};

const dataCurta = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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
  pago: "bg-[#16A36B]/10 text-[#11875A]",
  pendente: "bg-amber-50 text-amber-700",
  vencido: "bg-rose-50 text-rose-700",
};

export default function Financeiro() {
  const [dados, setDados] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [periodo, setPeriodo] = useState("mes");
  const [inicio, setInicio] = useState(primeiroDiaMes());
  const [fim, setFim] = useState(hojeInput());
  const [form, setForm] = useState({
    tipo: "saida",
    valor: "",
    descricao: "",
    categoria: "fornecedor",
    formaPagamento: "pix",
    status: "pago",
    data: hojeInput(),
    vencimento: "",
    clienteId: "",
  });

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
  }, [periodo, inicio, fim]);

  const resumo = dados?.resumo || {};
  const lancamentos = dados?.lancamentos || [];
  const contasReceber = dados?.contasReceber || [];
  const pagamentos = useMemo(() => Object.entries(dados?.porPagamento || {}), [dados]);
  const categorias = form.tipo === "saida" ? categoriasSaida : categoriasEntrada;

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
      setForm({
        tipo: form.tipo,
        valor: "",
        descricao: "",
        categoria: form.tipo === "saida" ? "fornecedor" : "recebimento",
        formaPagamento: "pix",
        status: "pago",
        data: hojeInput(),
        vencimento: "",
        clienteId: "",
      });
      await carregarFinanceiro();
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
      await carregarFinanceiro();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao marcar como pago.");
    }
  }

  async function removerLancamento(id) {
    try {
      await api.delete(`/financeiro/lancamentos/${id}`);
      toast.success("Lançamento removido.");
      await carregarFinanceiro();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao remover lançamento.");
    }
  }

  if (carregando && !dados) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F7F5EF]">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#181F24]" />
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
            Acompanhe vendas, despesas, recebimentos e contas pendentes em um só lugar.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3">
          <p className="text-xs font-medium uppercase text-white/62">Saldo estimado</p>
          <p className="mt-1 text-3xl font-semibold text-white">{moeda(resumo.saldoEstimado)}</p>
        </div>
      </div>

      <section className="lojia-surface mb-6 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

          {periodo === "personalizado" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={inputClass} />
              <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className={inputClass} />
            </div>
          )}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Faturamento" value={moeda(resumo.faturamento)} icon={ReceiptText} destaque />
        <StatCard label="Recebido" value={moeda(resumo.recebido)} icon={ArrowDownLeft} />
        <StatCard label="A receber" value={moeda(resumo.aReceber)} icon={Clock3} />
        <StatCard label="Despesas" value={moeda(resumo.despesas)} icon={ArrowUpRight} danger />
        <StatCard label="Custo produtos" value={moeda(resumo.custoProdutos)} icon={Wallet} />
        <StatCard label="Lucro bruto" value={moeda(resumo.lucroBruto)} icon={Banknote} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="lojia-surface overflow-hidden">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-950">Lançamentos</h2>
              <p className="text-sm text-slate-500">Vendas entram automaticamente. Use lançamentos manuais para despesas e recebíveis.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {lancamentos.length > 0 ? (
                lancamentos.map((item) => (
                  <LancamentoItem
                    key={item.id}
                    item={item}
                    onPagar={marcarPago}
                    onRemover={removerLancamento}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  Nenhum lançamento no período.
                </div>
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
                        onClick={() => marcarPago(item.id)}
                        className="inline-flex h-8 items-center rounded-lg bg-[#16A36B] px-3 text-xs font-semibold text-white"
                      >
                        Recebido
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  Nenhuma conta a receber pendente.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <form onSubmit={salvarLancamento} className="lojia-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A36B]/10 text-[#11875A]">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Novo lançamento</h2>
                <p className="text-sm text-slate-500">Registre despesa, entrada manual ou conta a receber.</p>
              </div>
            </div>

            <div className="space-y-3">
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
                      onClick={() => atualizarForm("tipo", item.value)}
                      className={`rounded-md px-2 py-2 text-sm font-semibold transition ${
                        form.tipo === item.value ? "bg-[#181F24] text-white" : "text-slate-600 hover:bg-white"
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
                  onChange={(e) => atualizarForm("descricao", e.target.value)}
                  className={inputClass}
                  placeholder={form.tipo === "saida" ? "Ex: pagamento fornecedor" : "Ex: parcela cliente"}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Valor</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valor}
                    onChange={(e) => atualizarForm("valor", e.target.value)}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Data</span>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => atualizarForm("data", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label>
                <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Categoria</span>
                <select value={form.categoria} onChange={(e) => atualizarForm("categoria", e.target.value)} className={inputClass}>
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Status</span>
                  <select value={form.status} onChange={(e) => atualizarForm("status", e.target.value)} className={inputClass}>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Forma</span>
                  <select value={form.formaPagamento} onChange={(e) => atualizarForm("formaPagamento", e.target.value)} className={inputClass}>
                    {formasPagamento.map((forma) => (
                      <option key={forma} value={forma}>{forma}</option>
                    ))}
                  </select>
                </label>
              </div>

              {form.status === "pendente" && (
                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Vencimento</span>
                  <input
                    type="date"
                    value={form.vencimento}
                    onChange={(e) => atualizarForm("vencimento", e.target.value)}
                    className={inputClass}
                  />
                </label>
              )}

              <label>
                <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Cliente</span>
                <select value={form.clienteId} onChange={(e) => atualizarForm("clienteId", e.target.value)} className={inputClass}>
                  <option value="">Sem cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="lojia-primary-action mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Plus size={17} /> Salvar lançamento
            </button>
          </form>

          <section className="lojia-surface p-5">
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
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, destaque = false, danger = false }) {
  return (
    <div className={`lojia-surface p-4 ${destaque ? "border-[#181F24]" : ""}`}>
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
          saida ? "bg-rose-50 text-rose-600" : "bg-[#16A36B]/10 text-[#11875A]"
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
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#16A36B]/30 px-2 text-xs font-semibold text-[#11875A]"
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
