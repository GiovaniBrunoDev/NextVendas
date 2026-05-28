import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  PackageX,
  PencilLine,
  ReceiptText,
  Search,
  ShoppingBag,
  Timer,
  Truck,
} from "lucide-react";
import ReciboModal from "../components/ReciboModal";
import ConfirmarPedidoVendaModal from "../components/ConfirmarPedidoVendaModal";
import EditarPedidoModal from "../components/EditarPedidoModal";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataKey(date) {
  const valor = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(valor.getTime())) return "";

  const ano = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, "0");
  const dia = String(valor.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(value) {
  if (!value) return "Sem data";
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "Sem data";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function googleMapsUrl(endereco) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

function statusInfo(status) {
  const map = {
    agendado: { label: "Agendado", dotClass: "bg-amber-500" },
    reservado: { label: "Reservado", dotClass: "bg-emerald-500" },
    confirmado: { label: "Confirmado", dotClass: "bg-slate-500" },
    cancelado: { label: "Cancelado", dotClass: "bg-rose-500" },
  };

  return map[status] || map.reservado;
}

function grupoInfo(grupo) {
  const map = {
    hoje: { label: "Hoje", icon: Timer },
    atrasados: { label: "Atrasado", icon: AlertTriangle },
    futuros: { label: "Futuro", icon: CalendarDays },
    semData: { label: "Sem data", icon: Clock3 },
  };

  return map[grupo] || map.semData;
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoProcessando, setPedidoProcessando] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [recibo, setRecibo] = useState(null);
  const [pedidoParaConfirmar, setPedidoParaConfirmar] = useState(null);
  const [pedidoParaEditar, setPedidoParaEditar] = useState(null);

  const carregarPedidos = async () => {
    try {
      const { data } = await api.get("/pedidos");
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao carregar pedidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmarPedido = async (pedido, dadosVenda) => {
    try {
      setPedidoProcessando(pedido.id);
      const { data } = await api.post(`/pedidos/${pedido.id}/confirmar`, dadosVenda);
      toast.success(`Pedido #${pedido.id} lançado como venda.`);
      setPedidoParaConfirmar(null);
      await carregarPedidos();
      if (data?.venda) setRecibo({ tipo: "venda", registro: data.venda });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao confirmar pedido.");
    } finally {
      setPedidoProcessando(null);
    }
  };

  const cancelarPedido = async (id) => {
    try {
      setPedidoProcessando(id);
      await api.put(`/pedidos/${id}/status`, { status: "cancelado" });
      toast.success(`Pedido #${id} cancelado.`);
      await carregarPedidos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao cancelar pedido.");
    } finally {
      setPedidoProcessando(null);
    }
  };

  const editarPedido = async (pedido, dadosPedido) => {
    try {
      setPedidoProcessando(pedido.id);
      const { data } = await api.put(`/pedidos/${pedido.id}`, dadosPedido);
      toast.success(`Pedido #${pedido.id} atualizado.`);
      setPedidoParaEditar(null);
      await carregarPedidos();
      if (data?.pedido) {
        setPedidos((atuais) => atuais.map((item) => (item.id === data.pedido.id ? data.pedido : item)));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao editar pedido.");
    } finally {
      setPedidoProcessando(null);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const hoje = dataKey(new Date());

  const pedidosComGrupo = useMemo(
    () =>
      pedidos.map((pedido) => {
        const chaveEntrega = pedido.dataEntrega ? dataKey(pedido.dataEntrega) : "";
        let grupo = "semData";

        if (chaveEntrega) {
          if (chaveEntrega === hoje) grupo = "hoje";
          else if (chaveEntrega < hoje) grupo = "atrasados";
          else grupo = "futuros";
        }

        return { ...pedido, grupo };
      }),
    [pedidos, hoje]
  );

  const resumo = useMemo(() => {
    const ativos = pedidosComGrupo.filter((pedido) => pedido.status !== "cancelado");
    const valorReservado = ativos.reduce((soma, pedido) => soma + Number(pedido.total || 0), 0);
    const entregas = ativos.filter((pedido) => pedido.tipoEntrega === "entrega").length;

    return {
      totalPedidos: ativos.length,
      valorReservado,
      hoje: ativos.filter((pedido) => pedido.grupo === "hoje").length,
      atrasados: ativos.filter((pedido) => pedido.grupo === "atrasados").length,
      entregas,
    };
  }, [pedidosComGrupo]);

  const filtros = [
    { id: "todos", label: "Todos", count: resumo.totalPedidos, icon: ShoppingBag },
    { id: "hoje", label: "Hoje", count: resumo.hoje, icon: Timer },
    { id: "atrasados", label: "Atrasados", count: resumo.atrasados, icon: AlertTriangle },
    {
      id: "futuros",
      label: "Futuros",
      count: pedidosComGrupo.filter((pedido) => pedido.status !== "cancelado" && pedido.grupo === "futuros").length,
      icon: CalendarDays,
    },
    {
      id: "semData",
      label: "Sem data",
      count: pedidosComGrupo.filter((pedido) => pedido.status !== "cancelado" && pedido.grupo === "semData").length,
      icon: Clock3,
    },
  ];

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return pedidosComGrupo.filter((pedido) => {
      if (pedido.status === "cancelado" && filtro !== "todos") return false;

      const bateFiltro = filtro === "todos" || pedido.grupo === filtro;
      const itensTexto = pedido.itens
        ?.map(
          (item) =>
            `${item.variacaoProduto?.produto?.nome || item.nomeManual || item.nome || ""} ${
              item.variacaoProduto?.numeracao || item.numeracaoManual || ""
            }`
        )
        .join(" ")
        .toLowerCase();
      const bateBusca =
        !texto ||
        String(pedido.id).includes(texto) ||
        pedido.cliente?.nome?.toLowerCase().includes(texto) ||
        pedido.cliente?.telefone?.toLowerCase().includes(texto) ||
        itensTexto?.includes(texto);

      return bateFiltro && bateBusca;
    });
  }, [busca, filtro, pedidosComGrupo]);

  const CardPedido = ({ pedido }) => {
    const processando = pedidoProcessando === pedido.id;
    const cancelado = pedido.status === "cancelado";
    const podeFinalizar = !cancelado && ["reservado", "agendado", "confirmado"].includes(pedido.status);
    const itens = pedido.itens || [];
    const quantidadeItens = itens.reduce((soma, item) => soma + Number(item.quantidade || 0), 0);
    const status = statusInfo(pedido.status);
    const grupo = grupoInfo(pedido.grupo);
    const GrupoIcon = grupo.icon;
    const enderecoEntrega = (pedido.endereco || pedido.cliente?.endereco || "").trim();

    return (
      <motion.article
        className="lojia-surface overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(36,48,43,0.1)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-slate-500">Pedido #{pedido.id}</p>
              <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">
                {pedido.cliente?.nome || "Cliente não informado"}
              </h3>
              {pedido.cliente?.telefone && (
                <p className="mt-1 text-xs text-slate-500">{pedido.cliente.telefone}</p>
              )}
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
              {status.label}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
                <CalendarDays size={14} /> Agenda
              </p>
              <p className="mt-1 font-medium text-slate-950">
                {formatarData(pedido.dataEntrega)}
                {pedido.horarioEntrega ? `, ${pedido.horarioEntrega}` : ""}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
                <GrupoIcon size={14} /> {grupo.label}
              </p>
              <p className="mt-1 flex items-center gap-2 font-medium capitalize text-slate-950">
                {pedido.tipoEntrega === "entrega" ? <Truck size={15} /> : <MapPin size={15} />}
                {pedido.tipoEntrega || "retirada"}
              </p>
            </div>
          </div>

          {pedido.tipoEntrega === "entrega" && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
                <MapPin size={14} /> Endereço da entrega
              </p>
              {enderecoEntrega ? (
                <a
                  href={googleMapsUrl(enderecoEntrega)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex max-w-full items-center gap-2 text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:text-[#020C2C] hover:decoration-[#16A36B]"
                  title="Abrir no Google Maps"
                >
                  <span className="truncate">{enderecoEntrega}</span>
                  <ExternalLink size={14} className="shrink-0 text-slate-400" />
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Endereço não informado.</p>
              )}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <p className="text-xs font-medium uppercase text-slate-500">Itens do pedido</p>
              <span className="text-xs font-medium text-slate-500">{quantidadeItens} un.</span>
            </div>
            <div className="divide-y divide-slate-100">
              {itens.slice(0, 3).map((item) => (
                <div key={item.id || `${pedido.id}-${item.variacaoProdutoId}`} className="px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {item.variacaoProduto?.produto?.nome || item.nomeManual || item.nome || "Produto"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tam. {item.variacaoProduto?.numeracao || item.numeracaoManual || "-"} x {item.quantidade} | {moeda(item.precoUnitario)}
                  </p>
                </div>
              ))}
              {itens.length > 3 && (
                <p className="px-3 py-2 text-xs font-medium text-slate-500">+{itens.length - 3} item(ns)</p>
              )}
              {itens.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">Sem itens vinculados.</p>}
            </div>
          </div>

          {pedido.observacoes && (
            <p className="mt-3 line-clamp-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {pedido.observacoes}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-950">{moeda(pedido.total)}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRecibo({ tipo: "pedido", registro: pedido })}
              title="Gerar recibo"
              className="lojia-ghost-action inline-flex items-center justify-center px-3 py-2 text-slate-600"
            >
              <ReceiptText size={16} />
            </button>
            <button
              onClick={() => setPedidoParaEditar(pedido)}
              disabled={processando || cancelado}
              title="Editar pedido"
              className="lojia-ghost-action inline-flex items-center justify-center px-3 py-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PencilLine size={16} />
            </button>
            <button
              onClick={() => setPedidoParaConfirmar(pedido)}
              disabled={processando || !podeFinalizar}
              className="lojia-primary-action inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              Confirmar venda
            </button>
            <button
              onClick={() => cancelarPedido(pedido.id)}
              disabled={processando || cancelado}
              title="Cancelar pedido"
              className="lojia-ghost-action inline-flex items-center justify-center px-3 py-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PackageX size={16} />
            </button>
          </div>
        </div>
      </motion.article>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="lojia-hero-panel mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pedidos</h1>
          <p className="mt-1 text-sm text-white/68">
            Acompanhe reservas de estoque, entregas e pedidos prontos para virar venda.
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Ativos", value: resumo.totalPedidos },
          { label: "Reservado", value: moeda(resumo.valorReservado) },
          { label: "Hoje", value: resumo.hoje },
          { label: "Atrasados", value: resumo.atrasados },
          { label: "Entregas", value: resumo.entregas },
        ].map((item) => (
          <div key={item.label} className="lojia-surface p-4">
            <p className="text-xs font-medium uppercase text-slate-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="lojia-surface mb-6 overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_360px]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filtros.map((item) => {
              const Icon = item.icon;
              const ativo = filtro === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setFiltro(item.id)}
                  className={`flex min-w-max items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    ativo
                      ? "border-[#16A36B] bg-[#16A36B] text-white"
                      : "border-[#E5DED2] bg-white text-slate-700 hover:border-[#16A36B]/40 hover:bg-[#16A36B]/5"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                  <span className={ativo ? "text-white/70" : "text-slate-400"}>{item.count}</span>
                </button>
              );
            })}
          </div>

          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pedido, cliente ou produto"
              className="w-full rounded-lg border border-[#E5DED2] bg-[#FFFEFA] py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#16A36B] focus:bg-white"
            />
          </label>
        </div>

        <div className="p-4">
          {pedidosFiltrados.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <ShoppingBag size={30} className="mb-3 text-slate-400" />
              <p className="text-sm font-medium text-slate-900">Nenhum pedido encontrado</p>
              <p className="mt-1 text-sm text-slate-500">Ajuste o filtro ou a busca.</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {pedidosFiltrados.map((pedido) => (
                <CardPedido key={pedido.id} pedido={pedido} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ReciboModal
        aberto={!!recibo}
        tipo={recibo?.tipo}
        registro={recibo?.registro}
        aoFechar={() => setRecibo(null)}
      />

      {pedidoParaConfirmar && (
        <ConfirmarPedidoVendaModal
          pedido={pedidoParaConfirmar}
          carregando={pedidoProcessando === pedidoParaConfirmar.id}
          aoFechar={() => setPedidoParaConfirmar(null)}
          aoConfirmar={(dadosVenda) => confirmarPedido(pedidoParaConfirmar, dadosVenda)}
        />
      )}

      {pedidoParaEditar && (
        <EditarPedidoModal
          pedido={pedidoParaEditar}
          carregando={pedidoProcessando === pedidoParaEditar.id}
          aoFechar={() => setPedidoParaEditar(null)}
          aoSalvar={(dadosPedido) => editarPedido(pedidoParaEditar, dadosPedido)}
        />
      )}
    </div>
  );
}
