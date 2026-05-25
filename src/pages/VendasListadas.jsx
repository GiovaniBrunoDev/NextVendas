import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { CreditCard, Search } from "lucide-react";
import { toast } from "react-toastify";
import VendaDetalhesModal from "../components/VendaDetalhesModal";
import TrocaModal from "../components/TrocaModal";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const formatarData = (data) =>
  new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const nomeItemVenda = (item) =>
  item.variacaoProduto?.produto?.nome || item.nomeManual || item.nome || "Produto";

const descricaoItemVenda = (item) => {
  const numeracao = item.variacaoProduto?.numeracao || item.numeracaoManual;
  return `${nomeItemVenda(item)} ${numeracao ? numeracao : ""} (${item.quantidade}x)`;
};

export default function VendasListadas() {
  const [mostrarTrocaModal, setMostrarTrocaModal] = useState(false);
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarVendas() {
    try {
      setCarregando(true);
      const res = await api.get("/vendas");
      setVendas(res.data);
      setVendaSelecionada((selecionada) => {
        if (!selecionada) return null;
        return res.data.find((venda) => venda.id === selecionada.id) || null;
      });
    } catch (err) {
      toast.error("Erro ao carregar vendas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarVendas();
  }, []);

  const vendasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return vendas;

    return vendas.filter((venda) => {
      const cliente = venda.cliente?.nome.toLowerCase() || "";
      const pagamento = venda.formaPagamento?.toLowerCase() || "";
      const id = String(venda.id);
      const itens = venda.itens
        .map((item) => nomeItemVenda(item).toLowerCase())
        .join(" ");

      return cliente.includes(termo) || pagamento.includes(termo) || itens.includes(termo) || id.includes(termo);
    });
  }, [vendas, busca]);

  const resumo = useMemo(() => {
    const total = vendasFiltradas.reduce((soma, venda) => soma + venda.total, 0);
    const itens = vendasFiltradas.reduce(
      (soma, venda) => soma + venda.itens.reduce((sub, item) => sub + item.quantidade, 0),
      0
    );
    const ticket = vendasFiltradas.length ? total / vendasFiltradas.length : 0;

    return { total, itens, ticket, quantidade: vendasFiltradas.length };
  }, [vendasFiltradas]);

  const deletarVenda = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta venda? Esta ação não pode ser desfeita.")) return;

    try {
      await api.delete(`/vendas/${id}`);
      toast.success("Venda excluída com sucesso!");
      setVendaSelecionada(null);
      carregarVendas();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir a venda.");
    }
  };

  const atualizarVenda = async (dados) => {
    if (!vendaSelecionada) return;

    try {
      const { data } = await api.put(`/vendas/${vendaSelecionada.id}`, dados);
      setVendaSelecionada(data);
      setVendas((prev) => prev.map((venda) => (venda.id === data.id ? data : venda)));
      toast.success("Venda atualizada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar a venda.");
      throw error;
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

  const abrirModal = (venda) => setVendaSelecionada(venda);
  const fecharModal = () => setVendaSelecionada(null);

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando vendas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Histórico de vendas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulte vendas, edite dados operacionais, realize trocas e exclua registros.
          </p>
        </div>
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente, produto ou pagamento"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Vendas", value: resumo.quantidade },
          { label: "Faturamento", value: formatCurrency(resumo.total) },
          { label: "Itens vendidos", value: resumo.itens },
          { label: "Ticket médio", value: formatCurrency(resumo.ticket) },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Venda</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Itens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendasFiltradas.length > 0 ? (
              vendasFiltradas.map((venda) => (
                <tr
                  key={venda.id}
                  className="cursor-pointer transition hover:bg-slate-50"
                  onClick={() => abrirModal(venda)}
                >
                  <td className="px-4 py-3 font-semibold text-slate-950">#{venda.id}</td>
                  <td className="px-4 py-3 text-slate-500">{formatarData(venda.data)}</td>
                  <td className="px-4 py-3">
                    {venda.cliente ? (
                      <>
                        <div className="font-medium text-slate-900">{venda.cliente.nome}</div>
                        <div className="text-xs text-slate-500">{venda.cliente.telefone || "Sem telefone"}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">Sem cliente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-950">{formatCurrency(venda.total)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                      <CreditCard className="h-3 w-3" />
                      {venda.formaPagamento || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="max-w-xs truncate">
                      {venda.itens
                        .map(descricaoItemVenda)
                        .join(", ")}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                  Nenhuma venda encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {vendasFiltradas.length > 0 ? (
          vendasFiltradas.map((venda) => (
            <button
              type="button"
              key={venda.id}
              className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"
              onClick={() => abrirModal(venda)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">Venda #{venda.id}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatarData(venda.data)}</p>
                </div>
                <p className="font-semibold text-slate-950">{formatCurrency(venda.total)}</p>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                {venda.cliente?.nome || "Sem cliente"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700">
                  {venda.formaPagamento || "N/A"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700">
                  {venda.itens.length} itens
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
            Nenhuma venda encontrada.
          </div>
        )}
      </div>

      <VendaDetalhesModal
        venda={vendaSelecionada}
        aberto={!!vendaSelecionada}
        aoFechar={fecharModal}
        aoExcluir={deletarVenda}
        aoAtualizar={atualizarVenda}
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
