import React, { useEffect, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaBox, FaCalendarAlt, FaCheck, FaClock, FaTimes } from "react-icons/fa";

export default function Pedidos() {
  const [pedidosHoje, setPedidosHoje] = useState([]);
  const [pedidosFuturos, setPedidosFuturos] = useState([]);
  const [pedidosSemData, setPedidosSemData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoProcessando, setPedidoProcessando] = useState(null);

  const carregarPedidos = async () => {
    try {
      const { data } = await api.get("/pedidos");
      const hojeStr = new Date().toISOString().split("T")[0];
      const hoje = [];
      const futuros = [];
      const semData = [];

      data.forEach((pedido) => {
        if (!pedido.dataEntrega) {
          semData.push(pedido);
          return;
        }

        const dataEntregaStr = new Date(pedido.dataEntrega).toISOString().split("T")[0];
        if (dataEntregaStr === hojeStr) {
          hoje.push(pedido);
        } else if (new Date(pedido.dataEntrega) > new Date()) {
          futuros.push(pedido);
        }
      });

      setPedidosHoje(hoje);
      setPedidosFuturos(futuros);
      setPedidosSemData(semData);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao carregar pedidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id, status) => {
    try {
      setPedidoProcessando(id);

      if (status === "confirmado") {
        await api.post(`/pedidos/${id}/confirmar`);
        toast.success(`Pedido #${id} convertido em venda!`);
      } else {
        await api.put(`/pedidos/${id}/status`, { status });
        toast.success(`Pedido #${id} atualizado para ${status}`);
      }

      await carregarPedidos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao atualizar pedido.");
    } finally {
      setPedidoProcessando(null);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const statusClass = {
    agendado: "bg-yellow-100 text-yellow-700",
    reservado: "bg-blue-100 text-blue-700",
    cancelado: "bg-red-100 text-red-700",
  };

  const CardPedido = ({ pedido }) => {
    const processando = pedidoProcessando === pedido.id;

    return (
      <motion.div
        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-gray-800 font-semibold text-lg">Pedido #{pedido.id}</h3>
          <span
            className={`px-2 py-1 text-xs rounded-full capitalize font-medium ${
              statusClass[pedido.status] || "bg-green-100 text-green-700"
            }`}
          >
            {pedido.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-1">
          <strong>Cliente:</strong> {pedido.cliente?.nome || "Nao informado"}
        </p>

        <p className="text-gray-500 text-xs mb-3 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-500" />
          {pedido.dataEntrega
            ? new Date(pedido.dataEntrega).toLocaleDateString("pt-BR")
            : "Sem data definida"}
        </p>

        <ul className="text-gray-700 text-sm mb-4 space-y-1">
          {pedido.itens.map((item) => (
            <li key={item.id}>
              {item.variacaoProduto.produto.nome} ({item.variacaoProduto.numeracao}) x{" "}
              {item.quantidade}
            </li>
          ))}
        </ul>

        <p className="text-gray-800 font-semibold mb-4 text-right text-lg">
          R$ {Number(pedido.total || 0).toFixed(2)}
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => atualizarStatus(pedido.id, "confirmado")}
            disabled={processando}
            title="Confirmar e lancar como venda"
            className="bg-blue-500 px-3 py-1.5 rounded-lg text-white text-sm hover:bg-blue-600 shadow-sm disabled:opacity-50"
          >
            <FaCheck />
          </button>
          <button
            onClick={() => atualizarStatus(pedido.id, "cancelado")}
            disabled={processando}
            title="Cancelar e devolver estoque"
            className="bg-red-500 px-3 py-1.5 rounded-lg text-white text-sm hover:bg-red-600 shadow-sm disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  const sections = [
    { title: "Hoje", data: pedidosHoje, icon: <FaBox className="text-green-500" /> },
    { title: "Futuros", data: pedidosFuturos, icon: <FaCalendarAlt className="text-yellow-500" /> },
    { title: "Sem Data", data: pedidosSemData, icon: <FaCalendarAlt className="text-red-500" /> },
  ];

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <FaClock className="text-blue-500" /> Pedidos
      </h2>

      {sections.map((section) => (
        <section key={section.title}>
          <h3 className="text-xl text-gray-700 mb-3 font-semibold flex items-center gap-2">
            {section.icon} Pedidos {section.title}
          </h3>

          {section.data.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum pedido {section.title.toLowerCase()}.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.data.map((pedido) => (
                <CardPedido key={pedido.id} pedido={pedido} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
