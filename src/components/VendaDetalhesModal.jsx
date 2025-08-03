import { Dialog } from "@headlessui/react";
import { X, Pencil, Trash, RefreshCcw } from "lucide-react";

export default function VendaDetalhesModal({
  venda,
  aberto,
  aoFechar,
  aoExcluir,
  aoTroca,
}) {
    
  if (!venda) return null;

  const formatarData = (data) =>
    new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Dialog open={aberto} onClose={aoFechar} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden animate-fade-in">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white relative">
            <Dialog.Title className="text-xl font-bold">
              Detalhes da Venda #{venda.id}
            </Dialog.Title>
            <button
              onClick={aoFechar}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full"
            >
              <X size={22} />
            </button>
          </div>

          {/* CONTEÚDO */}
          <div className="p-6 space-y-6">
            {/* Infos principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Data / Hora</p>
                <p className="font-semibold">{formatarData(venda.data)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-semibold text-green-600">
                  R$ {venda.total.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Forma de Pagamento</p>
                <p className="font-semibold">{venda.formaPagamento || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Entrega</p>
                <p className="font-semibold">{venda.tipoEntrega || "N/A"}</p>
                {venda.entregador && (
                  <p className="text-xs text-gray-400">
                    Entregador: {venda.entregador}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Taxa de Entrega</p>
                <p className="font-semibold">
                  R$ {venda.taxaEntrega?.toFixed(2) || "0,00"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-semibold">
                  {venda.cliente?.nome || "Não informado"}
                </p>
                <p className="text-xs text-gray-400">
                  {venda.cliente?.telefone || "-"}
                </p>
              </div>
            </div>

            {/* Observação opcional */}
            {venda.cliente?.observacoes && (
              <div className="bg-yellow-50 rounded-xl p-3 text-sm text-gray-700">
                <p className="font-medium">Observação do cliente:</p>
                <p>{venda.cliente.observacoes}</p>
              </div>
            )}

            {/* Itens da venda */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Itens</h3>
              <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {venda.itens.map((item) => (
                  <li key={item.id} className="py-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        <span className="font-medium">
                          {item.variacaoProduto.produto.nome}
                        </span>
                        {" – "}Tam {item.variacaoProduto.numeracao}
                      </span>
                      <span className="text-gray-500">
                        {item.quantidade}x
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botões */}
            <div className="flex flex-wrap justify-end gap-3 mt-6">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition">
                <Pencil size={18} /> Editar
              </button>
              <button
                onClick={() => aoTroca(venda)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <RefreshCcw size={18} /> Realizar Troca
              </button>
              <button
                onClick={() => aoExcluir(venda.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition"
              >
                <Trash size={18} /> Excluir
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
