import { useEffect, useMemo, useState } from "react";
import { Edit3, MapPin, Phone, Plus, Search, UserRound, UsersRound } from "lucide-react";
import api from "../services/api";
import ClienteModal from "../components/ClienteModal";
import { toast } from "react-toastify";

function enderecoCurto(cliente) {
  return [cliente.endereco, cliente.bairro, cliente.cidade].filter(Boolean).join(", ");
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(Array.isArray(res.data) ? res.data : []);
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
    }),
    [clientes]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
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

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Clientes", value: resumo.total, icon: UsersRound },
          { label: "Com telefone", value: resumo.comTelefone, icon: Phone },
          { label: "Com endereço", value: resumo.comEndereco, icon: MapPin },
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

                return (
                  <article key={cliente.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50">
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

                    {cliente.observacoes && (
                      <p className="mt-4 line-clamp-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {cliente.observacoes}
                      </p>
                    )}
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
