import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
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

const abasPrincipais = [
  { value: "resumo", label: "Resumo" },
  { value: "caixa", label: "Caixa de hoje" },
  { value: "relatorios", label: "Relatórios" },
];

const detalhesFinanceiro = {
  contas: "Onde está o dinheiro",
  despesas: "Contas para pagar",
  receber: "Vendas a receber",
};

const formasPagamento = ["dinheiro", "pix", "debito", "credito", "a_prazo", "transferencia"];
const categoriasDespesa = ["fornecedor", "aluguel", "funcionario", "embalagem", "entrega", "anuncio", "taxa", "outro"];

const formaPagamentoLabels = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  a_prazo: "A prazo",
  transferencia: "Transferência",
};

const categoriaLabels = {
  fornecedor: "Fornecedor",
  aluguel: "Aluguel",
  funcionario: "Funcionário",
  embalagem: "Embalagem",
  entrega: "Entrega",
  anuncio: "Anúncio",
  taxa: "Taxa de cartão",
  recebimento: "Recebimento",
  ajuste: "Ajuste",
  reforco: "Reforço",
  sangria: "Sangria",
  outro: "Outro",
};

const statusLabels = {
  pago: "Pago",
  pendente: "Pendente",
  vencido: "Vencido",
};

const contaTipoLabels = {
  caixa: "Caixa físico",
  pix: "Pix",
  banco: "Banco",
  maquininha: "Maquininha",
  receber: "A receber",
};

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
  descricao: "Transferência entre contas",
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
  const detalheAtual = detalhesFinanceiro[aba];

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
      toast.error(error.response?.data?.error || "Erro ao salvar lançamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTransferencia(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      await api.post("/financeiro/transferencias", formTransferencia);
      toast.success("Transferência registrada.");
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
      toast.success("Despesa fixa criada.");
      setModal(null);
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao criar despesa fixa.");
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
      toast.success("Configurações financeiras salvas.");
      setModal(null);
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao salvar configurações.");
    } finally {
      setSalvando(false);
    }
  }

  async function marcarPago(id) {
    try {
      await api.patch(`/financeiro/lancamentos/${id}/pagar`);
      toast.success("Lançamento marcado como pago.");
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao marcar como pago.");
    }
  }

  async function removerLancamento(id) {
    try {
      await api.delete(`/financeiro/lancamentos/${id}`);
      toast.success("Lançamento removido.");
      await recarregarDepois();
    } catch (error) {
      toast.error(error.response?.data?.error || "Erro ao remover lançamento.");
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
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Dinheiro da loja</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Financeiro</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">Acompanhe vendas recebidas, valores a receber, contas para pagar e saldos da loja.</p>
          </div>

          <div className="flex flex-col gap-2 sm:min-w-[250px] sm:flex-row sm:items-end">
            {aba === "caixa" ? (
              <label className="flex-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Ver dia</span>
                <input
                  type="date"
                  value={caixaData}
                  onChange={(event) => setCaixaData(event.target.value || hojeInput())}
                  className={inputClass}
                />
              </label>
            ) : (
              <label className="flex-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Ver mês</span>
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
              {aba === "caixa" ? "Hoje" : "Mês atual"}
            </button>
          </div>
        </div>
      </header>

      <section className="mb-5 flex flex-wrap items-center gap-2">
        {abasPrincipais.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setAba(item.value)}
            className={`inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
              aba === item.value
                ? "bg-[#11181d] text-white shadow-[0_10px_22px_rgba(15,23,42,0.11)]"
                : "border border-slate-200/80 bg-white/75 text-slate-500 hover:bg-white hover:text-slate-950"
            }`}
          >
            {item.label}
          </button>
        ))}

        {detalheAtual && (
          <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700">
            {detalheAtual}
            <button type="button" onClick={() => setAba("resumo")} className="text-xs font-semibold text-[#16A34A] hover:text-[#138A3D]">
              voltar ao resumo
            </button>
          </div>
        )}
      </section>

      {aba === "resumo" && (
        <ResumoFinanceiro
          resumo={resumo}
          contas={contas}
          pagamentos={dados?.porPagamento || []}
          contasReceber={dados?.contasReceber || []}
          despesas={dados?.despesas || []}
          onDespesa={() => abrirLancamento("saida")}
          onEntrada={() => abrirLancamento("entrada")}
          onConfig={() => setModal("config")}
          onCaixa={() => setAba("caixa")}
          onRelatorio={() => setAba("relatorios")}
          onVerReceber={() => setAba("receber")}
          onVerDespesas={() => setAba("despesas")}
          onVerContas={() => setAba("contas")}
          onReceber={marcarPago}
          onPagar={marcarPago}
          onTransferir={() => abrirTransferencia()}
        />
      )}

      {aba === "caixa" && (
        <CaixaFinanceiro
          caixa={dados?.caixaHoje}
          onReforco={() => abrirLancamento("entrada", { contaId: contaCaixaId, categoria: "reforco", descricao: "Reforço de caixa", formaPagamento: "dinheiro" })}
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

function ResumoFinanceiro({
  resumo,
  contas,
  pagamentos,
  contasReceber = [],
  despesas = [],
  onDespesa,
  onEntrada,
  onConfig,
  onCaixa,
  onRelatorio,
  onVerReceber,
  onVerDespesas,
  onVerContas,
  onReceber,
  onPagar,
  onTransferir,
}) {
  const resultadoMes = numero(resumo.lucroBruto) - numero(resumo.despesas);
  const recebiveisPendentes = ordenarLancamentos(contasReceber.filter((item) => item.status !== "pago"));
  const despesasPendentes = ordenarLancamentos(despesas.filter((item) => item.status !== "pago"));
  const contasVisiveis = contas.filter((conta) => conta.ativo).slice(0, 5);
  const pagamentosVisiveis = pagamentos.filter((item) => numero(item.bruto) > 0).slice(0, 4);
  const recebiveisVencidos = recebiveisPendentes.filter((item) => item.status === "vencido").length;
  const despesasVencidas = despesasPendentes.filter((item) => item.status === "vencido").length;
  const alertaReceber = recebiveisPendentes.length ? `${recebiveisPendentes.length} valor${recebiveisPendentes.length === 1 ? "" : "es"} aguardando recebimento` : "Nada pendente para receber";
  const alertaPagar = despesasPendentes.length ? `${despesasPendentes.length} conta${despesasPendentes.length === 1 ? "" : "s"} para acompanhar` : "Nenhuma conta em aberto";

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-[#148344]">
                <ReceiptText size={14} /> Resultado do mês
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{moeda(resultadoMes)}</h2>
              <p className="mt-1 text-sm text-slate-500">Lucro bruto menos as despesas pagas no mês selecionado.</p>
            </div>

            <div className="flex flex-wrap gap-1.5 lg:justify-end">
              <ActionButton icon={Plus} label="Adicionar despesa" onClick={onDespesa} subtle />
              <ActionButton icon={ArrowDownLeft} label="Adicionar entrada" onClick={onEntrada} subtle />
              <ActionButton icon={Settings} label="Taxas e contas" onClick={onConfig} subtle />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FinanceMetric label="Vendeu" value={moeda(resumo.faturamento)} hint="Total vendido no período." />
            <FinanceMetric label="Entrou" value={moeda(resumo.recebido)} hint="Dinheiro já recebido." />
            <FinanceMetric label="Lucro bruto" value={moeda(resumo.lucroBruto)} hint="Venda menos custo dos produtos." />
            <FinanceMetric label="Saldo disponível" value={moeda(resumo.saldoTotal)} hint="Soma das contas ativas." />
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <DicaFinanceira title="Comece pelas pendências" text={`${alertaReceber}. ${alertaPagar}.`} />
            <DicaFinanceira title="Registre o que saiu" text="Use Adicionar despesa para fornecedor, aluguel, entrega e outras saídas." />
            <DicaFinanceira title="Organize os saldos" text="Use Transferir quando mover dinheiro entre caixa, Pix, banco ou maquininha." />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={onCaixa} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
              Abrir caixa do dia
            </button>
            <button type="button" onClick={onRelatorio} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
              Ver relatorio
            </button>
          </div>
        </div>

        <section className="rounded-[22px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Como recebeu</h2>
              <p className="mt-0.5 text-xs text-slate-500">Resumo por forma de pagamento.</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{pagamentosVisiveis.length} forma{pagamentosVisiveis.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {pagamentosVisiveis.length ? (
              pagamentosVisiveis.map((item) => (
                <div key={item.forma} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-950">{moeda(item.bruto)}</span>
                  </div>
                  {numero(item.taxas) > 0 && (
                    <p className="mt-1 text-xs text-slate-400">Liquido {moeda(item.liquido)} depois das taxas.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">Quando finalizar vendas, os recebimentos aparecem aqui.</p>
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PainelFinanceiro
          icon={Clock3}
          titulo="Vendas a receber"
          valor={moeda(resumo.aReceber)}
          detalhe={`${recebiveisPendentes.length} em aberto${recebiveisVencidos ? `, ${recebiveisVencidos} vencido${recebiveisVencidos === 1 ? "" : "s"}` : ""}`}
          descricao="Valores que ainda precisam cair, como vendas a prazo."
          actionLabel="Abrir"
          onAction={onVerReceber}
        >
          <MiniLancamentos items={recebiveisPendentes.slice(0, 4)} vazio="Tudo certo: não há valores para receber." onPagar={onReceber} pagoLabel="Recebi" />
        </PainelFinanceiro>

        <PainelFinanceiro
          icon={Wallet}
          titulo="Contas para pagar"
          valor={moeda(resumo.contasPagar)}
          detalhe={`${despesasPendentes.length} em aberto${despesasVencidas ? `, ${despesasVencidas} vencida${despesasVencidas === 1 ? "" : "s"}` : ""}`}
          descricao="Despesas pendentes, recorrentes e pagamentos da loja."
          actionLabel="Abrir"
          onAction={onVerDespesas}
          secondaryLabel="Adicionar despesa"
          onSecondary={onDespesa}
        >
          <MiniLancamentos items={despesasPendentes.slice(0, 4)} vazio="Tudo certo: nenhuma conta em aberto." onPagar={onPagar} pagoLabel="Paguei" saida />
        </PainelFinanceiro>

        <PainelFinanceiro
          icon={Landmark}
          titulo="Onde está o dinheiro"
          valor={moeda(resumo.saldoTotal)}
          detalhe={`${contasVisiveis.length} conta${contasVisiveis.length === 1 ? "" : "s"} ativa${contasVisiveis.length === 1 ? "" : "s"}`}
          descricao="Caixa, Pix, banco, maquininha e valores a receber."
          actionLabel="Organizar"
          onAction={onVerContas}
          secondaryLabel="Transferir saldo"
          onSecondary={onTransferir}
        >
          <ListaContasResumo contas={contasVisiveis} />
        </PainelFinanceiro>
      </section>
    </div>
  );
}

function ordenarLancamentos(lancamentos) {
  return [...lancamentos].sort((a, b) => {
    const dataA = new Date(a.vencimento || a.data || 0).getTime() || 0;
    const dataB = new Date(b.vencimento || b.data || 0).getTime() || 0;
    return dataA - dataB;
  });
}

function FinanceMetric({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-xs leading-snug text-slate-400">{hint}</p>}
    </div>
  );
}

function DicaFinanceira({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-3">
      <p className="text-xs font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}

function PainelFinanceiro({ icon: Icon, titulo, valor, detalhe, descricao, actionLabel, onAction, secondaryLabel, onSecondary, children }) {
  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-[#16A34A]">
            <Icon size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-950">{titulo}</h2>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{valor}</p>
            <p className="mt-0.5 text-xs text-slate-500">{detalhe}</p>
            {descricao && <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-slate-400">{descricao}</p>}
          </div>
        </div>
        {actionLabel && (
          <button type="button" onClick={onAction} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
            {actionLabel}
          </button>
        )}
      </div>

      <div className="mt-4">{children}</div>

      {secondaryLabel && (
        <button type="button" onClick={onSecondary} className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950">
          {secondaryLabel}
        </button>
      )}
    </section>
  );
}

function MiniLancamentos({ items, vazio, onPagar, pagoLabel = "Pago", saida = false }) {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">{vazio}</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{item.descricao}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {dataCurta(item.vencimento || item.data)}{item.cliente?.nome ? ` | ${item.cliente.nome}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`text-sm font-semibold ${saida ? "text-slate-950" : "text-[#148344]"}`}>{moeda(item.valor)}</span>
            {onPagar && item.status !== "pago" && (
              <button type="button" onClick={() => onPagar(item.id)} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                {pagoLabel}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaContasResumo({ contas }) {
  if (!contas.length) {
    return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">Nenhuma conta ativa cadastrada.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {contas.map((conta) => (
        <div key={conta.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{conta.nome}</p>
            <p className="mt-0.5 text-xs text-slate-400">{contaTipoLabels[conta.tipo] || conta.tipo}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-slate-950">{moeda(conta.saldo)}</span>
        </div>
      ))}
    </div>
  );
}
function CaixaFinanceiro({ caixa, onReforco, onSangria, onTransferir }) {
  const movimentos = caixa?.movimentos || [];
  const dataCaixa = caixa?.data ? new Date(caixa.data).toLocaleDateString("pt-BR") : "";

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-[18px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Caixa do dia</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">{moeda(caixa?.saldoDia)}</h2>
        <p className="mt-1 text-sm text-slate-500">{dataCaixa || "Dia selecionado"}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoTile label="Entradas" value={moeda(caixa?.entradas)} />
          <InfoTile label="Saídas" value={moeda(caixa?.saidas)} />
        </div>
        <div className="mt-3">
          <InfoTile label="Saldo no caixa" value={moeda(caixa?.conta?.saldo)} />
        </div>
        <div className="mt-5 grid gap-2">
          <ActionButton icon={ArrowDownLeft} label="Adicionar reforço" onClick={onReforco} dark />
          <ActionButton icon={ArrowUpRight} label="Registrar sangria" onClick={onSangria} />
          <ActionButton icon={Send} label="Transferir saldo" onClick={onTransferir} />
        </div>
      </aside>

      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white/80 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
        <SectionHeader title="Movimentos do dia" subtitle="Entradas em dinheiro, sangrias, reforços e transferências." />
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
            <h2 className="text-base font-semibold text-slate-950">Onde está o dinheiro</h2>
            <p className="text-sm text-slate-500">Separe caixa, Pix, banco, maquininha e valores a receber.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton icon={Plus} label="Nova conta" onClick={onNovaConta} />
            <ActionButton icon={Send} label="Transferir saldo" onClick={() => onTransferir?.()} dark />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {contas.map((conta) => (
          <div key={conta.id} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
              <Landmark size={14} /> {contaTipoLabels[conta.tipo] || conta.tipo}
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
          title="Contas para pagar"
          subtitle="Despesas pagas, pendentes e vencidas da loja."
          action={<ActionButton icon={Plus} label="Adicionar despesa" onClick={onDespesa} dark />}
        />
        <ListaLancamentos lancamentos={despesas} vazio="Nenhuma despesa registrada." onPagar={onPagar} onRemover={onRemover} />
      </section>

      <aside className="rounded-[18px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Despesas fixas</h2>
            <p className="text-sm text-slate-500">Criadas automaticamente todo mês.</p>
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
            <p className="text-sm text-slate-500">Nenhuma despesa fixa cadastrada.</p>
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
        title="Vendas a receber"
        subtitle="Vendas a prazo, parcelas futuras e outros valores pendentes."
        action={<ActionButton icon={Plus} label="Adicionar valor a receber" onClick={onNovo} dark />}
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
        title="Relatório financeiro"
        subtitle="Tabela detalhada para conferência e impressão."
        action={<ActionButton icon={FileDown} label="Salvar PDF" onClick={() => window.print()} />}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Lançamento</th>
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
                <td className="px-4 py-3 text-slate-600">{formaPagamentoLabels[item.formaPagamento] || item.formaPagamento || "-"}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className={`px-4 py-3 text-right font-semibold ${item.tipo === "saida" ? "text-rose-600" : "text-slate-950"}`}>
                  {item.tipo === "saida" ? "- " : "+ "}
                  {moeda(item.valor)}
                </td>
              </tr>
            ))}
            {!lancamentos.length && (
              <tr>
                <td colSpan="6" className="px-4 py-10 text-center text-slate-500">Nenhum lançamento na busca atual.</td>
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
    <Modal title={saida ? "Nova despesa" : "Nova entrada"} subtitle={saida ? "Registre dinheiro que saiu da loja." : "Registre dinheiro que entrou fora de uma venda."} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[
            { value: "entrada", label: "Entrada" },
            { value: "saida", label: "Saída" },
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

        <Campo label="Nome do lançamento" value={form.descricao} onChange={(value) => onChange("descricao", value)} placeholder={saida ? "Ex: pagamento fornecedor" : "Ex: recebimento manual"} autoFocus />
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
            {(saida ? categoriasDespesa : ["recebimento", "ajuste", "outro"]).map((categoria) => <option key={categoria} value={categoria}>{categoriaLabels[categoria] || categoria}</option>)}
          </SelectCampo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Status" value={form.status} onChange={(value) => onChange("status", value)}>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </SelectCampo>
          <SelectCampo label="Forma" value={form.formaPagamento} onChange={(value) => onChange("formaPagamento", value)}>
            {formasPagamento.map((forma) => <option key={forma} value={forma}>{formaPagamentoLabels[forma] || forma}</option>)}
          </SelectCampo>
        </div>
        {form.status === "pendente" && <Campo label="Vencimento" type="date" value={form.vencimento} onChange={(value) => onChange("vencimento", value)} />}
        <ModalActions salvando={salvando} submitLabel={saida ? "Salvar despesa" : "Salvar entrada"} onClose={onClose} />
      </form>
    </Modal>
  );
}

function TransferenciaModal({ form, contas, salvando, onChange, onSubmit, onClose }) {
  return (
    <Modal title="Transferir saldo" subtitle="Use quando o dinheiro saiu de uma conta e entrou em outra." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Saiu de" value={form.contaOrigemId} onChange={(value) => onChange("contaOrigemId", value)}>
            <option value="">Selecione</option>
            {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
          </SelectCampo>
          <SelectCampo label="Entrou em" value={form.contaDestinoId} onChange={(value) => onChange("contaDestinoId", value)}>
            <option value="">Selecione</option>
            {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
          </SelectCampo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Valor" value={form.valor} onChange={(value) => onChange("valor", value)} placeholder="0,00" inputMode="decimal" />
          <Campo label="Data" type="date" value={form.data} onChange={(value) => onChange("data", value)} />
        </div>
        <Campo label="Observação" value={form.descricao} onChange={(value) => onChange("descricao", value)} />
        <ModalActions salvando={salvando} submitLabel="Transferir" onClose={onClose} />
      </form>
    </Modal>
  );
}

function RecorrenteModal({ form, contas, salvando, onChange, onSubmit, onClose }) {
  return (
    <Modal title="Despesa fixa" subtitle="O sistema cria essa conta automaticamente todo mês." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Campo label="Nome da despesa" value={form.descricao} onChange={(value) => onChange("descricao", value)} placeholder="Ex: aluguel" autoFocus />
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
            {categoriasDespesa.map((categoria) => <option key={categoria} value={categoria}>{categoriaLabels[categoria] || categoria}</option>)}
          </SelectCampo>
        </div>
        <ModalActions salvando={salvando} submitLabel="Criar despesa fixa" onClose={onClose} />
      </form>
    </Modal>
  );
}

function ContaModal({ form, salvando, onChange, onSubmit, onClose }) {
  return (
    <Modal title="Nova conta" subtitle="Crie uma gaveta para separar caixa, Pix, banco ou maquininha." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Campo label="Nome" value={form.nome} onChange={(value) => onChange("nome", value)} placeholder="Ex: Banco principal" autoFocus />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectCampo label="Tipo" value={form.tipo} onChange={(value) => onChange("tipo", value)}>
            <option value="caixa">{contaTipoLabels.caixa}</option>
            <option value="pix">{contaTipoLabels.pix}</option>
            <option value="banco">{contaTipoLabels.banco}</option>
            <option value="maquininha">{contaTipoLabels.maquininha}</option>
            <option value="receber">{contaTipoLabels.receber}</option>
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
    <Modal title="Taxas e contas padrão" subtitle="Defina para onde cada pagamento entra e quando o cartão deve cair." onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Taxa do débito (%)" value={form.taxaDebito} onChange={(value) => onChange("taxaDebito", value)} inputMode="decimal" />
          <Campo label="Débito cai em (dias)" type="number" value={form.prazoDebitoDias} onChange={(value) => onChange("prazoDebitoDias", value)} />
          <Campo label="Taxa do crédito (%)" value={form.taxaCredito} onChange={(value) => onChange("taxaCredito", value)} inputMode="decimal" />
          <Campo label="Crédito cai em (dias)" type="number" value={form.prazoCreditoDias} onChange={(value) => onChange("prazoCreditoDias", value)} />
          <Campo label="Máximo de parcelas" type="number" value={form.parcelasCreditoMax} onChange={(value) => onChange("parcelasCreditoMax", value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["contaDinheiroId", "Dinheiro entra em"],
            ["contaPixId", "Pix entra em"],
            ["contaDebitoId", "Débito entra em"],
            ["contaCreditoId", "Crédito entra em"],
            ["contaPrazoId", "A prazo entra em"],
          ].map(([campo, label]) => (
            <SelectCampo key={campo} label={label} value={form[campo] || ""} onChange={(value) => onChange(campo, value)}>
              <option value="">Padrão do sistema</option>
              {contas.map((conta) => <option key={conta.id} value={conta.id}>{conta.nome}</option>)}
            </SelectCampo>
          ))}
        </div>
        <ModalActions salvando={salvando} submitLabel="Salvar configurações" onClose={onClose} />
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
                  <CheckCircle2 size={14} /> {item.tipo === "saida" ? "Paguei" : "Recebi"}
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
        className="inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200/70 bg-white/60 px-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
      >
        <Icon size={13} /> {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition ${
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
      {statusLabels[status] || status}
    </span>
  );
}
