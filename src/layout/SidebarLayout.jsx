import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaCashRegister,
  FaBoxOpen,
  FaClipboardList,
  FaUsers
} from "react-icons/fa";

export default function SidebarLayout({ children, setTela }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderMenu = () => (
    <nav className="space-y-2 mt-4">
      <button onClick={() => setTela("dashboard")} className="menu-btn">
        <FaHome className="mr-2 text-lg" />
        Dashboard
      </button>
      <button onClick={() => setTela("vendas")} className="menu-btn">
        <FaCashRegister className="mr-2 text-lg" />
        Nova Venda
      </button>
      <button onClick={() => setTela("estoque")} className="menu-btn">
        <FaBoxOpen className="mr-2 text-lg" />
        Estoque
      </button>
      <button onClick={() => setTela("historico")} className="menu-btn">
        <FaClipboardList className="mr-2 text-lg" />
        Vendas Realizadas
      </button>
      <button onClick={() => setTela("clientes")} className="menu-btn">
        <FaUsers className="mr-2 text-lg" />
        Clientes
      </button>
    </nav>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-800 text-white flex justify-around py-2 shadow-inner z-50">
      <button onClick={() => setTela("dashboard")} className="flex flex-col items-center text-xs">
        <FaHome className="text-lg mb-1" />
        Início
      </button>
      <button onClick={() => setTela("vendas")} className="flex flex-col items-center text-xs">
        <FaCashRegister className="text-lg mb-1" />
        Venda
      </button>
      <button onClick={() => setTela("estoque")} className="flex flex-col items-center text-xs">
        <FaBoxOpen className="text-lg mb-1" />
        Estoque
      </button>
      <button onClick={() => setTela("historico")} className="flex flex-col items-center text-xs">
        <FaClipboardList className="text-lg mb-1" />
        Histórico
      </button>
      <button onClick={() => setTela("clientes")} className="flex flex-col items-center text-xs">
        <FaUsers className="text-lg mb-1" />
        Clientes
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-14 md:pb-0">
      {/* Sidebar para desktop */}
      {!isMobile && (
        <aside className="w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-4 shadow-md">
          <div className="mb-6 flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="h-16 mb-2" />
          </div>
          {renderMenu()}
        </aside>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">{children}</main>

      {/* Menu inferior para mobile */}
      {isMobile && renderBottomNav()}
    </div>
  );
}
