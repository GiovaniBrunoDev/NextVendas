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
import useModalPresence from "../hooks/useModalPresence";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white";

const labelClass = "mb-1 flex items-center gap-2 text-xs font-medium uppercase text-slate-500";

const formasPagamento = [
  { value: "pix", label: "Pix", icon: SiPix },
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "cartao", label: "Cartão", icon: CreditCard },
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
  useModalPresence();

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
          throw new Error(`Produto "${item.nome}" não possui variação selecionada.`);
        }
        if (!item.preco) {
          throw new Error(`Produto "${item.nome}" não tem preço definido.`);
        }

        return {
          variacaoProdutoId: item.variacaoId,
          quantidade: item.qtd,
          precoUnitario: item.preco,
          subtotal: item.qtd * item.preco,
        };
      });

      const { data } = await api.post("/pedidos", {
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
      aoConfirmar(data.pedido);
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
      borderColor: state.isFocused ? "#94a3b8" : "#e2e8f0",
      boxShadow: "none",
      backgroundColor: "#f8fafc",
      "&:hover": { borderColor: "#94a3b8" },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 px-3 backdrop-blur-sm">
      <div
        id="novo-pedido-modal"
        className="relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Novo pedido</h2>
            <p className="text-sm text-slate-500">{carrinho.length} item(ns) no pedido</p>
          </div>
          <button
            onClick={aoFechar}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <User size={17} className="text-slate-500" /> Cliente
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
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
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
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Truck size={17} className="text-slate-500" /> Entrega
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
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                      <MapPin size={14} /> Endereço
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
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <CreditCard size={17} className="text-slate-500" /> Pagamento
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
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
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
                <FileText size={14} /> Observações
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

          <aside className="flex flex-col rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <PackageCheck size={17} className="text-slate-500" /> Resumo
              </h3>
            </div>

            <div className="max-h-64 flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-3">
                {carrinho.map((item) => (
                  <div
                    key={`${item.produtoId}-${item.variacaoId}`}
                    className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between gap-3 text-sm font-medium text-slate-950">
                      <span>{item.nome}</span>
                      <span>{moeda(item.preco * item.qtd)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Tam. {item.numeracao} | {item.qtd} un. | {moeda(item.preco)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 px-4 py-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Produtos</span>
                <span>{moeda(totalProdutos)}</span>
              </div>
              {tipoEntrega === "entrega" && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxa</span>
                  <span>{moeda(taxaEntrega)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-xl font-semibold text-slate-950">
                <span>Total</span>
                <span>{moeda(totalFinal)}</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={aoFechar}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvarPedido}
            disabled={carregando}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Salvando..." : "Salvar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
