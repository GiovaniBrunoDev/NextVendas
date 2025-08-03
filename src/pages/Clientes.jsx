import { useEffect, useState } from "react";
import { FaUserPlus, FaEdit } from "react-icons/fa";
import api from "../services/api";
import ClienteModal from "../components/ClienteModal";
import { toast } from "react-toastify";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const abrirNovoCliente = () => {
    setClienteSelecionado(null);
    setMostrarModal(true);
  };

  const editarCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setMostrarModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-700">👥 Clientes</h1>
        <button
          onClick={abrirNovoCliente}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          <FaUserPlus />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left text-gray-600">
              <th className="py-2">Nome</th>
              <th className="py-2">Telefone</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-t hover:bg-gray-50">
                <td className="py-2">{cliente.nome}</td>
                <td className="py-2">{cliente.telefone}</td>
                <td className="py-2">
                  <button
                    onClick={() => editarCliente(cliente)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FaEdit />
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <ClienteModal
          clienteAtual={clienteSelecionado}
          aoFechar={() => setMostrarModal(false)}
          aoSalvar={() => {
            setMostrarModal(false);
            carregarClientes();
          }}
        />
      )}
    </div>
  );
}
