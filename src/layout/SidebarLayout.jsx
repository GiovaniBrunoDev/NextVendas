import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaCashRegister,
  FaBoxOpen,
  FaClipboardList,
  FaUsers,
  FaBars, // ícone do menu
  FaTimes // ícone para fechar
} from "react-icons/fa";

export default function SidebarLayout({ children, setTela }) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // inicial
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar para desktop */}
      {!isMobile && (
        <aside className="w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-4 shadow-md">
          <div className="mb-6 flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="h-16 mb-2" />
          </div>
          {renderMenu()}
        </aside>
      )}

      {/* Topbar para mobile */}
      {isMobile && (
        <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <img src="/logo.png" alt="Logo" className="h-10" />
          <button onClick={() => setMenuAberto(!menuAberto)}>
            {menuAberto ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </header>
      )}

      {/* Menu mobile */}
      {isMobile && menuAberto && (
        <div className="bg-blue-800 text-white p-4">
          {renderMenu()}
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
