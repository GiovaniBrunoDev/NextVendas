import { Routes, Route, useNavigate } from "react-router-dom";
import { PlusCircle, ShoppingCart, History, Package } from "lucide-react";
import VendasMobile from "./VendasMobile";
import CarrinhoMobile from "./CarrinhoMobile";
import EstoqueMobile from "./EstoqueMobile";
import ProdutosMobile from "./ProdutosMobile"; // versão simplificada da home

export default function MobileHome() {
  const navigate = useNavigate();

  return (
    <div className="block md:hidden bg-gray-100 min-h-screen pb-16">
      <Routes>
        <Route path="/" element={<ProdutosMobile />} />
        <Route path="/vendas" element={<VendasMobile />} />
        <Route path="/carrinho" element={<CarrinhoMobile />} />
        <Route path="/estoque" element={<EstoqueMobile />} />
      </Routes>

      {/* Navbar inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md flex justify-around py-2 z-50">
        <button
          onClick={() => navigate("/mobile/vendas")}
          className="flex flex-col items-center text-sm text-gray-700"
        >
          <PlusCircle className="w-5 h-5" />
          Nova Venda
        </button>
        <button
          onClick={() => navigate("/mobile/carrinho")}
          className="flex flex-col items-center text-sm text-gray-700"
        >
          <ShoppingCart className="w-5 h-5" />
          Carrinho
        </button>
        <button
          onClick={() => navigate("/mobile/vendas")}
          className="flex flex-col items-center text-sm text-gray-700"
        >
          <History className="w-5 h-5" />
          Vendas
        </button>
        <button
          onClick={() => navigate("/mobile/estoque")}
          className="flex flex-col items-center text-sm text-gray-700"
        >
          <Package className="w-5 h-5" />
          Estoque
        </button>
      </nav>
    </div>
  );
}