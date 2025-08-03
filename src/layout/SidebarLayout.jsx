import React from "react";
import {
  FaHome,
  FaCashRegister,
  FaBoxOpen,
  FaClipboardList,
  FaUsers // ← novo ícone para Clientes
} from "react-icons/fa";

export default function SidebarLayout({ children, setTela }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-4 shadow-md">
        {/* Logo e título */}
        <div className="mb-6 flex flex-col items-center">
          <img src="/logo.png" alt="Logo" className="h-16 mb-2" />
        </div>

        {/* Menu */}
        <nav className="space-y-2">
          <button
            onClick={() => setTela("dashboard")}
            className="w-full text-left px-4 py-3 rounded hover:bg-blue-800 flex items-center transition-all"
          >
            <FaHome className="mr-2 text-lg" />
            Dashboard
          </button>

          <button
            onClick={() => setTela("vendas")}
            className="w-full text-left px-4 py-3 rounded hover:bg-blue-800 flex items-center transition-all"
          >
            <FaCashRegister className="mr-2 text-lg" />
            Nova Venda
          </button>

          <button
            onClick={() => setTela("estoque")}
            className="w-full text-left px-4 py-3 rounded hover:bg-blue-800 flex items-center transition-all"
          >
            <FaBoxOpen className="mr-2 text-lg" />
            Estoque
          </button>

          <button
            onClick={() => setTela("historico")}
            className="w-full text-left px-4 py-3 rounded hover:bg-blue-800 flex items-center transition-all"
          >
            <FaClipboardList className="mr-2 text-lg" />
            Vendas Realizadas
          </button>

          <button
            onClick={() => setTela("clientes")}
            className="w-full text-left px-4 py-3 rounded hover:bg-blue-800 flex items-center transition-all"
          >
            <FaUsers className="mr-2 text-lg" />
            Clientes
          </button>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
