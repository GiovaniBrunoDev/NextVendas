import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const dataHora = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const inputClass =
  "w-full rounded-lg border border-[#E5DED2] bg-[#FFFEFA] px-3 py-2.5 text-base outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:bg-white sm:text-sm";

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="lojia-surface p-4">
      <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <Icon size={15} /> {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default function Caixa() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [abrirForm, setAbrirForm] = useState({ valorInicial: "", observacao: "" });
  const [movimentoForm, setMovimentoForm] = useState({
    tipo: "entrada",
    valor: "",
    descricao: "",
    formaPagamento: "dinheiro",
  });
  const [fecharForm, setFecharForm] = useState({ valorFinalInformado: "", observacao: "" });

  async function carregarCaixa() {
    try {
      setCarregando(true);
      const { data } = await api.get("/caixa/atual");
      setDados(data);
    } catch (error) {
      toast.error("Erro ao carregar caixa.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCaixa();
  }, []);

  const caixa = dados?.caixa || null;
  const resumo = dados?.resumo || {};
  const historico = dados?.historico || [];
  const movimentos = caixa?.movimentos || [];
  const pagamentos = useMemo(() => Object.entries(resumo.porPagamento || {}), [resumo.porPagamento]);

  async function abrirCaixa(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      const { data } = await api.post("/caixa/abrir", abrirForm);
      setDados(data);
      setAbrirForm({ valorInicial: "", observacao: "" });
      toast.success("Caixa aberto com sucesso.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao abrir caixa.");
    } finally {
      setSalvando(false);
    }
  }

  async function lancarMovimento(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      const { data } = await api.post("/caixa/movimentos", movimentoForm);
      setDados(data);
      setMovimentoForm({ tipo: movimentoForm.tipo, valor: "", descricao: "", formaPagamento: "dinheiro" });
      toast.success("Movimento registrado.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao registrar movimento.");
    } finally {
      setSalvando(false);
    }
  }

  async function fecharCaixa(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      const { data } = await api.post("/caixa/fechar", fecharForm);
      setDados(data);
      setFecharForm({ valorFinalInformado: "", observacao: "" });
      toast.success("Caixa fechado.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao fechar caixa.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando caixa...</p>
      </div>
    );
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="lojia-hero-panel mb-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-white/62">Fluxo de caixa</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {caixa ? "Caixa aberto" : "Abrir caixa"}
          </h1>
          <p className="mt-1 text-sm text-white/68">
            {caixa
              ? `Aberto em ${dataHora(caixa.abertoEm)} por ${caixa.abertoPor?.nome || "usuario"}`
              : "Controle entradas, saidas e vendas do turno."}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3">
          <p className="text-xs font-medium uppercase text-white/62">Saldo esperado</p>
          <p className="mt-1 text-3xl font-semibold text-white">{moeda(resumo.saldoEsperado)}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Valor inicial" value={moeda(resumo.valorInicial)} icon={Wallet} />
        <StatCard label="Vendas no caixa" value={moeda(resumo.vendas)} icon={ReceiptText} />
        <StatCard label="Entradas" value={moeda(resumo.entradas)} icon={ArrowDownLeft} />
        <StatCard label="Saidas" value={moeda(resumo.saidas)} icon={ArrowUpRight} />
      </div>

      {!caixa ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
          <form onSubmit={abrirCaixa} className="lojia-surface p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A34A]/10 text-[#0B1115]">
                <Banknote size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Abrir novo caixa</h2>
                <p className="text-sm text-slate-500">Informe o valor inicial do turno.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label>
                <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Valor inicial</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={abrirForm.valorInicial}
                  onChange={(e) => setAbrirForm((prev) => ({ ...prev, valorInicial: e.target.value }))}
                  className={inputClass}
                  placeholder="0,00"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Observacao</span>
                <textarea
                  rows={3}
                  value={abrirForm.observacao}
                  onChange={(e) => setAbrirForm((prev) => ({ ...prev, observacao: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  placeholder="Opcional"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="lojia-primary-action mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              <Plus size={17} /> Abrir caixa
            </button>
          </form>

          <HistoricoCaixa historico={historico} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className="lojia-surface p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Novo movimento</h2>
                  <p className="text-sm text-slate-500">Use para reforco de caixa, retirada ou despesa.</p>
                </div>
              </div>

              <form onSubmit={lancarMovimento} className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_160px_minmax(0,1fr)_160px_auto] lg:items-end">
                <div>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Tipo</span>
                  <div className="grid grid-cols-2 rounded-lg border border-[#E5DED2] bg-[#FFFEFA] p-1">
                    {[
                      { value: "entrada", label: "Entrada" },
                      { value: "saida", label: "Saida" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setMovimentoForm((prev) => ({ ...prev, tipo: item.value }))}
                        className={`rounded-md px-2 py-2 text-sm font-medium transition ${
                          movimentoForm.tipo === item.value
                            ? "bg-[#0B1115] text-white"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Valor</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={movimentoForm.valor}
                    onChange={(e) => setMovimentoForm((prev) => ({ ...prev, valor: e.target.value }))}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Descricao</span>
                  <input
                    value={movimentoForm.descricao}
                    onChange={(e) => setMovimentoForm((prev) => ({ ...prev, descricao: e.target.value }))}
                    className={inputClass}
                    placeholder="Ex: troco, sangria, despesa"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Forma</span>
                  <select
                    value={movimentoForm.formaPagamento}
                    onChange={(e) => setMovimentoForm((prev) => ({ ...prev, formaPagamento: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">Pix</option>
                    <option value="cartao">Cartão</option>
                    <option value="outro">Outro</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={salvando}
                  className="lojia-primary-action h-11 px-4 text-sm font-medium disabled:opacity-60"
                >
                  Lancar
                </button>
              </form>
            </section>

            <section className="lojia-surface overflow-hidden">
              <div className="border-b border-slate-200 p-4">
                <h2 className="text-base font-semibold text-slate-950">Movimentos do caixa</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {movimentos.length > 0 ? (
                  movimentos.map((movimento) => (
                    <div key={movimento.id} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          movimento.tipo === "saida"
                            ? "bg-rose-50 text-rose-600"
                            : movimento.tipo === "venda"
                              ? "bg-[#16A34A]/10 text-[#0B1115]"
                              : "bg-slate-100 text-slate-600"
                        }`}>
                          {movimento.tipo === "saida" ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">{movimento.descricao}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {dataHora(movimento.criadoEm)}
                            {movimento.formaPagamento ? ` | ${movimento.formaPagamento}` : ""}
                          </p>
                        </div>
                      </div>
                      <p className={`shrink-0 text-sm font-semibold ${
                        movimento.tipo === "saida" ? "text-rose-600" : "text-slate-950"
                      }`}>
                        {movimento.tipo === "saida" ? "- " : "+ "}
                        {moeda(movimento.valor)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Nenhum movimento registrado ainda.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="lojia-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#16A34A]/10 text-[#0B1115]">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Resumo do turno</h2>
                  <p className="text-sm text-slate-500">{resumo.quantidadeVendas || 0} vendas registradas</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <LinhaResumo label="Valor inicial" value={moeda(resumo.valorInicial)} />
                <LinhaResumo label="Vendas" value={moeda(resumo.vendas)} />
                <LinhaResumo label="Entradas" value={moeda(resumo.entradas)} />
                <LinhaResumo label="Saidas" value={`- ${moeda(resumo.saidas)}`} />
                <div className="border-t border-slate-200 pt-3">
                  <LinhaResumo label="Saldo esperado" value={moeda(resumo.saldoEsperado)} strong />
                </div>
              </div>

              {pagamentos.length > 0 && (
                <div className="mt-5 rounded-lg border border-slate-200 bg-white/70 p-3">
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">Vendas por pagamento</p>
                  <div className="space-y-1.5 text-sm">
                    {pagamentos.map(([forma, valor]) => (
                      <LinhaResumo key={forma} label={forma} value={moeda(valor)} />
                    ))}
                  </div>
                </div>
              )}
            </section>

            <form onSubmit={fecharCaixa} className="lojia-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <LockKeyhole size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Fechar caixa</h2>
                  <p className="text-sm text-slate-500">Informe o valor conferido no fim do turno.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Valor conferido</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fecharForm.valorFinalInformado}
                    onChange={(e) => setFecharForm((prev) => ({ ...prev, valorFinalInformado: e.target.value }))}
                    className={inputClass}
                    placeholder="0,00"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium uppercase text-slate-500">Observacao</span>
                  <textarea
                    rows={3}
                    value={fecharForm.observacao}
                    onChange={(e) => setFecharForm((prev) => ({ ...prev, observacao: e.target.value }))}
                    className={`${inputClass} resize-none`}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1115] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#131C22] disabled:opacity-60"
              >
                <LockKeyhole size={17} /> Fechar caixa
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function LinhaResumo({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      <span className="capitalize">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}

function HistoricoCaixa({ historico }) {
  return (
    <section className="lojia-surface overflow-hidden">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-950">Últimos caixas fechados</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {historico.length > 0 ? (
          historico.map((caixa) => (
            <div key={caixa.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Clock3 size={17} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">Caixa #{caixa.id}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {dataHora(caixa.abertoEm)} ate {dataHora(caixa.fechadoEm)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-950">{moeda(caixa.valorFinalCalculado)}</p>
                {Number(caixa.diferenca || 0) !== 0 && (
                  <p className="mt-0.5 text-xs text-slate-500">Dif. {moeda(caixa.diferenca)}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            Nenhum fechamento registrado ainda.
          </div>
        )}
      </div>
    </section>
  );
}
