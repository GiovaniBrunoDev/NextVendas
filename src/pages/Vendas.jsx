import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import FinalizarVendaModal from "../components/FinalizarVendaModal";
import ReciboModal from "../components/ReciboModal";
import { toast } from "react-toastify";
import NovoPedidoModal from "../components/NovoPedidoModal";
import { FaSearch, FaShoppingCart, FaUndo } from "react-icons/fa";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

export default function Vendas() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarFinalizarModal, setMostrarFinalizarModal] = useState(false);
  const [mostrarPedidoModal, setMostrarPedidoModal] = useState(false);
  const [recibo, setRecibo] = useState(null);

  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErroCarregamento(false);
      const res = await api.get("/produtos");
      setProdutos(res.data);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setErroCarregamento(true);
      toast.error("Erro ao buscar produtos. Verifique a conexão ou tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];

    return produtos
      .filter(
        (produto) =>
          produto.nome.toLowerCase().includes(termo) ||
          (produto.codigo && produto.codigo.toLowerCase().includes(termo))
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, busca]);

  const total = carrinho.reduce((soma, item) => soma + item.qtd * item.preco, 0);
  const totalItens = carrinho.reduce((soma, item) => soma + item.qtd, 0);

  function adicionarAoCarrinho(produto) {
    setCarrinho((prev) => {
      const existente = prev.find(
        (item) => item.variacaoId === produto.variacaoId && item.produtoId === produto.produtoId
      );

      if (existente) {
        return prev.map((item) =>
          item.variacaoId === produto.variacaoId && item.produtoId === produto.produtoId
            ? { ...item, qtd: item.qtd + 1 }
            : item
        );
      }

      return [...prev, { ...produto, qtd: produto.qtd || 1 }];
    });
    setBusca("");
  }

  function removerUltimoAdicionado() {
    setCarrinho((prev) => prev.slice(0, -1));
  }

  function limparCarrinho() {
    setCarrinho([]);
    setMostrarFinalizarModal(false);
    setBusca("");
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="lojia-hero-panel mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-white/62">PDV</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Nova venda</h1>
          <p className="mt-1 text-sm text-white/68">
            Busque produtos, selecione a numeração e finalize pelo carrinho.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 text-sm">
          <span className="font-medium text-white/62">Total atual</span>
          <p className="text-2xl font-semibold text-white">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="lojia-surface overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-950">Buscar produto</h2>
            <div className="relative mt-4">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite nome ou código"
                className="w-full rounded-lg border border-[#E5DED2] bg-[#FFFEFA] py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#16A36B] focus:bg-white"
              />
            </div>
          </div>

          <div className="p-4">
            {busca.trim() === "" ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-[#E5DED2] bg-[#FFFEFA]/70 p-8 text-center">
                <div>
                  <FaSearch className="mx-auto text-2xl text-[#16A36B]" />
                  <p className="mt-3 text-sm font-medium text-slate-900">Comece buscando um produto</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Os resultados aparecerão aqui com as numerações disponíveis.
                  </p>
                </div>
              </div>
            ) : carregando ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                Carregando produtos...
              </div>
            ) : erroCarregamento ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Não foi possível carregar os produtos.
                <button onClick={carregarProdutos} className="ml-2 font-semibold underline">
                  Tentar novamente
                </button>
              </div>
            ) : produtosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {produtosFiltrados.map((produto) => (
                  <div key={produto.id} className="rounded-lg border border-[#E5DED2] bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#16A36B]/35 hover:shadow-[0_16px_34px_rgba(36,48,43,0.1)]">
                    <div className="flex items-start gap-3">
                      <img
                        src={produto.imagemUrl || "https://cdn-icons-png.flaticon.com/512/771/771543.png"}
                        alt={produto.nome}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{produto.nome}</p>
                        <p className="mt-1 text-xs text-slate-500">Código: {produto.codigo || "N/A"}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(produto.preco)}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        Numeração disponível
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {produto.variacoes
                          .slice()
                          .sort((a, b) => Number(a.numeracao) - Number(b.numeracao))
                          .map((variacao) => (
                            <button
                              key={variacao.id}
                              disabled={variacao.estoque === 0}
                              onClick={() =>
                                adicionarAoCarrinho({
                                  produtoId: produto.id,
                                  variacaoId: variacao.id,
                                  nome: produto.nome,
                                  preco: produto.preco,
                                  numeracao: variacao.numeracao,
                                  qtd: 1,
                                  estoque: variacao.estoque,
                                })
                              }
                              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                variacao.estoque === 0
                                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                                  : "border-[#E5DED2] bg-white text-slate-800 hover:border-[#16A36B] hover:bg-[#16A36B]/5 hover:text-[#11875A]"
                              }`}
                            >
                              {variacao.numeracao}
                              <span className="ml-1 text-xs text-slate-500">({variacao.estoque})</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Produto não encontrado</p>
                <p className="mt-1 text-sm text-slate-500">
                  Verifique a busca ou cadastre o produto no estoque antes de concluir a venda.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="lojia-surface overflow-hidden xl:sticky xl:top-6 xl:self-start">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                  <FaShoppingCart className="text-[#16A36B]" /> Carrinho
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totalItens} itens em {carrinho.length} lançamentos
                </p>
              </div>
              {carrinho.length > 0 && (
                <button
                  onClick={removerUltimoAdicionado}
                  className="lojia-ghost-action inline-flex items-center gap-2 px-3 py-2 text-xs font-medium"
                >
                  <FaUndo size={11} /> Desfazer
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[480px] overflow-auto p-4">
            {carrinho.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#E5DED2] bg-[#FFFEFA]/70 p-6 text-center">
                <p className="text-sm font-medium text-slate-900">Carrinho vazio</p>
                <p className="mt-1 text-sm text-slate-500">Selecione uma numeração para adicionar produtos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrinho.map((item, index) => (
                  <div
                    key={`${item.produtoId}-${item.variacaoId}-${index}`}
                    className="rounded-lg border border-[#E5DED2] bg-white/80 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{item.nome}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Tam. {item.numeracao} x {item.qtd}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatCurrency(item.preco * item.qtd)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span className="text-2xl font-semibold text-slate-950">{formatCurrency(total)}</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                className="lojia-primary-action px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setMostrarFinalizarModal(true)}
                disabled={carrinho.length === 0}
              >
                Finalizar venda
              </button>

              <button
                className="lojia-ghost-action px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setMostrarPedidoModal(true)}
                disabled={carrinho.length === 0}
              >
                Criar pedido
              </button>
            </div>
          </div>
        </aside>
      </div>

      {mostrarPedidoModal && (
        <NovoPedidoModal
          carrinho={carrinho}
          aoFechar={() => setMostrarPedidoModal(false)}
          aoConfirmar={(pedido) => {
            if (pedido) setRecibo({ tipo: "pedido", registro: pedido });
            setMostrarPedidoModal(false);
            limparCarrinho();
            carregarProdutos();
          }}
        />
      )}

      {mostrarFinalizarModal && (
        <FinalizarVendaModal
          carrinho={carrinho}
          aoFechar={() => setMostrarFinalizarModal(false)}
          aoFinalizar={(venda) => {
            if (venda) setRecibo({ tipo: "venda", registro: venda });
            limparCarrinho();
            carregarProdutos();
          }}
        />
      )}

      <ReciboModal
        aberto={!!recibo}
        tipo={recibo?.tipo}
        registro={recibo?.registro}
        aoFechar={() => setRecibo(null)}
      />
    </div>
  );
}
