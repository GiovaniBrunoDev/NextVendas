import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import SidebarLayout from "./layout/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import VendasListadas from "./pages/VendasListadas";
import Estoque from "./pages/Estoque";
import Clientes from "./pages/Clientes";
import MobileHome from "./pages/MobileHome";

// Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [tela, setTela] = useState("dashboard");

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
      default:
        return <Dashboard />;
    }
  };

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;