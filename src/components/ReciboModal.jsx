import { useRef } from "react";
import { X, Printer, ReceiptText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import useModalPresence from "../hooks/useModalPresence";
import useLojaConfiguracoes from "../hooks/useLojaConfiguracoes";

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
  const { configuracoes } = useLojaConfiguracoes();
  const reciboRef = useRef(null);
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
  const reciboCompacto = Boolean(configuracoes.reciboCompacto);
  const logoRecibo = configuracoes.mostrarLogoRecibo
    ? String(configuracoes.logoUrl || "").trim() || "/lojia-logo.png"
    : "";
  const rodapeRecibo = String(configuracoes.rodapeRecibo || "").trim() || "Obrigado pela preferência.";
  const dadosLoja = [
    loja?.telefone,
    loja?.documento,
    [loja?.endereco, loja?.bairro, loja?.cidade, loja?.estado].filter(Boolean).join(", "),
  ].filter(Boolean);
  const sectionPadding = reciboCompacto ? "py-3" : "py-4";
  const cellPadding = reciboCompacto ? "px-3 py-1.5" : "px-3 py-2";

  const imprimir = () => {
    if (!reciboRef.current) return;
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 px-3 py-4 backdrop-blur-sm">
      <div className="no-print absolute inset-0" aria-hidden="true" />

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
          <div
            ref={reciboRef}
            className={`recibo-print-area mx-auto max-w-[720px] rounded-lg border border-slate-200 bg-white text-slate-950 ${
              reciboCompacto ? "p-4 text-[13px]" : "p-5"
            }`}
          >
            <header className={`flex items-start justify-between gap-4 border-b border-slate-200 ${reciboCompacto ? "pb-3" : "pb-4"}`}>
              <div>
                <div className="flex items-center gap-2">
                  {logoRecibo ? (
                    <img
                      src={logoRecibo}
                      alt={loja?.nome || "Lojia"}
                      className="h-12 max-w-[150px] rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <ReceiptText size={20} />
                    </div>
                  )}
                  <div>
                    <p className="text-xl font-semibold">{loja?.nome || "Lojia"}</p>
                    <p className="text-xs text-slate-500">Sua loja no controle.</p>
                  </div>
                </div>
                {dadosLoja.length > 0 && (
                  <div className="mt-3 space-y-0.5 text-xs text-slate-500">
                    {dadosLoja.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase text-slate-500">{titulo}</p>
                <p className="mt-1 text-lg font-semibold">{numero}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatarDataHora(registro.data || registro.dataCriacao)}
                </p>
              </div>
            </header>

            <section className={`grid gap-4 border-b border-slate-200 ${sectionPadding} sm:grid-cols-2`}>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Cliente</p>
                <p className="mt-1 text-sm font-semibold">{cliente?.nome || "Não informado"}</p>
                {cliente?.telefone && <p className="text-xs text-slate-500">{cliente.telefone}</p>}
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Pagamento</p>
                <p className="mt-1 text-sm font-semibold capitalize">{registro.formaPagamento || "Não informado"}</p>
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
                <p className="text-xs font-medium uppercase text-slate-500">Endereço</p>
                <p className="mt-1 text-sm font-semibold">
                  {registro.endereco || cliente?.endereco || "Não informado"}
                </p>
              </div>
            </section>

            <section className={`border-b border-slate-200 ${sectionPadding}`}>
              <p className="mb-3 text-xs font-medium uppercase text-slate-500">Itens</p>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                    <tr>
                      <th className={cellPadding}>Produto</th>
                      <th className={`${cellPadding} text-center`}>Qtd.</th>
                      <th className={`${cellPadding} text-right`}>Unit.</th>
                      <th className={`${cellPadding} text-right`}>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.map((item) => (
                      <tr key={item.id}>
                        <td className={cellPadding}>
                          <p className="font-medium">{item.nome}</p>
                          {item.numeracao && <p className="text-xs text-slate-500">Numeração {item.numeracao}</p>}
                        </td>
                        <td className={`${cellPadding} text-center`}>{item.quantidade}</td>
                        <td className={`${cellPadding} text-right`}>{moeda(item.precoUnitario)}</td>
                        <td className={`${cellPadding} text-right font-medium`}>{moeda(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={`ml-auto w-full max-w-xs space-y-2 ${sectionPadding} text-sm`}>
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
                    <span className="font-medium">Observações:</span> {registro.observacoes}
                  </p>
                )}
              </section>
            )}

            <footer className="mt-5 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              <p>Documento não fiscal emitido pelo sistema Lojia.</p>
              <p>{rodapeRecibo}</p>
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
