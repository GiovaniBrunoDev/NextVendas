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
        return <Clientes/>
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <SidebarLayout setTela={setTela}>
        {renderizarTela()}
      </SidebarLayout>

      {/* Toasts globais */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
