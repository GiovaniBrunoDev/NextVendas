import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaCashRegister,
  FaBoxOpen,
  FaClipboardList,
  FaUsers,
  FaSearch,
} from "react-icons/fa";

export default function SidebarLayout({ children, setTela }) {
  const [isMobile, setIsMobile] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState("dashboard");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const trocarTela = (tela) => {
    setTela(tela);
    setTelaAtiva(tela);
  };

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: FaHome },
    { key: "vendas", label: "Nova Venda", icon: FaCashRegister },
    { key: "estoque", label: "Estoque", icon: FaBoxOpen },
    { key: "historico", label: "Vendas", icon: FaClipboardList },
    { key: "clientes", label: "Clientes", icon: FaUsers, desktopOnly: true },
    { key: "produtos", label: "Consultar", icon: FaSearch }
];

  const renderMenu = () => (
  <nav className="space-y-1 mt-6">
    {menuItems
      .filter((item) => !isMobile || !item.desktopOnly) // 🔹 só mostra desktopOnly no desktop
      .map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => trocarTela(key)}
          className={`flex items-center w-full px-4 py-3 rounded-lg transition 
            ${
              telaAtiva === key
                ? "bg-blue-600 text-white shadow"
                : "text-white hover:bg-blue-700 hover:shadow-sm"
            }`}
        >
          <Icon className="mr-3 text-lg group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
  </nav>
);


  const renderBottomNav = () => (
  <>
  {/* Barra de navegação flutuante */}
  <div className="fixed bottom-4 left-0 right-0 bg-blue-800 text-white flex justify-around py-2 shadow-inner z-50 border-t border-blue-700 rounded-t-lg">
    {menuItems
      .filter((item) => !item.desktopOnly)
      .map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => trocarTela(key)}
          className={`flex flex-col items-center text-xs px-2 transition ${
            telaAtiva === key ? "text-yellow-300" : "text-white"
          }`}
        >
          <Icon className="text-xl mb-1" />
          {label}
        </button>
    ))}
  </div>

  {/* Preenchimento visual abaixo da barra */}
  <div className="fixed bottom-0 left-0 right-0 h-4 bg-blue-800 z-40" />
</>
);

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Sidebar (Desktop) */}
      {!isMobile && (
        <aside className="w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-4 shadow-md">
          <div className="mb-6 flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="h-16 mb-2" />

          </div>
          {renderMenu()}
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">{children}</main>

      {/* Bottom Nav (Mobile) */}
      {isMobile && renderBottomNav()}
    </div>
  );
}
