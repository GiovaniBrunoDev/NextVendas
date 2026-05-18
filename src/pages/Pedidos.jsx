import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Timer,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";

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

function statusVisual(status) {
  const map = {
    agendado: "border-amber-200 bg-amber-50 text-amber-700",
    reservado: "border-cyan-200 bg-cyan-50 text-cyan-700",
    confirmado: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cancelado: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return map[status] || "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidoProcessando, setPedidoProcessando] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

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

  const confirmarPedido = async (id) => {
    try {
      setPedidoProcessando(id);
      await api.post(`/pedidos/${id}/confirmar`);
      toast.success(`Pedido #${id} lancado como venda.`);
      await carregarPedidos();
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
      toast.success(`Pedido #${id} cancelado e estoque devolvido.`);
      await carregarPedidos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erro ao cancelar pedido.");
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
    const total = pedidosComGrupo.reduce((soma, pedido) => soma + Number(pedido.total || 0), 0);
    const entregas = pedidosComGrupo.filter((pedido) => pedido.tipoEntrega === "entrega").length;

    return {
      totalPedidos: pedidosComGrupo.length,
      valorReservado: total,
      hoje: pedidosComGrupo.filter((pedido) => pedido.grupo === "hoje").length,
      atrasados: pedidosComGrupo.filter((pedido) => pedido.grupo === "atrasados").length,
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
      count: pedidosComGrupo.filter((pedido) => pedido.grupo === "futuros").length,
      icon: CalendarDays,
    },
    {
      id: "semData",
      label: "Sem data",
      count: pedidosComGrupo.filter((pedido) => pedido.grupo === "semData").length,
      icon: Clock3,
    },
  ];

  const pedidosFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return pedidosComGrupo.filter((pedido) => {
      const bateFiltro = filtro === "todos" || pedido.grupo === filtro;
      const itensTexto = pedido.itens
        ?.map((item) => `${item.variacaoProduto?.produto?.nome || ""} ${item.variacaoProduto?.numeracao || ""}`)
        .join(" ")
        .toLowerCase();
      const bateBusca =
        !texto ||
        String(pedido.id).includes(texto) ||
        pedido.cliente?.nome?.toLowerCase().includes(texto) ||
        itensTexto?.includes(texto);

      return bateFiltro && bateBusca;
    });
  }, [busca, filtro, pedidosComGrupo]);

  const CardPedido = ({ pedido }) => {
    const processando = pedidoProcessando === pedido.id;
    const podeFinalizar = ["reservado", "agendado", "confirmado"].includes(pedido.status);
    const itens = pedido.itens || [];
    const quantidadeItens = itens.reduce((soma, item) => soma + Number(item.quantidade || 0), 0);
    const primeiroItem = itens[0];
    const demaisItens = Math.max(itens.length - 1, 0);

    return (
      <motion.article
        className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Pedido</p>
            <h3 className="text-xl font-black text-zinc-900">#{pedido.id}</h3>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusVisual(
              pedido.status
            )}`}
          >
            {pedido.status}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-zinc-700">
          <p className="flex items-center gap-2">
            <UserRound size={16} className="text-emerald-600" />
            <span className="font-semibold text-zinc-900">
              {pedido.cliente?.nome || "Cliente nao informado"}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays size={16} className="text-amber-600" />
            <span>
              {formatarData(pedido.dataEntrega)}
              {pedido.horarioEntrega ? `, ${pedido.horarioEntrega}` : ""}
            </span>
          </p>
          <p className="flex items-center gap-2">
            {pedido.tipoEntrega === "entrega" ? (
              <Truck size={16} className="text-cyan-700" />
            ) : (
              <MapPin size={16} className="text-zinc-500" />
            )}
            <span className="capitalize">{pedido.tipoEntrega || "retirada"}</span>
          </p>
        </div>

        <div className="mt-4 rounded-md bg-zinc-50 px-3 py-3">
          <p className="text-sm font-semibold text-zinc-900">
            {primeiroItem
              ? `${primeiroItem.variacaoProduto?.produto?.nome || "Produto"} tam. ${
                  primeiroItem.variacaoProduto?.numeracao || "-"
                }`
              : "Sem itens"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {quantidadeItens} un.
            {demaisItens > 0 ? ` | +${demaisItens} item(ns)` : ""}
          </p>
        </div>

        {pedido.observacoes && (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-500">{pedido.observacoes}</p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Total</p>
            <p className="text-lg font-black text-emerald-700">{moeda(pedido.total)}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => confirmarPedido(pedido.id)}
              disabled={processando || !podeFinalizar}
              title="Confirmar e lancar como venda"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => cancelarPedido(pedido.id)}
              disabled={processando}
              title="Cancelar pedido"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </motion.article>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center bg-stone-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-12 w-12 rounded-full border-4 border-zinc-200 border-t-emerald-600"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-6 text-zinc-900 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
            <PackageCheck size={14} /> Reservas de estoque
          </div>
          <h2 className="text-3xl font-black text-zinc-950">Pedidos</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase text-zinc-400">Abertos</p>
            <p className="text-2xl font-black">{resumo.totalPedidos}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase text-zinc-400">Reservado</p>
            <p className="text-2xl font-black text-emerald-700">{moeda(resumo.valorReservado)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase text-zinc-400">Entregas</p>
            <p className="text-2xl font-black text-cyan-700">{resumo.entregas}</p>
          </div>
        </div>
      </header>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map((item) => {
            const Icon = item.icon;
            const ativo = filtro === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setFiltro(item.id)}
                className={`flex min-w-max items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition ${
                  ativo
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Icon size={16} />
                {item.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    ativo ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pedido, cliente ou produto"
            className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white px-6 text-center">
          <ShoppingBag size={34} className="mb-3 text-zinc-300" />
          <p className="text-lg font-bold text-zinc-800">Nenhum pedido encontrado</p>
          <p className="mt-1 text-sm text-zinc-500">Ajuste o filtro ou a busca.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pedidosFiltrados.map((pedido) => (
            <CardPedido key={pedido.id} pedido={pedido} />
          ))}
        </div>
      )}
    </div>
  );
}
