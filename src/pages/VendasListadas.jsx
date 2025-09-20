import { useEffect, useState } from "react";
import api from "../services/api";
import { Search, CreditCard } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
import VendaDetalhesModal from "../components/VendaDetalhesModal";
import TrocaModal from "../components/TrocaModal";
import { motion } from "framer-motion"; // 👈 precisa do framer-motion instalado


export default function VendasListadas() {
  const [mostrarTrocaModal, setMostrarTrocaModal] = useState(false);
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true); // 👈 novo state


    async function carregarVendas() {
    try {
      setCarregando(true);
      const res = await api.get("/vendas");
      setVendas(res.data);
    } catch (err) {
      toast.error("Erro ao carregar vendas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarVendas();
  }, []);

  const deletarVenda = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta venda? Esta ação não pode ser desfeita.")) return;

    try {
      await api.delete(`/vendas/${id}`);
      toast.success("Venda excluída com sucesso!");
      fecharModal();
      carregarVendas();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir a venda.");
    }
  };

  const confirmarTroca = async (dadosTroca) => {
    try {
      const res = await api.post("/vendas/troca", dadosTroca);
      const vendaAtualizada = res.data.venda;
      toast.success("Troca realizada com sucesso!");
      await carregarVendas();
      if (vendaAtualizada) setVendaSelecionada(vendaAtualizada);
      setMostrarTrocaModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar troca.");
    }
  };

  const vendasFiltradas = vendas.filter((venda) => {
    const termo = busca.toLowerCase();
    const cliente = venda.cliente?.nome.toLowerCase() || "";
    const pagamento = venda.formaPagamento?.toLowerCase() || "";
    const itens = venda.itens.map((item) => item.variacaoProduto.produto.nome.toLowerCase()).join(" ");
    return cliente.includes(termo) || pagamento.includes(termo) || itens.includes(termo);
  });

  const formatarData = (data) => new Date(data).toLocaleString("pt-BR");

  const corPagamento = (forma) => {
    if (!forma) return "bg-gray-300 text-gray-800";
    if (forma.toLowerCase().includes("pix")) return "bg-green-100 text-green-700";
    if (forma.toLowerCase().includes("credito")) return "bg-blue-100 text-blue-700";
    if (forma.toLowerCase().includes("debito")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const abrirModal = (venda) => setVendaSelecionada(venda);
  const fecharModal = () => setVendaSelecionada(null);

   // 🔥 Tela de carregamento
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.svg
          className="w-16 h-16 text-gray-600"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset="60"
          />
        </motion.svg>

        <motion.p
          className="mt-6 text-gray-600 font-medium text-lg tracking-wide"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Carregando Vendas...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
  <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Histórico de Vendas</h1>

  {/* Filtro de busca */}
  <div className="mb-6 relative z-20">
    <div className="relative">
      <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Buscar por cliente, produto ou pagamento..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
    </div>
  </div>

  {/* Desktop: Tabela */}
  <div className="hidden sm:block overflow-x-auto rounded-lg shadow">
    <table className="w-full bg-white text-sm">
      <thead className="bg-gray-100 text-gray-600 text-left">
        <tr>
          <th className="p-3">ID</th>
          <th className="p-3">Data</th>
          <th className="p-3">Cliente</th>
          <th className="p-3">Total</th>
          <th className="p-3">Pagamento</th>
          <th className="p-3">Itens</th>
        </tr>
      </thead>
      <tbody>
        {vendasFiltradas.length > 0 ? (
          vendasFiltradas.map((venda) => (
            <tr
              key={venda.id}
              className="border-t hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => abrirModal(venda)}
            >
              <td className="p-3 font-semibold text-gray-800">{venda.id}</td>
              <td className="p-3 text-gray-500">{formatarData(venda.data)}</td>
              <td className="p-3">
                {venda.cliente ? (
                  <>
                    <div className="font-medium text-gray-900">{venda.cliente.nome}</div>
                    <div className="text-xs text-gray-500">{venda.cliente.telefone}</div>
                  </>
                ) : (
                  <span className="italic text-gray-400">Sem cliente</span>
                )}
              </td>
              <td className="p-3 text-green-600 font-bold">R$ {venda.total.toFixed(2)}</td>
              <td className="p-3">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${corPagamento(venda.formaPagamento)}`}>
                  <CreditCard className="w-3 h-3 mr-1" />
                  {venda.formaPagamento || "N/A"}
                </span>
              </td>
              <td className="p-3">
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {venda.itens.map((item) => (
                    <li key={item.id}>
                      {item.variacaoProduto.produto.nome} - {item.variacaoProduto.numeracao} ({item.quantidade}x)
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center p-6 text-gray-500">
              Nenhuma venda encontrada.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile: Cards */}
  <div className="sm:hidden space-y-4">
    {vendasFiltradas.length > 0 ? (
      vendasFiltradas.map((venda) => (
        <div
          key={venda.id}
          className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white hover:shadow-md transition cursor-pointer"
          onClick={() => abrirModal(venda)}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">ID: {venda.id}</span>
            <span className="text-xs text-gray-500">{formatarData(venda.data)}</span>
          </div>

          <div className="text-sm text-gray-800 mb-2">
            <strong>Cliente:</strong>{" "}
            {venda.cliente ? (
              <span>{venda.cliente.nome} ({venda.cliente.telefone})</span>
            ) : (
              <span className="italic text-gray-400">Sem cliente</span>
            )}
          </div>

          <div className="text-sm text-gray-800 mb-2">
            <strong>Total:</strong> <span className="text-green-600 font-semibold">R$ {venda.total.toFixed(2)}</span>
          </div>

          <div className="text-sm text-gray-800 mb-2">
            <strong>Pagamento:</strong>{" "}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${corPagamento(venda.formaPagamento)}`}>
              <CreditCard className="w-3 h-3 mr-1" />
              {venda.formaPagamento || "N/A"}
            </span>
          </div>

          <div className="text-sm text-gray-800">
            <strong>Itens:</strong>
            <ul className="list-disc pl-5 text-gray-600 mt-1 space-y-1 text-xs">
              {venda.itens.map((item) => (
                <li key={item.id}>
                  {item.variacaoProduto.produto.nome} - {item.variacaoProduto.numeracao} ({item.quantidade}x)
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center text-gray-500 py-10">
        Nenhuma venda encontrada.
      </div>
    )}
  </div>

  {/* Modais */}
  <VendaDetalhesModal
    venda={vendaSelecionada}
    aberto={!!vendaSelecionada}
    aoFechar={fecharModal}
    aoExcluir={deletarVenda}
    aoTroca={(venda) => {
      setVendaSelecionada(venda);
      setMostrarTrocaModal(true);
    }}
  />
  <TrocaModal
    aberto={mostrarTrocaModal}
    venda={vendaSelecionada}
    aoFechar={() => setMostrarTrocaModal(false)}
    aoConfirmarTroca={confirmarTroca}
  />
</div>


  );
}
