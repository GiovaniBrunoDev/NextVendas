// src/pages/MobileHome.jsx
import { useEffect, useState } from "react";
import { PlusCircle, ShoppingCart, History, Package } from "lucide-react";
import api from "../services/api";

export default function MobileHome() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function carregarProdutos() {
      const res = await api.get("/produtos");
      setProdutos(res.data);
    }
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="block md:hidden bg-gray-100 min-h-screen">
      <div className="p-4">
        <input
          type="text"
          placeholder="Buscar produto..."
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          {produtosFiltrados.map((produto) => (
            <div
              key={produto.id}
              className="bg-white rounded shadow p-3 flex flex-col items-center text-center"
            >
              <img
                src={produto.imagem || "/placeholder.png"}
                alt={produto.nome}
                className="w-20 h-20 object-cover rounded mb-2"
              />
              <span className="font-semibold text-sm mb-1 truncate">
                {produto.nome}
              </span>
              <span className="text-green-600 font-bold text-sm">
                R$ {produto.preco?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navbar inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md flex justify-around py-2 z-50">
        <button className="flex flex-col items-center text-sm text-gray-700">
          <PlusCircle className="w-5 h-5" />
          Nova Venda
        </button>
        <button className="flex flex-col items-center text-sm text-gray-700">
          <ShoppingCart className="w-5 h-5" />
          Carrinho
        </button>
        <button className="flex flex-col items-center text-sm text-gray-700">
          <History className="w-5 h-5" />
          Vendas
        </button>
        <button className="flex flex-col items-center text-sm text-gray-700">
          <Package className="w-5 h-5" />
          Estoque
        </button>
      </nav>
    </div>
  );
}
