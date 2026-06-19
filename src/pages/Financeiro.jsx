import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  FileDown,
  Landmark,
  Plus,
  ReceiptText,
  Send,
  Settings,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const numero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return 0;
  const convertido = Number(String(valor).replace(",", "."));
  return Number.isFinite(convertido) ? convertido : 0;
};

const dataInput = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const hojeInput = () => dataInput(new Date());

const mesInput = (data = new Date()) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
};

const inicioMesInput = (valor) => {
  const [ano, mes] = String(valor || mesInput()).split("-").map(Number);
  return `${ano}-${String(mes).padStart(2, "0")}-01`;
};

const fimMesInput = (valor) => {
  const [ano, mes] = String(valor || mesInput()).split("-").map(Number);
  return dataInput(new Date(ano, mes, 0));
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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-base outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:bg-white sm:text-sm";

const abas = [
  { value: "resumo", label: "Resumo" },
  { value: "caixa", label: "Caixa" },
  { value: "contas", label: "Contas" },
  { value: "despesas", label: "Despesas" },
  { value: "receber", label: "A receber" },
  { value: "relatorios", label: "Relatorios" },
];

const formasPagamento = ["dinheiro", "pix", "debito", "credito", "a_prazo", "transferencia"];
const categoriasDespesa = ["fornecedor", "aluguel", "funcionario", "embalagem", "entrega", "anuncio", "taxa", "outro"];

const statusClasses = {
  pago: "bg-slate-100 text-slate-700",
  pendente: "bg-amber-50 text-amber-700",
  vencido: "bg-rose-50 text-rose-700",
};

const formLancamentoInicial = (tipo = "saida", contaId = "") => ({
  tipo,
  contaId,
  valor: "",
  descricao: "",
  categoria: tipo === "saida" ? "fornecedor" : "recebimento",
  formaPagamento: tipo === "saida" ? "transferencia" : "pix",
  status: "pago",
  data: hojeInput(),
  vencimento: "",
});

const formTransferenciaInicial = () => ({
  contaOrigemId: "",
  contaDestinoId: "",
  valor: "",
  descricao: "Transferencia entre contas",
  data: hojeInput(),
});

const formRecorrenteInicial = (contaId = "") => ({
  contaId,
  descricao: "",
  categoria: "fornecedor",
  valor: "",
  formaPagamento: "transferencia",
  diaVencimento: "5",
});

const formContaInicial = () => ({
  nome: "",
  tipo: "banco",
  saldoInicial: "",
});

export default function Financeiro() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aba, setAba] = useState("resumo");
  const [mesBusca, setMesBusca] = useState(mesInput());
  const [caixaData, setCaixaData] = useState(hojeInput());
  const [modal, setModal] = useState(null);
  const [formLancamento, setFormLancamento] = useState(formLancamentoInicial("saida"));
  const [formTransferencia, setFormTransferencia] = useState(formTransferenciaInicial());
  const [formRecorrente, setFormRecorrente] = useState(formRecorrenteInicial());
  const [formConta, setFormConta] = useState(formContaInicial());
  const [configForm, setConfigForm] = useState({});

  async function carregarFinanceiro() {
    try {
      setCarregando(true);
      const mesPeriodo = aba === "caixa" ? String(caixaData || hojeInput()).slice(0, 7) : mesBusca;
      const params = {
        periodo: "personalizado",
        inicio: inicioMesInput(mesPeriodo),
        fim: fimMesInput(mesPeriodo),
        caixaData,
      };
      const { data } = await api.get("/financeiro", { params });
      setDados(data);
      setConfigForm({
        taxaDebito: data.configuracao?.taxaDebito ?? 0,
        prazoDebitoDias: data.configuracao?.prazoDebitoDias ?? 1,
        taxaCredito: data.configuracao?.taxaCredito ?? 0,
        prazoCreditoDias: data.configuracao?.prazoCreditoDias ?? 30,
        parcelasCreditoMax: data.configuracao?.parcelasCreditoMax ?? 6,
        contaDinheiroId: data.configuracao?.contaDinheiroId || "",
        contaPixId: data.configuracao?.contaPixId || "",
        contaDebitoId: data.configuracao?.contaDebitoId || "",
        contaCreditoId: data.configuracao?.contaCreditoId || "",
        contaPrazoId: data.configuracao?.contaPrazoId || "",
      });
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
      toast.error(error.response?.data?.error || "Erro ao carregar financeiro.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFinanceiro();
  }, [mesBusca, caixaData, aba]);

  const contas = dados?.contas || [];
  const resumo = dados?.resumo || {};
  const caixaConta = dados?.caixaHoje?.conta;
  const contaCaixaId = caixaConta?.id || contas.find((conta) => conta.tipo === "caixa")?.id || "";
  const contaReceberId = contas.find((conta) => conta.tipo === "receber")?.id || "";

  const contasAtivas = useMemo(() => contas.filter((conta) => conta.ativo), [contas]);

  function abrirLancamento(tipo = "saida", preset = {}) {
    setFormLancamento({ ...formLancamentoInicial(tipo, preset.contaId || ""), ...preset });
    setModal("lancamento");
  }

  function abrirTransferencia(preset = {}) {
    setFormTransferencia({ ...formTransferenciaInicial(), ...preset });
    setModal("transferencia");
  }

  function abrirRecorrente(preset = {}) {
    setFormRecorrente({ ...formRecorrenteInicial(preset.contaId || ""), ...preset });
    setModal("recorrente");
  }

  async function recarregarDepois() {
    await carregarFinanceiro();
  }

  async function salvarLancamento(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      await api.post("/financeiro/lancamentos", {
        ...formLancamento,
        contaId: formLancamento.contaId || null,
        vencimento: formLancamento.vencimento || null,
      });
      toast.success(formLancamento.tipo === "saida" ? "Despesa registrada." : "Entrada registrada.");
      setModal(null);
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao salvar lancamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTransferencia(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      await api.post("/financeiro/transferencias", formTransferencia);
      toast.success("Transferencia registrada.");
      setModal(null);
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao transferir.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarRecorrente(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      await api.post("/financeiro/recorrentes", {
        ...formRecorrente,
        contaId: formRecorrente.contaId || null,
      });
      toast.success("Despesa recorrente criada.");
      setModal(null);
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao criar recorrencia.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarConta(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      await api.post("/financeiro/contas", formConta);
      toast.success("Conta criada.");
      setModal(null);
      setFormConta(formContaInicial());
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao criar conta.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarConfig(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      await api.put("/financeiro/configuracao", configForm);
      toast.success("Configuracoes financeiras salvas.");
      setModal(null);
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao salvar configuracoes.");
    } finally {
      setSalvando(false);
    }
  }

  async function marcarPago(id) {
    try {
      await api.patch(`/financeiro/lancamentos/${id}/pagar`);
      toast.success("Lancamento marcado como pago.");
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao marcar como pago.");
    }
  }

  async function removerLancamento(id) {
    try {
      await api.delete(`/financeiro/lancamentos/${id}`);
      toast.success("Lancamento removido.");
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao remover lancamento.");
    }
  }

  if (carregando && !dados) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5EF]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B1115]" />
        <p className="mt-4 text-sm font-medium text-slate-600">Carregando financeiro...</p>
      </div>
    );
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <header className="mb-5 rounded-[18px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.035)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Gestao financeira</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Financeiro</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Veja o dinheiro entrando, saindo e ficando na loja sem transformar isso em planilha.</p>
          </div>

          <div className="flex flex-col gap-2 sm:min-w-[250px] sm:flex-row sm:items-end">
            {aba === "caixa" ? (
              <label className="flex-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Dia do caixa</span>
                <input
                  type="date"
                  value={caixaData}
                  onChange={(event) => setCaixaData(event.target.value || hojeInput())}
                  className={inputClass}
                />
              </label>
            ) : (
              <label className="flex-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Mes</span>
                <input
                  type="month"
                  value={mesBusca}
                  onChange={(event) => setMesBusca(event.target.value || mesInput())}
                  className={inputClass}
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => (aba === "caixa" ? setCaixaData(hojeInput()) : setMesBusca(mesInput()))}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {aba === "caixa" ? "Hoje" : "Mes atual"}
            </button>
          </div>
        </div>
      </header>

      <section className="mb-5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 p-1 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
        <div className="grid min-w-[680px] grid-cols-6 gap-1">
          {abas.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setAba(item.value)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                aba === item.value
                  ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.12)]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {aba === "resumo" && (
        <ResumoFinanceiro
          resumo={resumo}
          contas={contas}
          pagamentos={dados?.porPagamento || []}
          onDespesa={() => abrirLancamento("saida")}
          onEntrada={() => abrirLancamento("entrada")}
          onConfig={() => setModal("config")}
        />
      )}

      {aba === "caixa" && (
        <CaixaFinanceiro
          caixa={dados?.caixaHoje}
          onReforco={() => abrirLancamento("entrada", { contaId: contaCaixaId, categoria: "reforco", descricao: "Reforco de caixa", formaPagamento: "dinheiro" })}
          onSangria={() => abrirLancamento("saida", { contaId: contaCaixaId, categoria: "sangria", descricao: "Sangria de caixa", formaPagamento: "dinheiro" })}
          onTransferir={() => abrirTransferencia({ contaOrigemId: contaCaixaId })}
        />
      )}

      {aba === "contas" && (
        <ContasFinanceiras
          contas={contas}
          onNovaConta={() => setModal("conta")}
          onTransferir={abrirTransferencia}
        />
      )}

      {aba === "despesas" && (
        <DespesasFinanceiras
          despesas={dados?.despesas || []}
          recorrentes={dados?.recorrentes || []}
          onDespesa={() => abrirLancamento("saida")}
          onRecorrente={() => abrirRecorrente()}
          onPagar={marcarPago}
          onRemover={removerLancamento}
        />
      )}

      {aba === "receber" && (
        <ReceberFinanceiro
          contasReceber={dados?.contasReceber || []}
          onReceber={marcarPago}
          onNovo={() => abrirLancamento("entrada", { status: "pendente", contaId: contaReceberId, categoria: "a_receber", descricao: "Conta a receber" })}
        />
      )}

      {aba === "relatorios" && <RelatoriosFinanceiros dados={dados} />}

      {modal === "lancamento" && (
        <LancamentoModal
          form={formLancamento}
          contas={contasAtivas}
          salvando={salvando}
          onChange={(campo, valor) => setFormLancamento((prev) => ({ ...prev, [campo]: valor }))}
          onSubmit={salvarLancamento}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "transferencia" && (
        <TransferenciaModal
          form={formTransferencia}
          contas={contasAtivas}
          salvando={salvando}
          onChange={(campo, valor) => setFormTransferencia((prev) => ({ ...prev, [campo]: valor }))}
          onSubmit={salvarTransferencia}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "recorrente" && (
        <RecorrenteModal
          form={formRecorrente}
          contas={contasAtivas}
          salvando={salvando}
          onChange={(campo, valor) => setFormRecorrente((prev) => ({ ...prev, [campo]: valor }))}
          onSubmit={salvarRecorrente}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "conta" && (
        <ContaModal
          form={formConta}
          salvando={salvando}
          onChange={(campo, valor) => setFormConta((prev) => ({ ...prev, [campo]: valor }))}
          onSubmit={salvarConta}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "config" && (
        <ConfigModal
          form={configForm}
          contas={contasAtivas}
          salvando={salvando}
          onChange={(campo, valor) => setConfigForm((prev) => ({ ...prev, [campo]: valor }))}
          onSubmit={salvarConfig}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function ResumoFinanceiro({ resumo, contas, pagamentos, onDespesa, onEntrada, onConfig }) {
  return (
    <div className="space-y-3">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,0.82fr))]">
        <div className="rounded-[22px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.035)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              <ReceiptText size={15} className="text-[#16A34A]" /> Faturamento do mes
            </p>
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              <ActionButton icon={Plus} label="Despesa" onClick={onDespesa} subtle />
              <ActionButton icon={Plus} label="Entrada" onClick={onEntrada} subtle />
              <ActionButton icon={Settings} label="Config." onClick={onConfig} subtle />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{moeda(resumo.faturamento)}</h2>
          <div className="mt-5 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
            <span className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">Recebido {moeda(resumo.recebido)}</span>
            <span className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">Saldo {moeda(resumo.saldoTotal)}</span>
          </div>
        </div>

        <StatCard label="Lucro bruto" value={moeda(resumo.lucroBruto)} icon={Banknote} />
        <StatCard label="Despesas" value={moeda(resumo.despesas)} icon={ArrowUpRight} danger />
        <StatCard label="A receber" value={moeda(resumo.aReceber)} icon={Clock3} />
        <StatCard label="Contas a pagar" value={moeda(resumo.contasPagar)} icon={Wallet} />
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="rounded-[18px] border border-slate-200/70 bg-white/75 p-4 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-950">Contas principais</h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{contas.length} contas</span>
          </div>
          <div className="mt-3">
            <ContasFinanceiras contas={contas.slice(0, 5)} compacto />
          </div>
        </section>

        <section className="rounded-[18px] border border-slate-200/70 bg-white/75 p-4 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
          <h2 className="text-sm font-semibold text-slate-950">Pagamentos</h2>
          <div className="mt-2 divide-y divide-slate-100">
            {pagamentos.length ? (
              pagamentos.map((item) => (
                <div key={item.forma} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-950">{moeda(item.bruto)}</span>
                  </div>
                  {numero(item.taxas) > 0 && (
                    <p className="mt-1 text-xs text-slate-400">
                      Taxas {moeda(item.taxas)} | liquido {moeda(item.liquido)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhum pagamento na busca atual.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
function CaixaFinanceiro({ caixa, onReforco, onSangria, onTransferir }) {
  const movimentos = caixa?.movimentos || [];
  const dataCaixa = caixa?.data ? new Date(caixa.data).toLocaleDateString("pt-BR") : "";

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-[18px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Fechamento do dia</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">{moeda(caixa?.saldoDia)}</h2>
        <p className="mt-1 text-sm text-slate-500">{dataCaixa || "Dia selecionado"}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoTile label="Entradas" value={moeda(caixa?.entradas)} />
          <InfoTile label="Saidas" value={moeda(caixa?.saidas)} />
        </div>
        <div className="mt-3">
          <InfoTile label="Saldo da conta" value={moeda(caixa?.conta?.saldo)} />
        </div>
        <div className="mt-5 grid gap-2">
          <ActionButton icon={ArrowDownLeft} label="Reforco" onClick={onReforco} dark />
          <ActionButton icon={ArrowUpRight} label="Sangria" onClick={onSangria} />
          <ActionButton icon={Send} label="Transferir" onClick={onTransferir} />
        </div>
      </aside>

      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/80 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
        <SectionHeader title="Movimentos do caixa" subtitle="Dinheiro, sangrias e reforcos do dia selecionado." />
        <ListaLancamentos lancamentos={movimentos} vazio="Nenhum movimento no dia selecionado." />
      </section>
    </div>
  );
}

function ContasFinanceiras({ contas, onNovaConta, onTransferir, compacto = false }) {
  return (
    <section className={compacto ? "" : "rounded-[18px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.03)]"}>
      {!compacto && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Contas da loja</h2>
            <p className="text-sm text-slate-500">Caixa, Pix, banco, maquininha e recebiveis.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton icon={Plus} label="Nova conta" onClick={onNovaConta} />
            <ActionButton icon={Send} label="Transferir" onClick={() => onTransferir?.()} dark />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {contas.map((conta) => (
          <div key={conta.id} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
              <Landmark size={14} /> {conta.tipo}
            </p>
            <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{conta.nome}</h3>
            <p className="mt-3 text-xl font-semibold text-slate-950">{moeda(conta.saldo)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DespesasFinanceiras({ despesas, recorrentes, onDespesa, onRecorrente, onPagar, onRemover }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/80 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
        <SectionHeader
          title="Despesas"
          subtitle="Pagas, pendentes e vencidas."
          action={<ActionButton icon={Plus} label="Nova despesa" onClick={onDespesa} dark />}
        />
        <ListaLancamentos lancamentos={despesas} vazio="Nenhuma despesa registrada." onPagar={onPagar} onRemover={onRemover} />
      </section>

      <aside className="rounded-[18px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Recorrentes</h2>
            <p className="text-sm text-slate-500">Geradas automaticamente.</p>
          </div>
          <button type="button" onClick={onRecorrente} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
            <Plus size={16} />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {recorrentes.length ? (
            recorrentes.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200/80 bg-white/70 p-3">
                <p className="text-sm font-semibold text-slate-950">{item.descricao}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Dia {item.diaVencimento} | {moeda(item.valor)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Nenhuma despesa recorrente.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function ReceberFinanceiro({ contasReceber, onReceber, onNovo }) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/80 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
      <SectionHeader
        title="A receber"
        subtitle="Vendas a prazo, parcelas futuras e recebimentos pendentes."
        action={<ActionButton icon={Plus} label="Novo recebivel" onClick={onNovo} dark />}
      />
      <ListaLancamentos lancamentos={contasReceber} vazio="Nada a receber no momento." onPagar={onReceber} />
    </section>
  );
}

function RelatoriosFinanceiros({ dados }) {
  const lancamentos = dados?.lancamentos || [];

  return (
    <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/80 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
      <SectionHeader
        title="Relatorio financeiro"
        subtitle="Tabela detalhada para conferencia e exportacao."
        action={<ActionButton icon={FileDown} label="Salvar PDF" onClick={() => window.print()} />}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descricao</th>
              <th className="px-4 py-3">Conta</th>
              <th className="px-4 py-3">Forma</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lancamentos.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{dataHora(item.data)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{item.descricao}</td>
                <td className="px-4 py-3 text-slate-600">{item.conta?.nome || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{item.formaPagamento || "-"}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className={`px-4 py-3 text-right font-semibold ${item.tipo === "saida" ? "text-rose-600" : "text-slate-950"}`}>
                  {item.tipo === "saida" ? "- " : "+ "}
                  {moeda(item.valor)}
                </td>
              </tr>
            ))}
            {!lancamentos.length && (
              <tr>
                <td colSpan="6" className="px-4 py-10 text-center text-slate-500">Nenhum lancamento na busca atual.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LancamentoModal({ form, contas, salvando, onChange, onSubmit, onClose }) {
  const saida = form.tipo === "saida";

  return (
    <Modal title={saida ? "Lancar despesa" : "Lancar entrada"} subtitle="Registre movimentacoes manuais da loja." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            { value: "entrada", label: "Entrada" },
            { value: "saida", label: "Saida" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange("tipo", item.value)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${form.tipo === item.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Campo label="Descricao" value={form.descricao} onChange={(value) => onChange("descricao", value)} placeholder={saida ? "Ex: fornecedor" : "Ex: recebimento"} autoFocus />
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Valor" value={form.valor} onChange={(value) => onChange("valor", value)} placeholder="0,00" inputMode="decimal" />
          <Campo label="Data" type="date" value={form.data} onChange={(value) => onChange("data", value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Conta" value={form.contaId} onChange={(value) => onChange("contaId", value)}>
            <option value="">Sem conta</option>
            {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
          </SelectCampo>
          <SelectCampo label="Categoria" value={form.categoria} onChange={(value) => onChange("categoria", value)}>
            {(saida ? categoriasDespesa : ["recebimento", "ajuste", "outro"]).map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
          </SelectCampo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Status" value={form.status} onChange={(value) => onChange("status", value)}>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </SelectCampo>
          <SelectCampo label="Forma" value={form.formaPagamento} onChange={(value) => onChange("formaPagamento", value)}>
            {formasPagamento.map((forma) => <option key={forma} value={forma}>{forma}</option>)}
          </SelectCampo>
        </div>
        {form.status === "pendente" && <Campo label="Vencimento" type="date" value={form.vencimento} onChange={(value) => onChange("vencimento", value)} />}
        <ModalActions salvando={salvando} submitLabel="Salvar lancamento" onClose={onClose} />
      </form>
    </Modal>
  );
}

function TransferenciaModal({ form, contas, salvando, onChange, onSubmit, onClose }) {
  return (
    <Modal title="Transferir entre contas" subtitle="Movimente dinheiro sem alterar faturamento." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Sai de" value={form.contaOrigemId} onChange={(value) => onChange("contaOrigemId", value)}>
            <option value="">Selecione</option>
            {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
          </SelectCampo>
          <SelectCampo label="Entra em" value={form.contaDestinoId} onChange={(value) => onChange("contaDestinoId", value)}>
            <option value="">Selecione</option>
            {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
          </SelectCampo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Valor" value={form.valor} onChange={(value) => onChange("valor", value)} placeholder="0,00" inputMode="decimal" />
          <Campo label="Data" type="date" value={form.data} onChange={(value) => onChange("data", value)} />
        </div>
        <Campo label="Descricao" value={form.descricao} onChange={(value) => onChange("descricao", value)} />
        <ModalActions salvando={salvando} submitLabel="Transferir" onClose={onClose} />
      </form>
    </Modal>
  );
}

function RecorrenteModal({ form, contas, salvando, onChange, onSubmit, onClose }) {
  return (
    <Modal title="Despesa recorrente" subtitle="O sistema cria a despesa automaticamente todo mes." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Campo label="Descricao" value={form.descricao} onChange={(value) => onChange("descricao", value)} placeholder="Ex: aluguel" autoFocus />
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Valor" value={form.valor} onChange={(value) => onChange("valor", value)} placeholder="0,00" inputMode="decimal" />
          <Campo label="Dia de vencimento" type="number" min="1" max="31" value={form.diaVencimento} onChange={(value) => onChange("diaVencimento", value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Conta" value={form.contaId} onChange={(value) => onChange("contaId", value)}>
            <option value="">Sem conta</option>
            {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
          </SelectCampo>
          <SelectCampo label="Categoria" value={form.categoria} onChange={(value) => onChange("categoria", value)}>
            {categoriasDespesa.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
          </SelectCampo>
        </div>
        <ModalActions salvando={salvando} submitLabel="Criar recorrencia" onClose={onClose} />
      </form>
    </Modal>
  );
}

function ContaModal({ form, salvando, onChange, onSubmit, onClose }) {
  return (
    <Modal title="Nova conta" subtitle="Separe caixa, banco, maquininha e outros saldos." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Campo label="Nome" value={form.nome} onChange={(value) => onChange("nome", value)} placeholder="Ex: Banco principal" autoFocus />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Tipo" value={form.tipo} onChange={(value) => onChange("tipo", value)}>
            <option value="caixa">Caixa</option>
            <option value="pix">Pix</option>
            <option value="banco">Banco</option>
            <option value="maquininha">Maquininha</option>
            <option value="receber">A receber</option>
          </SelectCampo>
          <Campo label="Saldo inicial" value={form.saldoInicial} onChange={(value) => onChange("saldoInicial", value)} placeholder="0,00" inputMode="decimal" />
        </div>
        <ModalActions salvando={salvando} submitLabel="Criar conta" onClose={onClose} />
      </form>
    </Modal>
  );
}

function ConfigModal({ form, contas, salvando, onChange, onSubmit, onClose }) {
  return (
    <Modal title="Configuracoes financeiras" subtitle="Taxas, prazos e contas padrao dos recebimentos." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Taxa debito (%)" value={form.taxaDebito} onChange={(value) => onChange("taxaDebito", value)} inputMode="decimal" />
          <Campo label="Prazo debito (dias)" type="number" value={form.prazoDebitoDias} onChange={(value) => onChange("prazoDebitoDias", value)} />
          <Campo label="Taxa credito (%)" value={form.taxaCredito} onChange={(value) => onChange("taxaCredito", value)} inputMode="decimal" />
          <Campo label="Prazo credito (dias)" type="number" value={form.prazoCreditoDias} onChange={(value) => onChange("prazoCreditoDias", value)} />
          <Campo label="Parcelas maximas" type="number" value={form.parcelasCreditoMax} onChange={(value) => onChange("parcelasCreditoMax", value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["contaDinheiroId", "Conta dinheiro"],
            ["contaPixId", "Conta Pix"],
            ["contaDebitoId", "Conta debito"],
            ["contaCreditoId", "Conta credito"],
            ["contaPrazoId", "Conta a prazo"],
          ].map(([campo, label]) => (
            <SelectCampo key={campo} label={label} value={form[campo] || ""} onChange={(value) => onChange(campo, value)}>
              <option value="">Padrao do sistema</option>
              {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
            </SelectCampo>
          ))}
        </div>
        <ModalActions salvando={salvando} submitLabel="Salvar configuracoes" onClose={onClose} />
      </form>
    </Modal>
  );
}

function ListaLancamentos({ lancamentos, vazio, onPagar, onRemover }) {
  return (
    <div className="divide-y divide-slate-100">
      {lancamentos.length ? (
        lancamentos.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{item.descricao}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {dataCurta(item.vencimento || item.data)} | {item.conta?.nome || "Sem conta"}{item.cliente?.nome ? ` | ${item.cliente.nome}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <StatusBadge status={item.status} />
              <span className={`text-sm font-semibold ${item.tipo === "saida" ? "text-rose-600" : "text-slate-950"}`}>
                {item.tipo === "saida" ? "- " : "+ "}{moeda(item.valor)}
              </span>
              {onPagar && item.status !== "pago" && (
                <button type="button" onClick={() => onPagar(item.id)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <CheckCircle2 size={14} /> Pago
                </button>
              )}
              {onRemover && ["manual", "recorrente"].includes(item.origem) && (
                <button type="button" onClick={() => onRemover(item.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600" aria-label="Remover">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-sm text-slate-500">{vazio}</div>
      )}
    </div>
  );
}

function Modal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/38 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.18)] sm:rounded-[22px]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Fechar">
            <X size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ salvando, submitLabel, onClose }) {
  return (
    <div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-[1fr_auto]">
      <button type="submit" disabled={salvando} className="lojia-primary-action inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-60">
        <Plus size={17} /> {salvando ? "Salvando..." : submitLabel}
      </button>
      <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        Cancelar
      </button>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", ...props }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span>
      <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={inputClass} {...props} />
    </label>
  );
}

function SelectCampo({ label, value, onChange, children }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {children}
      </select>
    </label>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, destaque = false, danger = false }) {
  return (
    <div
      className={`rounded-[18px] border p-4 transition ${
        destaque
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
          : "border-slate-200/80 bg-white/80 shadow-[0_10px_24px_rgba(15,23,42,0.025)]"
      }`}
    >
      <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] ${destaque ? "text-white/58" : "text-slate-400"}`}>
        <Icon size={15} className={danger ? "text-rose-500" : destaque ? "text-[#22C55E]" : "text-[#16A34A]"} /> {label}
      </p>
      <p className={`mt-2 text-xl font-semibold ${destaque ? "text-white" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, dark = false, subtle = false }) {
  if (subtle) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200/70 bg-white/60 px-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
      >
        <Icon size={13} /> {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
        dark ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.12)] hover:bg-slate-800" : "border border-slate-200 bg-white/80 text-slate-700 hover:bg-white"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClasses[status] || statusClasses.pendente}`}>
      {status}
    </span>
  );
}
