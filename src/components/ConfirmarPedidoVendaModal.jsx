import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaCheckCircle, FaCreditCard, FaMoneyBillAlt, FaPercentage, FaTimes } from "react-icons/fa";
import { SiPix } from "react-icons/si";
import EntregadorSelect from "./EntregadorSelect";
import useModalPresence from "../hooks/useModalPresence";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/10 sm:text-sm";

const fieldLabelClass = "mb-1.5 block text-xs font-semibold uppercase text-slate-500";

const panelClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(24,31,36,0.045)]";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 8,
    borderColor: state.isFocused ? "#16A34A" : "#e2e8f0",
    boxShadow: "none",
    fontSize: 16,
    "&:hover": { borderColor: "#16A34A" },
  }),
  menu: (base) => ({ ...base, zIndex: 10001 }),
  menuPortal: (base) => ({ ...base, zIndex: 10001 }),
};

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ConfirmarPedidoVendaModal({ pedido, aoFechar, aoConfirmar, carregando }) {
  useModalPresence();

  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [entregador, setEntregador] = useState(pedido?.entregador || "");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor");

  const itens = pedido?.itens || [];
  const subtotalProdutos = useMemo(
    () => itens.reduce((soma, item) => soma + Number(item.precoUnitario || 0) * Number(item.quantidade || 0), 0),
    [itens]
  );
  const descontoDigitado = Number(String(desconto || "0").replace(",", "."));
  const percentualDesconto = Math.min(Math.max(Number.isFinite(descontoDigitado) ? descontoDigitado : 0, 0), 100);
  const valorEntrega = pedido?.tipoEntrega === "entrega" ? Number(pedido?.taxaEntrega || 0) : 0;
  const totalAntesDesconto = subtotalProdutos + valorEntrega;
  const valorDesconto =
    tipoDesconto === "percentual"
      ? (totalAntesDesconto * percentualDesconto) / 100
      : Math.max(Number.isFinite(descontoDigitado) ? descontoDigitado : 0, 0);
  const descontoAplicado = Math.min(valorDesconto, totalAntesDesconto);
  const totalFinal = Math.max(totalAntesDesconto - descontoAplicado, 0);

  function confirmar() {
    if (!formaPagamento) {
      toast.error("Informe a forma de pagamento.");
      return;
    }

    aoConfirmar({
      formaPagamento,
      desconto: descontoAplicado,
      entregador: pedido?.tipoEntrega === "entrega" ? entregador || null : null,
    });
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4">
      <div className="relative flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-none border border-slate-200/80 bg-[#FFFEFA] shadow-[0_28px_80px_rgba(24,31,36,0.24)] sm:h-auto sm:max-h-[92vh] sm:rounded-[24px]">
        <div className="shrink-0 border-b border-slate-200/80 bg-[#FFFEFA] px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Confirmar venda</h2>
              <p className="mt-1 text-sm text-slate-500">Pedido #{pedido?.id}</p>
            </div>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>

          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#22C55E]" />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F5EF]/50 px-4 py-5 sm:px-6">
          <div className="space-y-4">
            <div className={panelClass}>
              <h3 className="mb-3 text-sm font-semibold text-slate-950">Pagamento</h3>
              <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1">
                {[
                  { value: "pix", label: "Pix", icon: <SiPix /> },
                  { value: "dinheiro", label: "Dinheiro", icon: <FaMoneyBillAlt /> },
                  { value: "cartao", label: "Cartão", icon: <FaCreditCard /> },
                ].map((opcao) => (
                  <button
                    key={opcao.value}
                    type="button"
                    onClick={() => setFormaPagamento(opcao.value)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-medium transition ${
                      formaPagamento === opcao.value
                        ? "bg-[#0B1115] text-white shadow-[0_10px_20px_rgba(24,31,36,0.12)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span className="text-base">{opcao.icon}</span>
                    {opcao.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <FaPercentage /> Desconto
                </span>
                <div className="flex rounded-full bg-slate-100 p-0.5 text-xs font-medium">
                  {[
                    { value: "valor", label: "R$" },
                    { value: "percentual", label: "%" },
                  ].map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => setTipoDesconto(opcao.value)}
                      className={`rounded-full px-2.5 py-1 transition ${
                        tipoDesconto === opcao.value
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                inputMode="decimal"
                placeholder={tipoDesconto === "percentual" ? "Ex: 10" : "Ex: 5,00"}
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className={`${inputClass} mt-3`}
              />
              {tipoDesconto === "percentual" && desconto && (
                <p className="mt-2 text-xs text-slate-500">Desconto calculado: {moeda(descontoAplicado)}</p>
              )}
            </div>

            {pedido?.tipoEntrega === "entrega" && (
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                  <span className={fieldLabelClass}>Taxa</span>
                  <p className="text-sm font-semibold text-slate-950">{moeda(valorEntrega)}</p>
                </div>
                <div>
                  <span className={fieldLabelClass}>Entregador</span>
                  <EntregadorSelect value={entregador} onChange={setEntregador} selectStyles={selectStyles} />
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
              <div className="border-b border-slate-200/80 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-950">Itens do pedido</h3>
              </div>
              <div className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
                {itens.map((item) => (
                  <div key={item.id} className="px-4 py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="min-w-0 truncate text-slate-800">
                        {item.variacaoProduto?.produto?.nome || item.nomeManual || item.nome || "Produto"}{" "}
                        {item.variacaoProduto?.numeracao || item.numeracaoManual
                          ? `(Tam. ${item.variacaoProduto?.numeracao || item.numeracaoManual})`
                          : ""}
                      </span>
                      <span className="shrink-0 font-medium text-slate-950">
                        {moeda(Number(item.precoUnitario || 0) * Number(item.quantidade || 0))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Qtd. {item.quantidade}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-[#0B1115] p-4 text-sm text-white shadow-[0_16px_34px_rgba(24,31,36,0.14)]">
              <div className="flex justify-between">
                <span className="text-white/62">Produtos</span>
                <span>{moeda(subtotalProdutos)}</span>
              </div>
              {pedido?.tipoEntrega === "entrega" && (
                <div className="mt-2 flex justify-between">
                  <span className="text-white/62">Entrega</span>
                  <span>{moeda(valorEntrega)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between">
                <span className="text-white/62">Desconto</span>
                <span>- {moeda(descontoAplicado)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-xl font-semibold">
                <span>Total</span>
                <span>{moeda(totalFinal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(22,163,74,0.22)] transition hover:bg-[#0B1115] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Processando..." : "Lançar venda"}
              {!carregando && <FaCheckCircle />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
