import { X, Printer, ReceiptText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import useModalPresence from "../hooks/useModalPresence";

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarDataHora = (valor) => {
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

const formatarData = (valor) => {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleDateString("pt-BR");
};

function normalizarItens(registro) {
  return (registro?.itens || []).map((item) => {
    const variacao = item.variacaoProduto || {};
    const produto = variacao.produto || {};
    const precoUnitario = Number(item.precoUnitario ?? produto.preco ?? 0);
    const quantidade = Number(item.quantidade || 0);

    return {
      id: item.id || `${item.variacaoProdutoId || "manual"}-${produto.nome || item.nomeManual || item.nome}`,
      nome: produto.nome || item.nomeManual || item.nome || "Produto",
      numeracao: variacao.numeracao || item.numeracaoManual || item.numeracao || "",
      quantidade,
      precoUnitario,
      subtotal: Number(item.subtotal ?? quantidade * precoUnitario),
    };
  });
}

export default function ReciboModal({ aberto, tipo = "venda", registro, aoFechar }) {
  const { lojaAtual } = useAuth();
  useModalPresence(Boolean(aberto && registro));

  if (!aberto || !registro) return null;

  const loja = lojaAtual?.loja;
  const itens = normalizarItens(registro);
  const subtotalItens = itens.reduce((soma, item) => soma + item.subtotal, 0);
  const desconto = Number(registro.desconto || 0);
  const taxaEntrega = Number(registro.taxaEntrega || 0);
  const subtotalProdutos = Number(registro.subtotalProdutos ?? subtotalItens);
  const total = Number(registro.total ?? subtotalProdutos + taxaEntrega - desconto);
  const cliente = registro.cliente;
  const titulo = tipo === "pedido" ? "Recibo de pedido" : "Recibo de venda";
  const numero = tipo === "pedido" ? `Pedido #${registro.id}` : `Venda #${registro.id}`;

  const imprimir = () => {
    const recibo = document.querySelector(".recibo-print-area");
    if (!recibo) return;

    const estilos = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("\n");

    const reciboHtml = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>${titulo} - ${numero}</title>
          ${estilos}
          <style>
            body {
              margin: 0 !important;
              background: #ffffff !important;
            }

            .print-shell {
              width: min(720px, 100%);
              margin: 0 auto;
              padding: 0;
            }

            @page { size: A4; margin: 12mm; }

            @media print {
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                visibility: visible !important;
              }

              .print-shell {
                width: 100%;
              }

              .recibo-print-area {
                position: static !important;
                left: auto !important;
                top: auto !important;
                width: 100% !important;
                max-width: 720px !important;
                margin: 0 auto !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 8px !important;
                padding: 20px !important;
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          <main class="print-shell">
            ${recibo.outerHTML}
          </main>
        </body>
      </html>
    `;

    const janela = window.open("", "_blank", "width=820,height=900");
    if (!janela) {
      window.print();
      return;
    }

    janela.document.open();
    janela.document.write(reciboHtml);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 250);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 px-3 py-4 backdrop-blur-sm">
      <div className="no-print absolute inset-0" onClick={aoFechar} />

      <div className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{titulo}</h2>
            <p className="text-sm text-slate-500">{numero}</p>
          </div>
          <button
            onClick={aoFechar}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="recibo-print-area mx-auto max-w-[720px] rounded-lg border border-slate-200 bg-white p-5 text-slate-950">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">Lojia</p>
                    <p className="text-xs text-slate-500">Sua loja no controle.</p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium">{loja?.nome || "Loja"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase text-slate-500">{titulo}</p>
                <p className="mt-1 text-lg font-semibold">{numero}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatarDataHora(registro.data || registro.dataCriacao)}
                </p>
              </div>
            </header>

            <section className="grid gap-4 border-b border-slate-200 py-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Cliente</p>
                <p className="mt-1 text-sm font-semibold">{cliente?.nome || "Nao informado"}</p>
                {cliente?.telefone && <p className="text-xs text-slate-500">{cliente.telefone}</p>}
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Pagamento</p>
                <p className="mt-1 text-sm font-semibold capitalize">{registro.formaPagamento || "Nao informado"}</p>
                {registro.status && <p className="text-xs capitalize text-slate-500">Status: {registro.status}</p>}
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Entrega</p>
                <p className="mt-1 text-sm font-semibold capitalize">{registro.tipoEntrega || "Retirada"}</p>
                {tipo === "pedido" && (
                  <p className="text-xs text-slate-500">
                    {formatarData(registro.dataEntrega)}
                    {registro.horarioEntrega ? `, ${registro.horarioEntrega}` : ""}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Endereco</p>
                <p className="mt-1 text-sm font-semibold">
                  {registro.endereco || cliente?.endereco || "Nao informado"}
                </p>
              </div>
            </section>

            <section className="border-b border-slate-200 py-4">
              <p className="mb-3 text-xs font-medium uppercase text-slate-500">Itens</p>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2 text-center">Qtd.</th>
                      <th className="px-3 py-2 text-right">Unit.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.nome}</p>
                          {item.numeracao && <p className="text-xs text-slate-500">Numeracao {item.numeracao}</p>}
                        </td>
                        <td className="px-3 py-2 text-center">{item.quantidade}</td>
                        <td className="px-3 py-2 text-right">{moeda(item.precoUnitario)}</td>
                        <td className="px-3 py-2 text-right font-medium">{moeda(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="ml-auto w-full max-w-xs space-y-2 py-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Produtos</span>
                <span>{moeda(subtotalProdutos)}</span>
              </div>
              {taxaEntrega > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxa de entrega</span>
                  <span>{moeda(taxaEntrega)}</span>
                </div>
              )}
              {desconto > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Desconto</span>
                  <span>- {moeda(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-semibold text-slate-950">
                <span>Total</span>
                <span>{moeda(total)}</span>
              </div>
            </section>

            {(registro.observacoes || registro.entregador) && (
              <section className="border-t border-slate-200 pt-4 text-sm">
                {registro.entregador && (
                  <p>
                    <span className="font-medium">Entregador:</span> {registro.entregador}
                  </p>
                )}
                {registro.observacoes && (
                  <p className="mt-2">
                    <span className="font-medium">Observacoes:</span> {registro.observacoes}
                  </p>
                )}
              </section>
            )}

            <footer className="mt-5 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              <p>Documento nao fiscal emitido pelo sistema Lojia.</p>
              <p>Obrigado pela preferencia.</p>
            </footer>
          </div>
        </div>

        <div className="no-print flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button
            onClick={aoFechar}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
          <button
            onClick={imprimir}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Printer size={16} /> Imprimir recibo
          </button>
        </div>
      </div>
    </div>
  );
}
