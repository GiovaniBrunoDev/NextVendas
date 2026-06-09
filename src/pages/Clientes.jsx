import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Edit3,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  UserRound,
  UsersRound,
} from "lucide-react";
import api from "../services/api";
import ClienteModal from "../components/ClienteModal";
import { toast } from "react-toastify";

function enderecoCurto(cliente) {
  return [cliente.endereco, cliente.bairro, cliente.cidade].filter(Boolean).join(", ");
}

function enderecoCompleto(cliente) {
  return [cliente.endereco, cliente.bairro, cliente.cidade, cliente.estado, cliente.cep].filter(Boolean).join(", ");
}

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function dataCurta(valor) {
  if (!valor) return "Sem compras";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Sem compras";
  return data.toLocaleDateString("pt-BR");
}

function whatsappUrl(telefone) {
  const digitos = String(telefone || "").replace(/\D/g, "");
  if (!digitos) return "";
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}`;
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregarClientes = async () => {
    try {
      setCarregando(true);
      const [resClientes, resVendas] = await Promise.allSettled([
        api.get("/clientes"),
        api.get("/vendas"),
      ]);

      if (resClientes.status === "fulfilled") {
        setClientes(Array.isArray(resClientes.value.data) ? resClientes.value.data : []);
      } else {
        toast.error("Erro ao carregar clientes");
      }

      if (resVendas.status === "fulfilled") {
        setVendas(Array.isArray(resVendas.value.data) ? resVendas.value.data : []);
      } else {
        setVendas([]);
      }
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    } finally {
      setCarregando(false);
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

  const clientesFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    if (!texto) return clientes;

    return clientes.filter((cliente) => {
      const endereco = enderecoCurto(cliente).toLowerCase();
      return cliente.nome?.toLowerCase().includes(texto) || cliente.telefone?.toLowerCase().includes(texto) || endereco.includes(texto);
    });
  }, [busca, clientes]);

  const resumo = useMemo(
    () => ({
      total: clientes.length,
      comTelefone: clientes.filter((cliente) => cliente.telefone).length,
      comEndereco: clientes.filter((cliente) => enderecoCurto(cliente)).length,
      compraram: new Set(vendas.map((venda) => venda.clienteId).filter(Boolean)).size,
    }),
    [clientes, vendas]
  );

  const historicoPorCliente = useMemo(() => {
    const mapa = new Map();

    vendas.forEach((venda) => {
      if (!venda.clienteId) return;
      const atual = mapa.get(venda.clienteId) || {
        compras: 0,
        total: 0,
        ultimaCompra: null,
      };
      atual.compras += 1;
      atual.total += Number(venda.total || 0);
      if (!atual.ultimaCompra || new Date(venda.data) > new Date(atual.ultimaCompra)) {
        atual.ultimaCompra = venda.data;
      }
      mapa.set(venda.clienteId, atual);
    });

    return mapa;
  }, [vendas]);

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre contatos, endereco de entrega e observacoes uteis para venda e pedido.
          </p>
        </div>
        <button onClick={abrirNovoCliente} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          <Plus size={17} />
          Novo cliente
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Clientes", value: resumo.total, icon: UsersRound },
          { label: "Com telefone", value: resumo.comTelefone, icon: Phone },
          { label: "Com endereço", value: resumo.comEndereco, icon: MapPin },
          { label: "Já compraram", value: resumo.compraram, icon: ShoppingBag },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
              <Icon size={14} /> {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <label className="relative block">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, telefone ou endereco"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </label>
        </div>

        <div className="p-4">
          {carregando ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <UserRound size={32} className="mb-3 text-slate-400" />
              <p className="text-sm font-medium text-slate-900">Nenhum cliente encontrado</p>
              <p className="mt-1 text-sm text-slate-500">Cadastre um cliente novo ou ajuste a busca.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {clientesFiltrados.map((cliente) => {
                const endereco = enderecoCurto(cliente);
                const enderecoMapa = enderecoCompleto(cliente);
                const whatsapp = whatsappUrl(cliente.telefone);
                const historico = historicoPorCliente.get(cliente.id) || {
                  compras: 0,
                  total: 0,
                  ultimaCompra: null,
                };
                const ticketMedio = historico.compras ? historico.total / historico.compras : 0;

                return (
                  <article key={cliente.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <UserRound size={21} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-slate-950">{cliente.nome}</h2>
                          <p className="text-xs text-slate-500">Cliente #{cliente.id}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => editarCliente(cliente)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-white hover:text-slate-900"
                        title="Editar cliente"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-slate-500">
                        <Phone size={15} />
                        <span className="font-medium text-slate-700">{cliente.telefone || "Sem telefone"}</span>
                      </p>
                      <p className="flex items-start gap-2 text-slate-500">
                        <MapPin size={15} className="mt-0.5" />
                        <span>{endereco || "Sem endereço cadastrado"}</span>
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <ClientMetric label="Compras" value={historico.compras} />
                      <ClientMetric label="Total" value={moeda(historico.total)} />
                      <ClientMetric label="Ticket" value={moeda(ticketMedio)} />
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      <CalendarDays size={14} />
                      <span>Última compra: <strong className="font-semibold text-slate-700">{dataCurta(historico.ultimaCompra)}</strong></span>
                    </div>

                    {cliente.observacoes && (
                      <p className="mt-4 line-clamp-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {cliente.observacoes}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <MessageCircle size={15} /> WhatsApp
                        </a>
                      )}
                      {enderecoMapa && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoMapa)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <MapPin size={15} /> Maps
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

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

function ClientMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-slate-950" title={String(value)}>
        {value}
      </p>
    </div>
  );
}
