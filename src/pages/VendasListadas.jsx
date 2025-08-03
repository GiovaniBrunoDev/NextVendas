import { useEffect, useState } from "react";
import api from "../services/api";
import { Search, CalendarDays, CreditCard, X, Pencil, Trash } from "lucide-react";
import { DateRange } from "react-date-range";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import VendaDetalhesModal from "../components/VendaDetalhesModal";
import TrocaModal from "../components/TrocaModal";


export default function VendasListadas() {
  const [mostrarTrocaModal, setMostrarTrocaModal] = useState(false);
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [showCalendario, setShowCalendario] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [intervalo, setIntervalo] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },

  
  ]);

  async function carregarVendas() {
    const res = await api.get("/vendas");
    setVendas(res.data);
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

    // Atualiza lista geral
    await carregarVendas();

    // Atualiza modal em tempo real
    if (vendaAtualizada) {
      setVendaSelecionada(vendaAtualizada); // substitui pelos dados frescos
    }

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

    const dentroDoIntervalo = (() => {
      const dataVenda = new Date(venda.data);
      const start = intervalo[0].startDate;
      const end = intervalo[0].endDate;
      if (start && dataVenda < start) return false;
      if (end && dataVenda > end) return false;
      return true;
    })();

    return (cliente.includes(termo) || pagamento.includes(termo) || itens.includes(termo)) && dentroDoIntervalo;
  });

  const formatarData = (data) => new Date(data).toLocaleString("pt-BR");

  const corPagamento = (forma) => {
    if (!forma) return "bg-gray-300 text-gray-800";
    if (forma.toLowerCase().includes("pix")) return "bg-green-100 text-green-700";
    if (forma.toLowerCase().includes("credito")) return "bg-blue-100 text-blue-700";
    if (forma.toLowerCase().includes("debito")) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  const textoData = () => {
    const start = intervalo[0].startDate;
    const end = intervalo[0].endDate;
    if (!start && !end) return "Selecionar intervalo";
    if (start && !end) return `Desde ${format(start, "dd/MM/yyyy")}`;
    return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
  };

  const abrirModal = (venda) => setVendaSelecionada(venda);
  const fecharModal = () => setVendaSelecionada(null);

  

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Histórico de Vendas</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 relative z-20">
        {/* Busca */}
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

        {/* Intervalo */}
        <div className="relative">
          <button
            onClick={() => setShowCalendario(!showCalendario)}
            className="flex items-center w-full text-left px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
          >
            <CalendarDays className="text-gray-400 w-4 h-4 mr-2" />
            <span className="text-gray-700 truncate">{textoData()}</span>
          </button>

          {showCalendario && (
            <div className="absolute z-50 bg-white shadow-lg rounded mt-2">
              <DateRange
                locale={ptBR}
                editableDateInputs={true}
                onChange={(item) => setIntervalo([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={intervalo}
                maxDate={new Date()}
                rangeColors={["#3b82f6"]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg shadow">
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
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${corPagamento(
                        venda.formaPagamento
                      )}`}
                    >
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

      {/* Modal de detalhes */}
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
