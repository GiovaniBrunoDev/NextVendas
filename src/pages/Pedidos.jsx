import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaCalendarAlt, FaCheck, FaTimes, FaClock, FaBox, FaEdit } from "react-icons/fa";

export default function Pedidos() {
  const [pedidosHoje, setPedidosHoje] = useState([]);
  const [pedidosFuturos, setPedidosFuturos] = useState([]);
  const [pedidosSemData, setPedidosSemData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://nextpdv.onrender.com";

  const carregarPedidos = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/pedidos`);
      const hojeStr = new Date().toISOString().split("T")[0];
      const hoje = [], futuros = [], semData = [];

      data.forEach((p) => {
        if (!p.dataEntrega) semData.push(p);
        else {
          const dataEntregaStr = new Date(p.dataEntrega).toISOString().split("T")[0];
          if (dataEntregaStr === hojeStr) hoje.push(p);
          else if (new Date(p.dataEntrega) > new Date()) futuros.push(p);
        }
      });

      setPedidosHoje(hoje);
      setPedidosFuturos(futuros);
      setPedidosSemData(semData);
    } catch (err) {
      toast.error("Erro ao carregar pedidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/pedidos/${id}/status`, { status });
      toast.success(`Pedido #${id} → ${status}`);

      if (status === "confirmado") {
        await axios.post(`${API_URL}/pedidos/${id}/confirmar`);
        toast.success(`Pedido #${id} convertido em venda!`);
      }

      carregarPedidos();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar pedido.");
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const CardPedido = ({ pedido }) => (
    <motion.div
      className="bg-[#1f1f1f] p-4 rounded-xl border border-gray-700 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-semibold">Pedido #{pedido.id}</h3>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            pedido.status === "agendado"
              ? "bg-yellow-500/20 text-yellow-400"
              : pedido.status === "reservado"
              ? "bg-blue-500/20 text-blue-400"
              : pedido.status === "cancelado"
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {pedido.status}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-1">
        Cliente: {pedido.cliente?.nome || "Não informado"}
      </p>
      <p className="text-gray-400 text-xs mb-3 flex items-center gap-1">
        <FaCalendarAlt className="text-blue-400" />
        {pedido.dataEntrega
          ? new Date(pedido.dataEntrega).toLocaleDateString("pt-BR")
          : "Sem data definida"}
      </p>

      <ul className="text-gray-300 text-sm mb-3">
        {pedido.itens.map((i) => (
          <li key={i.id}>
            {i.variacaoProduto.produto.nome} ({i.variacaoProduto.numeracao}) × {i.quantidade}
          </li>
        ))}
      </ul>

      <p className="text-gray-300 font-semibold mb-2">
        Total: R$ {pedido.total.toFixed(2)}
      </p>

      <div className="flex gap-2">
        {pedido.status !== "cancelado" && (
          <>
            <button
              onClick={() => atualizarStatus(pedido.id, "confirmado")}
              className="bg-blue-600 px-3 py-1 rounded text-white text-sm hover:bg-blue-700"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => atualizarStatus(pedido.id, "cancelado")}
              className="bg-red-600 px-3 py-1 rounded text-white text-sm hover:bg-red-700"
            >
              <FaTimes />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full"
        ></motion.div>
      </div>
    );

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
        <FaClock className="text-blue-400" /> Pedidos
      </h2>

      {[{ title: "Hoje", data: pedidosHoje, icon: <FaBox className="text-green-400" /> },
        { title: "Futuros", data: pedidosFuturos, icon: <FaCalendarAlt className="text-yellow-400" /> },
        { title: "Sem Data", data: pedidosSemData, icon: <FaCalendarAlt className="text-red-400" /> }
      ].map((section) => (
        <section key={section.title}>
          <h3 className="text-xl text-white mb-3 flex items-center gap-2">
            {section.icon} Pedidos {section.title}
          </h3>
          {section.data.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum pedido {section.title.toLowerCase()}.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.data.map((p) => (
                <CardPedido key={p.id} pedido={p} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
