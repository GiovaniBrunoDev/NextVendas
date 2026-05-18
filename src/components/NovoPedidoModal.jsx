import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import Select from "react-select";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  FileText,
  MapPin,
  PackageCheck,
  Phone,
  Store,
  Truck,
  User,
  X,
} from "lucide-react";
import { SiPix } from "react-icons/si";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const labelClass = "mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500";

const formasPagamento = [
  { value: "pix", label: "Pix", icon: SiPix },
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "cartao", label: "Cartao", icon: CreditCard },
];

function formatTelefone(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1)$2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2")
    .substring(0, 14);
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function NovoPedidoModal({ carrinho, aoFechar, aoConfirmar }) {
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [tipoEntrega, setTipoEntrega] = useState("retirada");
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [horarioEntrega, setHorarioEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [carregando, setCarregando] = useState(false);

  const totalProdutos = useMemo(
    () => carrinho.reduce((soma, item) => soma + item.qtd * item.preco, 0),
    [carrinho]
  );
  const totalFinal =
    totalProdutos + (tipoEntrega === "entrega" ? Number(taxaEntrega || 0) : 0);

  const opcoesClientes = clientes.map((cliente) => ({
    value: cliente.id,
    label: cliente.telefone ? `${cliente.nome} (${cliente.telefone})` : cliente.nome,
  }));

  useEffect(() => {
    carregarClientes();
    const modal = document.getElementById("novo-pedido-modal");
    if (modal) modal.scrollTop = 0;

    const listener = (e) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [aoFechar]);

  async function carregarClientes() {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error("Erro ao carregar clientes", err);
    }
  }

  function selecionarCliente(opcao) {
    const id = opcao?.value || "";
    setClienteSelecionado(id);

    if (!id) {
      setEndereco("");
      return;
    }

    const cliente = clientes.find((item) => item.id === id);
    setEndereco(cliente?.endereco || "");
  }

  async function handleSalvarPedido() {
    try {
      setCarregando(true);

      let clienteId = null;
      const enderecoFinal = tipoEntrega === "entrega" ? endereco.trim() : "";

      if (clienteSelecionado && !isNaN(parseInt(clienteSelecionado))) {
        clienteId = parseInt(clienteSelecionado);
        if (enderecoFinal) {
          await api.put(`/clientes/${clienteId}`, { endereco: enderecoFinal });
        }
      } else if (clienteNome.trim()) {
        const res = await api.post("/clientes", {
          nome: clienteNome.trim(),
          telefone: clienteTelefone.trim() || null,
          endereco: enderecoFinal || null,
        });
        clienteId = res.data.id;
      }

      const produtos = carrinho.map((item) => {
        if (!item.variacaoId) {
          throw new Error(`Produto "${item.nome}" nao possui variacao selecionada.`);
        }
        if (!item.preco) {
          throw new Error(`Produto "${item.nome}" nao tem preco definido.`);
        }

        return {
          variacaoProdutoId: item.variacaoId,
          quantidade: item.qtd,
          precoUnitario: item.preco,
          subtotal: item.qtd * item.preco,
        };
      });

      await api.post("/pedidos", {
        clienteId: clienteId || null,
        dataEntrega: dataEntrega || null,
        horarioEntrega: horarioEntrega || null,
        tipoEntrega,
        endereco: enderecoFinal || null,
        entregador: null,
        formaPagamento,
        taxaEntrega: tipoEntrega === "entrega" ? Number(taxaEntrega || 0) : 0,
        observacoes: observacoes.trim() || null,
        total: totalFinal,
        itens: produtos,
      });

      toast.success("Pedido criado e estoque reservado.");
      aoConfirmar();
      aoFechar();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Erro ao salvar pedido.");
    } finally {
      setCarregando(false);
    }
  }

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 40,
      borderColor: state.isFocused ? "#10b981" : "#d4d4d8",
      boxShadow: state.isFocused ? "0 0 0 2px #d1fae5" : "none",
      "&:hover": { borderColor: "#10b981" },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/45 px-3 backdrop-blur-sm">
      <div
        id="novo-pedido-modal"
        className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Novo pedido</h2>
            <p className="text-sm text-zinc-500">{carrinho.length} item(ns) no pedido</p>
          </div>
          <button
            onClick={aoFechar}
            className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                <User size={17} className="text-emerald-600" /> Cliente
              </h3>

              <Select
                options={opcoesClientes}
                value={opcoesClientes.find((opt) => opt.value === clienteSelecionado) || null}
                onChange={selecionarCliente}
                placeholder="Selecionar cliente cadastrado"
                isClearable
                styles={selectStyles}
                menuPortalTarget={document.body}
              />

              {!clienteSelecionado && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      <User size={14} /> Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Cliente novo"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <Phone size={14} /> Telefone
                    </label>
                    <input
                      type="text"
                      placeholder="(00)00000-0000"
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(formatTelefone(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                <CalendarDays size={17} className="text-amber-600" /> Agenda
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <CalendarDays size={14} /> Data
                  </label>
                  <input
                    type="date"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Horario</label>
                  <input
                    type="time"
                    value={horarioEntrega}
                    onChange={(e) => setHorarioEntrega(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                <Truck size={17} className="text-cyan-700" /> Entrega
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Retirada", value: "retirada", icon: Store },
                  { label: "Entrega", value: "entrega", icon: Truck },
                ].map((opcao) => {
                  const Icon = opcao.icon;
                  const ativo = tipoEntrega === opcao.value;

                  return (
                    <button
                      key={opcao.value}
                      onClick={() => setTipoEntrega(opcao.value)}
                      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                        ativo
                          ? "border-cyan-700 bg-cyan-700 text-white"
                          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <Icon size={16} /> {opcao.label}
                    </button>
                  );
                })}
              </div>

              {tipoEntrega === "entrega" && (
                <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                  <div>
                    <label className={labelClass}>
                      <MapPin size={14} /> Endereco
                    </label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua, numero, bairro"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Taxa</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={taxaEntrega}
                      onChange={(e) => setTaxaEntrega(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                <CreditCard size={17} className="text-rose-600" /> Pagamento
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {formasPagamento.map((opcao) => {
                  const Icon = opcao.icon;
                  const ativo = formaPagamento === opcao.value;

                  return (
                    <button
                      key={opcao.value}
                      onClick={() => setFormaPagamento(opcao.value)}
                      className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-md border px-2 text-xs font-semibold transition ${
                        ativo
                          ? "border-rose-500 bg-rose-50 text-rose-700"
                          : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      <Icon size={18} /> {opcao.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <label className={labelClass}>
                <FileText size={14} /> Observacoes
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Detalhes combinados com o cliente"
                className={`${inputClass} resize-none`}
              />
            </section>
          </div>

          <aside className="flex flex-col rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800">
                <PackageCheck size={17} className="text-emerald-600" /> Resumo
              </h3>
            </div>

            <div className="max-h-64 flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-3">
                {carrinho.map((item) => (
                  <div
                    key={`${item.produtoId}-${item.variacaoId}`}
                    className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between gap-3 text-sm font-semibold text-zinc-800">
                      <span>{item.nome}</span>
                      <span>{moeda(item.preco * item.qtd)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Tam. {item.numeracao} | {item.qtd} un. | {moeda(item.preco)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-200 px-4 py-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Produtos</span>
                <span>{moeda(totalProdutos)}</span>
              </div>
              {tipoEntrega === "entrega" && (
                <div className="flex justify-between text-zinc-600">
                  <span>Taxa</span>
                  <span>{moeda(taxaEntrega)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-xl font-bold text-zinc-950">
                <span>Total</span>
                <span className="text-emerald-700">{moeda(totalFinal)}</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-zinc-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={aoFechar}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvarPedido}
            disabled={carregando}
            className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Salvando..." : "Salvar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
