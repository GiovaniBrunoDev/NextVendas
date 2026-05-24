import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import SidebarLayout from "./layout/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import VendasListadas from "./pages/VendasListadas";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import MobileHome from "./pages/MobileHome";
import BuscarProdutos from "./pages/BuscarProdutos";
import Metas from "./pages/Metas";
import Pedidos from "./pages/Pedidos";
import RelatorioLucro from "./pages/RelatorioLucro";
import EntradaEstoque from "./pages/EntradaEstoque";
import Login from "./pages/Login";
import AceitarConvite from "./pages/AceitarConvite";
import SuperAdmin from "./pages/SuperAdmin";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ProtectedApp() {
  const location = useLocation();
  const { autenticado, carregando, usuario } = useAuth();
  const [tela, setTela] = useState("dashboard");

  if (carregando) {
    return (
      <div className="lojia-gradient grid min-h-screen place-items-center text-white">
        <div className="flex items-center gap-3">
          <div className="lojia-brand-mark h-12 w-12 text-2xl">L</div>
          <span className="text-sm font-bold">Carregando sessao...</span>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const renderizarTela = () => {
    switch (tela) {
      case "vendas":
        return <Vendas />;
      case "historico":
        return <VendasListadas />;
      case "estoque":
        return <Estoque aoAdicionarReposicao={() => setTela("entradas")} />;
      case "clientes":
        return <Clientes />;
      case "produtos":
        return <BuscarProdutos />;
      case "metas":
        return <Metas />;
      case "pedidos":
        return <Pedidos />;
      case "lucro":
        return <RelatorioLucro />;
      case "entradas":
        return <EntradaEstoque />;
      case "superadmin":
        return usuario?.superadmin ? <SuperAdmin /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SidebarLayout setTela={setTela}>
      {renderizarTela()}
    </SidebarLayout>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/convite/:token" element={<AceitarConvite />} />
        <Route path="/mobile" element={<MobileHome />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
