import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import SidebarLayout from "./layout/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import VendasListadas from "./pages/VendasListadas";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import MobileHome from "./pages/MobileHome";
import BuscarProdutos from "./pages/BuscarProdutos";

// Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AppWrapper() {
  const navigate = useNavigate();
  const [tela, setTela] = useState("dashboard");

  // Detecta se é mobile e redireciona
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && window.location.pathname !== "/mobile") {
      navigate("/mobile");
    }
  }, []);

  const renderizarTela = () => {
    switch (tela) {
      case "vendas":
        return <Vendas />;
      case "historico":
        return <VendasListadas />;
      case "estoque":
        return <Estoque />;
      case "clientes":
        return <Clientes />;
      case "produtos": 
        return <BuscarProdutos />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Routes>
        {/* Rota exclusiva para mobile */}
        <Route path="/mobile" element={<MobileHome />} />

        {/* Rota padrão com layout e navegação por estado */}
        <Route
          path="/*"
          element={
            <>
              <SidebarLayout setTela={setTela}>
                {renderizarTela()}
              </SidebarLayout>
              <ToastContainer position="top-right" autoClose={3000} />
            </>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;