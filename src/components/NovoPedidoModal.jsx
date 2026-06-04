import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import Select from "react-select";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaTimes } from "react-icons/fa";
import { CalendarDays, FileText, MapPin, PackageCheck, Store, Truck, User } from "lucide-react";
import useModalPresence from "../hooks/useModalPresence";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/10 sm:text-sm";

const fieldLabelClass = "mb-1.5 block text-xs font-semibold uppercase text-slate-500";

const panelClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(24,31,36,0.045)]";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 8,
    borderColor: state.isFocused ? "#16A34A" : "#e2e8f0",
    boxShadow: "none",
    fontSize: 16,
    "&:hover": { borderColor: "#16A34A" },
  }),
  menu: (base) => ({ ...base, zIndex: 10001 }),
  menuPortal: (base) => ({ ...base, zIndex: 10001 }),
};

const etapas = [
  { key: "cliente", title: "Cliente do pedido" },
  { key: "agenda", title: "Entrega e agenda" },
  { key: "resumo", title: "Conferência do pedido" },
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

function enderecoCompleto(cliente) {
  if (!cliente) return "";

  return [cliente.endereco, cliente.bairro, cliente.cidade, cliente.estado, cliente.cep]
    .filter(Boolean)
    .join(", ");
}

export default function NovoPedidoModal({ carrinho, aoFechar, aoConfirmar }) {
  useModalPresence();

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [tipoEntrega, setTipoEntrega] = useState("entrega");
  const [dataEntrega, setDataEntrega] = useState("");
  const [horarioEntrega, setHorarioEntrega] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("");
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
  const valorEntrega =
    tipoEntrega === "entrega" ? Number(String(taxaEntrega || "0").replace(",", ".")) || 0 : 0;
  const totalPedido = totalProdutos + valorEntrega;

  const opcoesClientes = useMemo(
    () =>
      clientes.map((cliente) => {
        const endereco = enderecoCompleto(cliente);
        return {
          value: cliente.id,
          label: [cliente.nome, cliente.telefone, endereco].filter(Boolean).join(" - "),
          nome: cliente.nome,
          telefone: cliente.telefone,
          endereco,
        };
      }),
    [clientes]
  );

  const clienteAtual = useMemo(
    () => clientes.find((cliente) => String(cliente.id) === String(clienteSelecionado)),
    [clienteSelecionado, clientes]
  );

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
      setClientes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar clientes", err);
    }
  }

  function selecionarCliente(opcao) {
    const id = opcao?.value || "";
    setClienteSelecionado(id);
    setClienteNome("");
    setClienteTelefone("");

    if (!id) {
      setEndereco("");
      return;
    }

    const cliente = clientes.find((item) => String(item.id) === String(id));
    setEndereco(enderecoCompleto(cliente));
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

      const itens = carrinho.map((item) => {
        if (!item.preco) {
          throw new Error(`Produto "${item.nome}" não tem preço definido.`);
        }

        if (item.manual || !item.variacaoId || String(item.variacaoId).startsWith("manual-")) {
          return {
            tipo: "manual",
            manual: true,
            nomeManual: item.nome,
            numeracaoManual: item.numeracao || null,
            quantidade: item.qtd,
            precoUnitario: item.preco,
            custoUnitario: item.custoUnitario || 0,
            outrosCustos: item.outrosCustos || 0,
            subtotal: item.qtd * item.preco,
          };
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
        taxaEntrega: tipoEntrega === "entrega" ? valorEntrega : 0,
        observacoes: observacoes.trim() || null,
        itens,
      });

      const temItemDeEstoque = carrinho.some(
        (item) => !item.manual && item.variacaoId && !String(item.variacaoId).startsWith("manual-")
      );
      toast.success(
        temItemDeEstoque
          ? "Pedido criado. Itens de estoque foram reservados."
          : "Pedido criado com item avulso."
      );
      aoConfirmar(data.pedido);
      aoFechar();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Erro ao salvar pedido.");
    } finally {
      setCarregando(false);
    }
  }

  const avancar = () => setEtapaAtual((valor) => Math.min(valor + 1, etapas.length - 1));
  const voltar = () => setEtapaAtual((valor) => Math.max(valor - 1, 0));
  const ultimaEtapa = etapaAtual === etapas.length - 1;
  const etapa = etapas[etapaAtual];
  const progresso = ((etapaAtual + 1) / etapas.length) * 100;

  const renderCliente = () => (
    <div className="space-y-4">
      <div className={panelClass}>
        <h3 className="mb-3 text-sm font-semibold text-slate-950">Cliente</h3>
        <Select
          options={opcoesClientes}
          value={opcoesClientes.find((opt) => String(opt.value) === String(clienteSelecionado)) || null}
          onChange={selecionarCliente}
          placeholder="Buscar cliente, telefone ou endereço"
          isClearable
          styles={selectStyles}
          menuPortalTarget={document.body}
          formatOptionLabel={(opcao, { context }) => (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{opcao.nome}</p>
              {context === "menu" && (
                <p className="truncate text-xs text-slate-500">
                  {[opcao.telefone, opcao.endereco || "Sem endereço"].filter(Boolean).join(" - ")}
                </p>
              )}
            </div>
          )}
        />
      </div>

      {!clienteSelecionado && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label>
            <span className={fieldLabelClass}>Nome</span>
            <input
              type="text"
              placeholder="Nome do novo cliente"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className={inputClass}
            />
          </label>
          <label>
            <span className={fieldLabelClass}>Telefone</span>
            <input
              type="text"
              placeholder="(00) 00000-0000"
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(formatTelefone(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500">
        {clienteSelecionado
          ? `Cliente selecionado: ${clienteAtual?.nome || "Cliente"}`
          : "Sem cliente selecionado. O pedido pode seguir normalmente."}
      </div>
    </div>
  );

  const renderAgenda = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid gap-3 min-[420px]:grid-cols-2">
        <label>
          <span className={fieldLabelClass}>Data de entrega</span>
          <input
            type="date"
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
            className={inputClass}
          />
        </label>
        <label>
          <span className={fieldLabelClass}>Horário</span>
          <input
            type="time"
            value={horarioEntrega}
            onChange={(e) => setHorarioEntrega(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

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
              type="button"
              onClick={() => setTipoEntrega(opcao.value)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition sm:px-4 sm:py-3 ${
                ativo
                  ? "border-[#0B1115] bg-[#0B1115] text-white shadow-[0_12px_24px_rgba(24,31,36,0.12)]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon size={17} /> {opcao.label}
            </button>
          );
        })}
      </div>

      {tipoEntrega === "entrega" ? (
        <div className="grid gap-3 min-[430px]:grid-cols-[minmax(0,1fr)_132px] sm:grid-cols-[1fr_160px]">
          <label>
            <span className={fieldLabelClass}>Endereço</span>
            <textarea
              rows={2}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade"
              className={`${inputClass} min-h-[92px] resize-none`}
            />
          </label>
          <label>
            <span className={fieldLabelClass}>Taxa de entrega</span>
            <input
              type="text"
              inputMode="decimal"
              value={taxaEntrega}
              onChange={(e) => setTaxaEntrega(e.target.value)}
              placeholder="0,00"
              className={inputClass}
            />
          </label>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
          Retirada selecionada. Pagamento, desconto e entregador serão informados somente ao confirmar a venda.
        </div>
      )}

      <label>
        <span className={fieldLabelClass}>Observações</span>
        <textarea
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Detalhes combinados com o cliente"
          className={`${inputClass} min-h-[86px] resize-none`}
        />
      </label>
    </div>
  );

  const renderResumo = () => (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
        <div className="border-b border-slate-200/80 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <PackageCheck size={17} className="text-[#16A34A]" /> Itens do pedido
          </h3>
        </div>
        <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
          {carrinho.map((item, index) => (
            <div key={`${item.produtoId}-${item.variacaoId}-${index}`} className="px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-slate-800">
                  {item.nome} {item.numeracao ? `(Tam. ${item.numeracao})` : ""}
                </span>
                <span className="shrink-0 font-medium text-slate-950">
                  {moeda(item.preco * item.qtd)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Qtd. {item.qtd}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoBox icon={User} label="Cliente" value={clienteAtual?.nome || clienteNome || "Não informado"} />
        <InfoBox icon={CalendarDays} label="Agenda" value={dataEntrega || "Sem data"} />
        <InfoBox icon={tipoEntrega === "entrega" ? Truck : Store} label="Entrega" value={tipoEntrega} />
        <InfoBox icon={MapPin} label="Endereço" value={tipoEntrega === "entrega" ? endereco || "Não informado" : "Retirada"} />
      </div>

      {observacoes && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <FileText size={16} /> Observações
          </p>
          <p className="mt-2 text-slate-500">{observacoes}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-[#0B1115] p-4 text-sm text-white shadow-[0_16px_34px_rgba(24,31,36,0.14)]">
        <div className="flex justify-between">
          <span className="text-white/62">Produtos</span>
          <span>{moeda(totalProdutos)}</span>
        </div>
        {tipoEntrega === "entrega" && (
          <div className="mt-2 flex justify-between">
            <span className="text-white/62">Taxa de entrega</span>
            <span>{moeda(valorEntrega)}</span>
          </div>
        )}
        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-xl font-semibold">
          <span>Total do pedido</span>
          <span>{moeda(totalPedido)}</span>
        </div>
        <p className="mt-2 text-xs text-white/62">
          Pagamento, desconto e entregador serão definidos ao confirmar a venda.
        </p>
      </div>
    </div>
  );

  const renderConteudo = () => {
    if (etapa.key === "cliente") return renderCliente();
    if (etapa.key === "agenda") return renderAgenda();
    return renderResumo();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex h-[100svh] items-end justify-center overflow-hidden bg-slate-950/50 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4">
      <div
        id="novo-pedido-modal"
        className="relative flex h-[100svh] max-h-[100svh] w-full max-w-2xl flex-col overflow-hidden rounded-none border border-slate-200/80 bg-[#FFFEFA] shadow-[0_28px_80px_rgba(24,31,36,0.24)] sm:h-auto sm:max-h-[92vh] sm:rounded-[24px]"
      >
        <div className="shrink-0 border-b border-slate-200/80 bg-[#FFFEFA] px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Criar pedido</h2>
            </div>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>

          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#F7F5EF]/50 px-3 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 sm:mb-5">
            <h3 className="mt-1 text-lg font-semibold text-slate-950">{etapa.title}</h3>
          </div>

          {renderConteudo()}
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {etapaAtual === 0 ? (
              <button
                type="button"
                onClick={aoFechar}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={voltar}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FaArrowLeft size={12} /> Voltar
              </button>
            )}

            {ultimaEtapa ? (
              <button
                type="button"
                onClick={handleSalvarPedido}
                disabled={carregando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(22,163,74,0.22)] transition hover:bg-[#0B1115] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? "Salvando..." : "Criar pedido"}
                {!carregando && <FaCheckCircle />}
              </button>
            ) : (
              <button
                type="button"
                onClick={avancar}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1115] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(24,31,36,0.16)] transition hover:bg-[#131C22]"
              >
                Próximo <FaArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
      <p className="flex items-center gap-2 font-semibold text-slate-950">
        <Icon size={16} /> {label}
      </p>
      <p className="mt-1 line-clamp-2 capitalize text-slate-500">{value}</p>
    </div>
  );
}
