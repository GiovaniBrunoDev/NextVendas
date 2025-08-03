// src/pages/VendasMobile.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import FinalizarVendaModal from "../components/FinalizarVendaModal";
import { toast } from "react-toastify";

export default function VendasMobile() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [mostrarFinalizarModal, setMostrarFinalizarModal] = useState(false);

  const [manualNome, setManualNome] = useState("");
  const [manualPreco, setManualPreco] = useState("");
  const [manualQtd, setManualQtd] = useState(1);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get("/produtos");
        setProdutos(res.data);
      } catch (err) {
        toast.error("Erro ao carregar produtos");
      }
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

  const total = carrinho.reduce((soma, item) => soma + item.qtd * item.preco, 0);

  function limparCarrinho() {
    setCarrinho([]);
    setMostrarFinalizarModal(false);
    setBusca("");
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-lg font-bold mb-2">Nova Venda</h1>

      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto ou código..."
        className="w-full p-2 border rounded mb-4"
      />

      {busca.trim() !== "" && (
        <>
          {produtosFiltrados.length > 0 ? (
            <div className="space-y-4">
              {produtosFiltrados.map((produto) => (
                <div key={produto.id} className="bg-white border rounded p-3 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={produto.imagemUrlCompleta || "/placeholder.png"}
                      alt={produto.nome}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-blue-800">{produto.nome}</p>
                      <p className="text-xs text-gray-600">Código: {produto.codigo || "N/A"}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-1">Numeração:</p>
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
                        className={`rounded px-3 py-1 text-xs font-medium border ${
                          v.estoque === 0
                            ? "bg-gray-100 text-gray-400 border-gray-300"
                            : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                        }`}
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
              <p className="mb-2">Nenhum produto encontrado. Adicionar manualmente?</p>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Nome"
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
                  placeholder="Qtd"
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

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Carrinho</h2>
        <div className="bg-white p-4 rounded shadow">
          {carrinho.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum item no carrinho.</p>
          ) : (
            <>
              {carrinho.map((item, index) => (
                <div key={index} className="flex justify-between text-sm mb-2">
                  <span>
                    {item.nome} {item.numeracao ? `(Tam. ${item.numeracao})` : ""} x {item.qtd}
                  </span>
                  <span>R$ {(item.preco * item.qtd).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <button
          className="bg-green-600 text-white mt-4 px-4 py-2 rounded w-full hover:bg-green-700 disabled:opacity-50"
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
          }}
        />
      )}
    </div>
  );
}
