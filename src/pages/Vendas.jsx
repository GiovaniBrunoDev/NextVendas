import { useEffect, useState } from "react";
import api from "../services/api";
import CarrinhoItem from "../components/CarrinhoItem";
import FinalizarVendaModal from "../components/FinalizarVendaModal";
import { toast } from "react-toastify";


export default function Vendas() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarFinalizarModal, setMostrarFinalizarModal] = useState(false);

  const [manualNome, setManualNome] = useState("");
  const [manualPreco, setManualPreco] = useState("");
  const [manualQtd, setManualQtd] = useState(1);

  useEffect(() => {
    async function carregar() {
      const res = await api.get("/produtos");
      setProdutos(res.data);
    }
    carregar();
  }, []);

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()))
  );

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
      } else {
        return [...prev, { ...produto, qtd: 1 }];
      }
    });
    setBusca("");
  }

  function removerUltimoAdicionado() {
    setCarrinho((prev) => prev.slice(0, -1));
  }

  function adicionarProdutoManual() {
    if (!manualNome || !manualPreco || manualPreco <= 0 || manualQtd <= 0) {
      alert("Preencha os dados corretamente.");
      return;
    }

    const produtoManual = {
      id: Date.now(),
      nome: manualNome,
      codigo: "MANUAL",
      preco: parseFloat(manualPreco),
      tamanho: "-",
      estoque: 0,
      qtd: parseInt(manualQtd),
    };

    adicionarAoCarrinho(produtoManual);
    setManualNome("");
    setManualPreco("");
    setManualQtd(1);
    setBusca("");
  }

  async function carregarProdutos() {
    try {
      const res = await fetch("http://localhost:3001/produtos");
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      toast.error("Erro ao carregar produtos");
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const total = carrinho.reduce((soma, item) => soma + item.qtd * item.preco, 0);

  function limparCarrinho() {
    setCarrinho([]);
    setMostrarFinalizarModal(false);
    setBusca("");
  }

  

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold mb-2">Buscar Produto</h1>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite nome ou código..."
          className="w-full p-2 border rounded mb-4"
        />

        {busca.trim() !== "" && (
          <>
            {produtosFiltrados.length > 0 ? (
              <div className="space-y-4">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    className="bg-white border rounded p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={produto.imagemUrlCompleta || "https://cdn-icons-png.flaticon.com/512/771/771543.png"}
                        alt={produto.nome}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium text-blue-800">{produto.nome}</p>
                        <p className="text-sm text-gray-600">
                          Código: {produto.codigo || "N/A"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-1">Selecione uma numeração:</p>
                    <div className="flex gap-2 flex-wrap">
                      {produto.variacoes.map((v) => (
                        <button
                          key={v.id}
                          disabled={v.estoque === 0}
                          onClick={() =>
                            adicionarAoCarrinho({
                              produtoId: produto.id,
                              variacaoId: v.id,
                              nome: produto.nome,
                              preco: produto.preco,
                              numeracao: v.numeracao,
                              qtd: 1,
                              estoque: v.estoque,
                            })
                          }
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150 shadow-sm
                            ${
                              v.estoque === 0
                                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                            }
                          `}
                        >
                          {v.numeracao} ({v.estoque})
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-300 p-4 rounded text-sm text-yellow-700">
                <p className="mb-2">
                  Nenhum produto encontrado. Deseja adicionar um produto manualmente?
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Nome do produto"
                    value={manualNome}
                    onChange={(e) => setManualNome(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Preço"
                    value={manualPreco}
                    onChange={(e) => setManualPreco(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Quantidade"
                    min={1}
                    value={manualQtd}
                    onChange={(e) => setManualQtd(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={adicionarProdutoManual}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Carrinho</h2>
          {carrinho.length > 0 && (
            <button
              onClick={removerUltimoAdicionado}
              className="text-sm text-red-500 hover:underline"
            >
              ❌ Desfazer último
            </button>
          )}
        </div>

        <div className="bg-white p-4 shadow rounded mb-4">
          {carrinho.length === 0 ? (
            <p className="text-gray-500">Nenhum item no carrinho.</p>
          ) : (
            <>
              {carrinho.map((item) => (
                <div key={`${item.produtoId}-${item.variacaoId}`} className="mb-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.nome} (Tam. {item.numeracao}) x {item.qtd}</span>
                    <span className="text-right">R$ {(item.preco * item.qtd).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700 disabled:opacity-50"
          onClick={() => setMostrarFinalizarModal(true)}
          disabled={carrinho.length === 0}
        >
          Finalizar Venda
        </button>
      </div>

        {mostrarFinalizarModal && (
        <FinalizarVendaModal
          carrinho={carrinho}
          aoFechar={() => setMostrarFinalizarModal(false)}
          aoFinalizar={() => {
            limparCarrinho();
            carregarProdutos(); // ✅ Recarrega os produtos para atualizar o estoque
          }}
        />
      )}
    </div>
  );
}
