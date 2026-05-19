import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import FinalizarVendaModal from "../components/FinalizarVendaModal";
import { toast } from "react-toastify";
import NovoPedidoModal from "../components/NovoPedidoModal";
import { FaPlus, FaSearch, FaShoppingCart, FaUndo } from "react-icons/fa";

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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Nova venda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Busque produtos, selecione a numeração e finalize pelo carrinho.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <span className="font-medium text-slate-500">Total atual</span>
          <p className="text-xl font-semibold text-slate-950">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-950">Buscar produto</h2>
            <div className="relative mt-4">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite nome ou código"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="p-4">
            {busca.trim() === "" ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <div>
                  <FaSearch className="mx-auto text-2xl text-slate-400" />
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
                  <div key={produto.id} className="rounded-lg border border-slate-200 p-4 shadow-sm">
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
                                  : "border-slate-300 bg-white text-slate-800 hover:border-slate-500 hover:bg-slate-50"
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

        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6 xl:self-start">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                  <FaShoppingCart className="text-slate-500" /> Carrinho
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totalItens} itens em {carrinho.length} lançamentos
                </p>
              </div>
              {carrinho.length > 0 && (
                <button
                  onClick={removerUltimoAdicionado}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <FaUndo size={11} /> Desfazer
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[480px] overflow-auto p-4">
            {carrinho.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-900">Carrinho vazio</p>
                <p className="mt-1 text-sm text-slate-500">Selecione uma numeração para adicionar produtos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrinho.map((item, index) => (
                  <div
                    key={`${item.produtoId}-${item.variacaoId}-${index}`}
                    className="rounded-lg border border-slate-200 p-3"
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
                className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setMostrarFinalizarModal(true)}
                disabled={carrinho.length === 0}
              >
                Finalizar venda
              </button>

              <button
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
          aoConfirmar={() => {
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
          aoFinalizar={() => {
            limparCarrinho();
            carregarProdutos();
          }}
        />
      )}
    </div>
  );
}
