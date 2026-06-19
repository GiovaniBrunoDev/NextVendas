import { CreditCard, Plus, Trash2 } from "lucide-react";

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

export const formasPagamentoMisto = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "debito", label: "Debito" },
  { value: "credito", label: "Credito" },
  { value: "a_prazo", label: "A prazo" },
];

export function novoPagamento(forma = "dinheiro", valor = "") {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    forma,
    valor,
    parcelas: 1,
    auto: true,
  };
}

export function totalPagamentos(pagamentos) {
  return pagamentos.reduce((soma, pagamento) => soma + numero(pagamento.valor), 0);
}

export function pagamentosFecham(pagamentos, total) {
  return Math.abs(totalPagamentos(pagamentos) - Number(total || 0)) <= 0.02;
}

export function normalizarPagamentosPayload(pagamentos) {
  return pagamentos
    .map((pagamento) => ({
      forma: pagamento.forma,
      valor: numero(pagamento.valor),
      parcelas: pagamento.forma === "credito" ? Math.max(1, Number(pagamento.parcelas || 1)) : 1,
    }))
    .filter((pagamento) => pagamento.valor > 0);
}

export function resumoPagamentos(pagamentos) {
  const labels = new Set();
  normalizarPagamentosPayload(pagamentos).forEach((pagamento) => {
    labels.add(formasPagamentoMisto.find((item) => item.value === pagamento.forma)?.label || pagamento.forma);
  });
  return Array.from(labels).join(" + ") || "Nao informado";
}

export default function PagamentoMisto({ total, pagamentos, onChange, parcelasMax = 6 }) {
  const pago = totalPagamentos(pagamentos);
  const restante = Number(total || 0) - pago;
  const fechado = pagamentosFecham(pagamentos, total);
  const pagamentoPrincipal = pagamentos[0] || novoPagamento("dinheiro", Number(total || 0).toFixed(2));
  const pagamentoDividido = pagamentos.length > 1;

  function atualizar(id, campo, valor) {
    onChange(
      pagamentos.map((pagamento) => {
        if (pagamento.id !== id) return pagamento;
        const atualizado = { ...pagamento, [campo]: valor, auto: campo === "valor" ? false : pagamento.auto };
        if (campo === "forma" && valor !== "credito") atualizado.parcelas = 1;
        return atualizado;
      })
    );
  }

  function selecionarForma(forma) {
    onChange(
      pagamentos.map((pagamento, index) => {
        if (index !== 0) return pagamento;
        return {
          ...pagamento,
          forma,
          parcelas: forma === "credito" ? pagamento.parcelas || 1 : 1,
          valor: pagamento.valor || Number(total || 0).toFixed(2),
          auto: true,
        };
      })
    );
  }

  function remover(id) {
    if (pagamentos.length <= 1) return;
    onChange(pagamentos.filter((pagamento) => pagamento.id !== id));
  }

  function adicionar() {
    onChange([...pagamentos, novoPagamento("pix", restante > 0 ? restante.toFixed(2) : "")]);
  }

  function ativarDivisao() {
    if (pagamentoDividido) {
      adicionar();
      return;
    }

    onChange([
      {
        ...pagamentoPrincipal,
        valor: pagamentoPrincipal.valor || Number(total || 0).toFixed(2),
        auto: false,
      },
      novoPagamento("pix", ""),
    ]);
  }

  function preencherRestante(id) {
    const outros = pagamentos
      .filter((pagamento) => pagamento.id !== id)
      .reduce((soma, pagamento) => soma + numero(pagamento.valor), 0);
    const valor = Math.max(Number(total || 0) - outros, 0);
    atualizar(id, "valor", valor.toFixed(2));
  }

  function renderParcelas(pagamento) {
    if (pagamento.forma !== "credito") return null;

    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">Parcelas</span>
        <select
          value={pagamento.parcelas}
          onChange={(event) => atualizar(pagamento.id, "parcelas", event.target.value)}
          className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#16A34A]"
        >
          {Array.from({ length: parcelasMax }, (_, index) => index + 1).map((parcela) => (
            <option key={parcela} value={parcela}>
              {parcela}x
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (!pagamentoDividido) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 sm:grid-cols-5">
          {formasPagamentoMisto.map((forma) => (
            <button
              key={forma.value}
              type="button"
              onClick={() => selecionarForma(forma.value)}
              className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition ${
                pagamentoPrincipal.forma === forma.value
                  ? "bg-[#0B1115] text-white shadow-[0_10px_20px_rgba(24,31,36,0.12)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {forma.label}
            </button>
          ))}
        </div>

        {pagamentoPrincipal.forma === "credito" && (
          <div className="mt-3 max-w-[180px]">{renderParcelas(pagamentoPrincipal)}</div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={ativarDivisao}
            className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <Plus size={14} /> dividir pagamento
          </button>
          <p className="text-sm font-semibold text-slate-950">{moeda(total)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Pagamento dividido</h3>
          <p className="mt-0.5 text-xs text-slate-500">Informe o valor de cada forma.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${fechado ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"}`}>
          {fechado ? "Fechado" : restante > 0 ? `Falta ${moeda(restante)}` : `Excedeu ${moeda(Math.abs(restante))}`}
        </span>
      </div>

      <div className="space-y-2">
        {pagamentos.map((pagamento) => (
          <div key={pagamento.id} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-[#FFFEFA] p-2 sm:grid-cols-[1fr_120px_120px_auto]">
            <select
              value={pagamento.forma}
              onChange={(event) => atualizar(pagamento.id, "forma", event.target.value)}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
            >
              {formasPagamentoMisto.map((forma) => (
                <option key={forma.value} value={forma.value}>
                  {forma.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              inputMode="decimal"
              value={pagamento.valor}
              onChange={(event) => atualizar(pagamento.id, "valor", event.target.value)}
              placeholder="0,00"
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
            />

            {pagamento.forma === "credito" ? (
              <select
                value={pagamento.parcelas}
                onChange={(event) => atualizar(pagamento.id, "parcelas", event.target.value)}
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
              >
                {Array.from({ length: parcelasMax }, (_, index) => index + 1).map((parcela) => (
                  <option key={parcela} value={parcela}>
                    {parcela}x
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => preencherRestante(pagamento.id)}
                className="min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Restante
              </button>
            )}

            <button
              type="button"
              onClick={() => remover(pagamento.id)}
              disabled={pagamentos.length <= 1}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Remover pagamento"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={ativarDivisao}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Plus size={16} /> Outra forma
        </button>
        <div className="flex items-center justify-between gap-3 text-sm sm:justify-end">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <CreditCard size={15} /> Total informado
          </span>
          <strong className="text-slate-950">{moeda(pago)}</strong>
        </div>
      </div>
    </div>
  );
}
