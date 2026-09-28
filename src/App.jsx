import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

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
import Caixa from "./pages/Caixa";
import Financeiro from "./pages/Financeiro";
import Inventario from "./pages/Inventario";
import Etiquetas from "./pages/Etiquetas";
import Login from "./pages/Login";
import CadastroLojista from "./pages/CadastroLojista";
import AceitarConvite from "./pages/AceitarConvite";
import SuperAdmin from "./pages/SuperAdmin";
import Institucional from "./pages/Institucional";
import MinhaConta from "./pages/MinhaConta";
import OnboardingInicial from "./pages/OnboardingInicial";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ConnectionStatus from "./components/ConnectionStatus";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function LoadingScreen() {
  return (
    <div className="lojia-gradient relative grid min-h-screen place-items-center overflow-hidden px-6">
      <div className="flex gap-2">
        {[0, 1, 2].map((item) => (
          <motion.span
            key={item}
            className="h-2.5 w-2.5 rounded-full bg-white/70"
            animate={{ opacity: [0.35, 1, 0.35], y: [0, -5, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: item * 0.16, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

function ProtectedApp() {
  const location = useLocation();
  const { autenticado, carregando, usuario, lojaAtual } = useAuth();
  const [tela, setTelaState] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    const telaSalva = localStorage.getItem("lojia_tela_ativa") || "dashboard";
    if (["entradas", "inventario", "etiquetas"].includes(telaSalva)) return "estoque";
    if (telaSalva === "relatorios") return "dashboard";
    return telaSalva;
  });

  const setTela = (proximaTela) => {
    localStorage.setItem("lojia_tela_ativa", proximaTela);
    setTelaState(proximaTela);
  };

  if (carregando) {
    return <LoadingScreen />;
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const renderizarTela = () => {
    const acessoRestritoVendas = Boolean(lojaAtual?.vendasPropriasApenas);
    const telasPermitidas = ["dashboard", "vendas", "pedidos", "historico", "estoque", "produtos", "minha-conta"];
    if (acessoRestritoVendas && !telasPermitidas.includes(tela)) {
      return <Dashboard onNavigate={setTela} />;
    }

    switch (tela) {
      case "vendas":
        return <Vendas />;
      case "historico":
        return <VendasListadas />;
      case "estoque":
        return <Estoque onNavigate={setTela} />;
      case "inventario":
        return <Inventario onNavigate={setTela} />;
      case "etiquetas":
        return <Etiquetas onNavigate={setTela} />;
      case "clientes":
        return <Clientes />;
      case "produtos":
        return <BuscarProdutos />;
      case "metas":
        return <Metas />;
      case "pedidos":
        return <Pedidos />;
      case "caixa":
        return <Caixa />;
      case "financeiro":
        return <Financeiro />;
      case "superadmin":
        return usuario?.superadmin ? <SuperAdmin /> : <Dashboard onNavigate={setTela} />;
      case "minha-conta":
        return <MinhaConta />;
      case "onboarding":
        return <OnboardingInicial onNavigate={setTela} />;
      default:
        return <Dashboard onNavigate={setTela} />;
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
        <Route path="/cadastro" element={<CadastroLojista />} />
        <Route path="/institucional" element={<Institucional />} />
        <Route path="/convite/:token" element={<AceitarConvite />} />
        <Route path="/mobile" element={<MobileHome />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
      <ConnectionStatus />
      <ToastContainer
        position="top-right"
        autoClose={2600}
        closeButton={false}
        draggable={false}
        hideProgressBar
        newestOnTop
        pauseOnFocusLoss={false}
      />
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
