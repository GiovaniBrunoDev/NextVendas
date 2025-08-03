import { useState } from "react";
import SidebarLayout from "./layout/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import VendasListadas from "./pages/VendasListadas";
import Estoque from "./pages/Estoque";

// Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Clientes from "./pages/Clientes";

function App() {
  return (
    <div className="bg-blue-500 text-white p-4">
      Teste simples — Tailwind funcionando!
    </div>
  );
}

export default App;
