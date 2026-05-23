import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Pencil, ReceiptText, RefreshCcw, Save, Trash, X } from "lucide-react";
import ReciboModal from "./ReciboModal";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

export default function VendaDetalhesModal({
  venda,
  aberto,
  aoFechar,
  aoExcluir,
  aoTroca,
  aoAtualizar,
}) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [form, setForm] = useState({
    formaPagamento: "",
    tipoEntrega: "",
    taxaEntrega: "",
    entregador: "",
    endereco: "",
    clienteId: "",
  });

  useEffect(() => {
    if (!venda) return;

    setForm({
      formaPagamento: venda.formaPagamento || "",
      tipoEntrega: venda.tipoEntrega || "retirada",
      taxaEntrega: venda.taxaEntrega ?? "",
      entregador: venda.entregador || "",
      endereco: venda.endereco || venda.cliente?.endereco || "",
      clienteId: venda.clienteId || venda.cliente?.id || "",
    });
    setEditando(false);
  }, [venda?.id]);

  if (!venda) return null;

  const formatarData = (data) =>
    new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const salvarEdicao = async () => {
    try {
      setSalvando(true);
      await aoAtualizar({
        formaPagamento: form.formaPagamento,
        tipoEntrega: form.tipoEntrega,
        taxaEntrega: form.tipoEntrega === "entrega" ? form.taxaEntrega : null,
        entregador: form.tipoEntrega === "entrega" ? form.entregador : null,
        endereco: form.tipoEntrega === "entrega" ? form.endereco : null,
        clienteId: form.clienteId || null,
      });
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onClose={aoFechar} className="relative z-50">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
        <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight text-slate-950">
                Venda #{venda.id}
              </Dialog.Title>
              <p className="mt-1 text-sm text-slate-500">{formatarData(venda.data)}</p>
            </div>
            <button
              onClick={aoFechar}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[78vh] overflow-y-auto p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoCard label="Total" value={formatCurrency(venda.total)} strong />
              <InfoCard label="Cliente" value={venda.cliente?.nome || "Não informado"} detail={venda.cliente?.telefone || "-"} />
              <InfoCard label="Pagamento" value={venda.formaPagamento || "N/A"} />
              <InfoCard label="Entrega" value={venda.tipoEntrega || "N/A"} detail={venda.entregador ? `Entregador: ${venda.entregador}` : null} />
              <InfoCard label="Taxa de entrega" value={formatCurrency(venda.taxaEntrega || 0)} />
              <InfoCard label="Endereço" value={venda.endereco || venda.cliente?.endereco || "Não informado"} />
            </div>

            {editando && (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-950">Editar dados da venda</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Pagamento</span>
                    <select
                      value={form.formaPagamento}
                      onChange={(e) => setForm((prev) => ({ ...prev, formaPagamento: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">N/A</option>
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Entrega</span>
                    <select
                      value={form.tipoEntrega}
                      onChange={(e) => setForm((prev) => ({ ...prev, tipoEntrega: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="retirada">Retirada</option>
                      <option value="entrega">Entrega</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Taxa</span>
                    <input
                      type="number"
                      value={form.taxaEntrega}
                      onChange={(e) => setForm((prev) => ({ ...prev, taxaEntrega: e.target.value }))}
                      disabled={form.tipoEntrega !== "entrega"}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Entregador</span>
                    <input
                      type="text"
                      value={form.entregador}
                      onChange={(e) => setForm((prev) => ({ ...prev, entregador: e.target.value }))}
                      disabled={form.tipoEntrega !== "entrega"}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="md:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Endereço</span>
                    <input
                      type="text"
                      value={form.endereco}
                      onChange={(e) => setForm((prev) => ({ ...prev, endereco: e.target.value }))}
                      disabled={form.tipoEntrega !== "entrega"}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                    />
                  </label>
                </div>
              </div>
            )}

            {venda.cliente?.observacoes && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Observação do cliente</p>
                <p className="mt-1">{venda.cliente.observacoes}</p>
              </div>
            )}

            <div className="mt-5">
              <h3 className="mb-3 text-base font-semibold text-slate-950">Itens da venda</h3>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {venda.itens.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {item.variacaoProduto.produto.nome}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Numeração {item.variacaoProduto.numeracao}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {item.quantidade}x
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
            {editando ? (
              <>
                <button
                  onClick={() => setEditando(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  disabled={salvando}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  <Save size={16} /> {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMostrarRecibo(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ReceiptText size={16} /> Recibo
                </button>
                <button
                  onClick={() => setEditando(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={16} /> Editar
                </button>
                <button
                  onClick={() => aoTroca(venda)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw size={16} /> Troca
                </button>
                <button
                  onClick={() => aoExcluir(venda.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                >
                  <Trash size={16} /> Excluir
                </button>
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
      <ReciboModal
        aberto={mostrarRecibo}
        tipo="venda"
        registro={venda}
        aoFechar={() => setMostrarRecibo(false)}
      />
    </Dialog>
  );
}

function InfoCard({ label, value, detail, strong = false }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm ${strong ? "text-lg font-semibold text-slate-950" : "font-semibold text-slate-900"}`}>
        {value}
      </p>
      {detail && <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>}
    </div>
  );
}
