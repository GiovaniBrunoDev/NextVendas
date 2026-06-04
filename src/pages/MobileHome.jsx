import { useNavigate } from "react-router-dom";
import { Home, PackageSearch, ShoppingBag, ShoppingCart } from "lucide-react";

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
    <div className="lojia-shell flex min-h-screen flex-col md:hidden">
      <header className="lojia-gradient px-4 py-4 text-white">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <div className="lojia-brand-mark h-11 w-11 text-2xl">L</div>
          <div>
            <p className="text-xl font-black leading-none">Lojia</p>
            <p className="mt-1 text-xs font-semibold text-[#CFF8E5]">Sua loja no controle.</p>
          </div>
        </div>
      </header>

      <div className="p-4 pb-24">
        <input
          type="text"
          placeholder="Buscar produtos..."
          className="lojia-input mb-4 w-full px-4 py-2"
        />

        <div className="grid grid-cols-2 gap-4">
          {produtos.map((produto) => (
            <div key={produto.id} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="mb-2 truncate text-sm font-semibold text-[#0B1115]">{produto.nome}</div>
              <div className="text-lg font-semibold text-slate-950">R$ {produto.preco.toFixed(2)}</div>
              <button className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">Adicionar</button>
            </div>
          ))}
        </div>
      </div>

      <nav className="lojia-mobile-nav fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-[#E5DED2] bg-[#FFFEFA] py-2 shadow-md">
        <button onClick={() => navigate("/vendas/nova")} className="flex flex-col items-center text-slate-700">
          <ShoppingBag className="h-5 w-5" />
          <span className="text-xs font-semibold">Nova</span>
        </button>
        <button onClick={() => navigate("/carrinho")} className="flex flex-col items-center text-slate-700">
          <ShoppingCart className="h-5 w-5" />
          <span className="text-xs font-semibold">Carrinho</span>
        </button>
        <button onClick={() => navigate("/vendas")} className="flex flex-col items-center text-slate-700">
          <PackageSearch className="h-5 w-5" />
          <span className="text-xs font-semibold">Vendas</span>
        </button>
        <button onClick={() => navigate("/estoque")} className="flex flex-col items-center text-slate-700">
          <Home className="h-5 w-5" />
          <span className="text-xs font-semibold">Estoque</span>
        </button>
      </nav>
    </div>
  );
}
