import { useNavigate } from "react-router-dom";
import { ShoppingBag, ShoppingCart, PackageSearch, Home } from "lucide-react";

export default function MobileHome() {
  const navigate = useNavigate();

  const produtos = [
    { id: 1, nome: "Tênis Nike Air", preco: 299.9 },
    { id: 2, nome: "Tênis Adidas UltraBoost", preco: 349.9 },
    { id: 3, nome: "Tênis Puma RS-X", preco: 259.9 },
    { id: 4, nome: "Tênis Vans Old Skool", preco: 219.9 },
    { id: 5, nome: "Tênis Converse All Star", preco: 199.9 },
  ];

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white text-center py-4 text-xl font-bold">
        NextPDV Mobile
      </header>

      <div className="p-4">
        <input
          type="text"
          placeholder="Buscar produtos..."
          className="w-full px-4 py-2 mb-4 border rounded-lg shadow"
        />

        <div className="grid grid-cols-2 gap-4">
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="bg-white p-4 rounded-lg shadow text-center"
            >
              <div className="text-sm font-semibold mb-2 truncate">
                {produto.nome}
              </div>
              <div className="text-blue-600 font-bold text-lg">
                R$ {produto.preco.toFixed(2)}
              </div>
              <button className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded shadow">
                Adicionar
              </button>
            </div>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50">
        <button
          onClick={() => navigate("/vendas/nova")}
          className="flex flex-col items-center text-blue-600"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-xs">Nova</span>
        </button>
        <button
          onClick={() => navigate("/carrinho")}
          className="flex flex-col items-center text-blue-600"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs">Carrinho</span>
        </button>
        <button
          onClick={() => navigate("/vendas")}
          className="flex flex-col items-center text-blue-600"
        >
          <PackageSearch className="w-5 h-5" />
          <span className="text-xs">Vendas</span>
        </button>
        <button
          onClick={() => navigate("/estoque")}
          className="flex flex-col items-center text-blue-600"
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Estoque</span>
        </button>
      </nav>
    </div>
  );
}
