import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaCreditCard, FaMoneyBillAlt, FaPercentage, FaTimes } from "react-icons/fa";
import { SiPix } from "react-icons/si";
import Select from "react-select";
import useModalPresence from "../hooks/useModalPresence";
import EntregadorSelect from "./EntregadorSelect";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16A36B] focus:ring-3 focus:ring-[#16A36B]/10 sm:text-sm";

const fieldLabelClass = "mb-1.5 block text-xs font-semibold uppercase text-slate-500";

const panelClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(24,31,36,0.045)]";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    borderRadius: 8,
    borderColor: state.isFocused ? "#16A36B" : "#e2e8f0",
    boxShadow: "none",
    fontSize: 16,
    "&:hover": { borderColor: "#16A36B" },
  }),
  menu: (base) => ({ ...base, zIndex: 10001 }),
  menuPortal: (base) => ({ ...base, zIndex: 10001 }),
};

const etapas = [
  { key: "cliente", label: "Cliente", title: "Cliente da venda" },
  { key: "entrega", label: "Entrega", title: "Entrega" },
  { key: "pagamento", label: "Pagamento", title: "Pagamento" },
  { key: "resumo", label: "Resumo", title: "Conferencia final" },
];

function enderecoCompleto(cliente) {
  if (!cliente) return "";

  return [cliente.endereco, cliente.bairro, cliente.cidade, cliente.estado, cliente.cep]
    .filter(Boolean)
    .join(", ");
}

export default function FinalizarVendaModal({ carrinho, aoFechar, aoFinalizar }) {
  useModalPresence();

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [tipoEntrega, setTipoEntrega] = useState("entrega");
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [entregador, setEntregador] = useState("");

  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [endereco, setEndereco] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor");
  const [carregando, setCarregando] = useState(false);

  const totalProdutos = carrinho.reduce((s, item) => s + item.qtd * item.preco, 0);
  const valorEntrega = tipoEntrega === "entrega" ? Number(taxaEntrega || 0) : 0;
  const totalAntesDesconto = totalProdutos + valorEntrega;
  const descontoDigitado = Number(String(desconto || "0").replace(",", "."));
  const percentualDesconto = Math.min(Math.max(descontoDigitado, 0), 100);
  const valorDesconto = tipoDesconto === "percentual"
    ? (totalAntesDesconto * percentualDesconto) / 100
    : descontoDigitado;
  const descontoAplicado = Math.min(Math.max(Number.isFinite(valorDesconto) ? valorDesconto : 0, 0), totalAntesDesconto);
  const totalFinal = Math.max(totalAntesDesconto - descontoAplicado, 0);

  const opcoes = useMemo(
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
    const modal = document.getElementById("finalizar-venda-modal");
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

  async function handleFinalizar() {
    try {
      setCarregando(true);
      let clienteId = null;

      if (clienteSelecionado && !isNaN(parseInt(clienteSelecionado))) {
        clienteId = parseInt(clienteSelecionado);
        if (endereco?.trim()) {
          await api.put(`/clientes/${clienteId}`, { endereco: endereco.trim() });
        }
      } else if (clienteNome.trim()) {
        const res = await api.post("/clientes", {
          nome: clienteNome.trim(),
          telefone: clienteTelefone.trim() || null,
          endereco: endereco.trim() || null,
        });
        clienteId = res.data.id;
      }

      const produtos = carrinho.map((item) => {
        if (item.manual || !item.variacaoId || String(item.variacaoId).startsWith("manual-")) {
          return {
            manual: true,
            nome: item.nome,
            quantidade: item.qtd,
            precoUnitario: item.preco,
            custoUnitario: item.custoUnitario || 0,
            outrosCustos: item.outrosCustos || 0,
            numeracao: item.numeracao || null,
          };
        }
        return { variacaoProdutoId: item.variacaoId, quantidade: item.qtd };
      });

      const { data } = await api.post("/vendas", {
        produtos,
        total: totalFinal,
        subtotalProdutos: totalProdutos,
        desconto: descontoAplicado,
        formaPagamento,
        tipoEntrega,
        taxaEntrega: tipoEntrega === "entrega" ? Number(taxaEntrega || 0) : null,
        entregador: tipoEntrega === "entrega" ? entregador : null,
        endereco: tipoEntrega === "entrega" ? endereco.trim() || null : null,
        clienteId: clienteId || null,
      });

      toast.success("Venda finalizada com sucesso!");
      tocarSomVenda();
      aoFinalizar(data.venda);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Erro ao finalizar venda.");
    } finally {
      setCarregando(false);
    }
  }

  function formatTelefone(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1)$2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .substring(0, 14);
  }

  const tocarSomVenda = () => {
    const audio = new Audio("/kaching.mp3");
    audio.play().catch((err) => {
      console.warn("Falha ao reproduzir som:", err);
    });
  };

  const selecionarCliente = (opcao) => {
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
  };

  const avancar = () => setEtapaAtual((valor) => Math.min(valor + 1, etapas.length - 1));
  const voltar = () => setEtapaAtual((valor) => Math.max(valor - 1, 0));
  const ultimaEtapa = etapaAtual === etapas.length - 1;
  const etapa = etapas[etapaAtual];
  const progresso = ((etapaAtual + 1) / etapas.length) * 100;

  const renderCliente = () => (
    <div className="space-y-4">
      <div className={panelClass}>
        <h3 className="mb-3 text-sm font-semibold text-slate-950">Cliente</h3>

        {clientes.length > 0 && (
          <Select
            options={opcoes}
            styles={selectStyles}
            value={opcoes.find((opt) => String(opt.value) === String(clienteSelecionado)) || null}
            onChange={selecionarCliente}
            placeholder="Buscar cliente, telefone ou endereço"
            isClearable
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
        )}
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
          : "Sem cliente selecionado. A venda pode seguir normalmente."}
      </div>
    </div>
  );

  const renderEntrega = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Retirada", value: "retirada" },
          { label: "Entrega", value: "entrega" },
        ].map((opcao) => (
          <button
            key={opcao.value}
            type="button"
            onClick={() => setTipoEntrega(opcao.value)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              tipoEntrega === opcao.value
                ? "border-[#181F24] bg-[#181F24] text-white shadow-[0_12px_24px_rgba(24,31,36,0.12)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {opcao.label}
          </button>
        ))}
      </div>

      {tipoEntrega === "entrega" ? (
        <div className="grid grid-cols-1 gap-3">
          <label>
            <span className={fieldLabelClass}>Endereço</span>
            <textarea
              rows={3}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, numero, bairro, cidade"
              className={`${inputClass} resize-none`}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label>
              <span className={fieldLabelClass}>Taxa</span>
              <input
                type="number"
                placeholder="0,00"
                value={taxaEntrega}
                onChange={(e) => setTaxaEntrega(e.target.value)}
                className={inputClass}
              />
            </label>
            <div>
              <span className={fieldLabelClass}>Entregador</span>
              <EntregadorSelect value={entregador} onChange={setEntregador} selectStyles={selectStyles} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
          Retirada selecionada. Nenhuma taxa ou endereco sera lancado na venda.
        </div>
      )}
    </div>
  );

  const renderPagamento = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
        {[
          { value: "pix", label: "Pix", icon: <SiPix /> },
          { value: "dinheiro", label: "Dinheiro", icon: <FaMoneyBillAlt /> },
          { value: "cartao", label: "Cartão", icon: <FaCreditCard /> },
        ].map((opcao) => (
          <button
            key={opcao.value}
            type="button"
            onClick={() => setFormaPagamento(opcao.value)}
            className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-medium transition ${
              formaPagamento === opcao.value
                ? "bg-[#181F24] text-white shadow-[0_10px_20px_rgba(24,31,36,0.12)]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <span className="text-base">{opcao.icon}</span>
            {opcao.label}
          </button>
        ))}
      </div>

      <div className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <FaPercentage /> Desconto
          </span>
          <div className="flex rounded-full bg-slate-100 p-0.5 text-xs font-medium">
            {[
              { value: "valor", label: "R$" },
              { value: "percentual", label: "%" },
            ].map((opcao) => (
              <button
                key={opcao.value}
                type="button"
                onClick={() => setTipoDesconto(opcao.value)}
                className={`rounded-full px-2.5 py-1 transition ${
                  tipoDesconto === opcao.value
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          min="0"
          max={tipoDesconto === "percentual" ? "100" : undefined}
          placeholder={tipoDesconto === "percentual" ? "Ex: 10" : "Ex: 5.00"}
          value={desconto}
          onChange={(e) => setDesconto(e.target.value)}
          className={`${inputClass} mt-3`}
        />
        {tipoDesconto === "percentual" && desconto && (
          <p className="mt-2 text-xs text-slate-500">
            Desconto calculado: {formatCurrency(descontoAplicado)}
          </p>
        )}
      </div>
    </div>
  );

  const renderResumo = () => (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
        <div className="border-b border-slate-200/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-950">Itens da venda</h3>
        </div>
        <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
          {carrinho.map((item, index) => (
            <div key={`${item.produtoId}-${item.variacaoId}-${index}`} className="px-4 py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-slate-800">
                  {item.nome} {item.numeracao ? `(Tam. ${item.numeracao})` : ""}
                </span>
                <span className="shrink-0 font-medium text-slate-950">
                  {formatCurrency(item.preco * item.qtd)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Qtd. {item.qtd}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
          <p className="font-semibold text-slate-950">Cliente</p>
          <p className="mt-1 text-slate-500">{clienteAtual?.nome || clienteNome || "Não informado"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-[0_12px_30px_rgba(24,31,36,0.045)]">
          <p className="font-semibold text-slate-950">Entrega</p>
          <p className="mt-1 capitalize text-slate-500">{tipoEntrega}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-[#181F24] p-4 text-sm text-white shadow-[0_16px_34px_rgba(24,31,36,0.14)]">
        <div className="flex justify-between text-slate-600">
          <span className="text-white/62">Produtos</span>
          <span>{formatCurrency(totalProdutos)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-white/62">Entrega</span>
          <span>{formatCurrency(valorEntrega)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-white/62">
            Desconto
            {tipoDesconto === "percentual" && desconto ? ` (${percentualDesconto}%)` : ""}
          </span>
          <span>- {formatCurrency(descontoAplicado)}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-xl font-semibold">
          <span>Total</span>
          <span>{formatCurrency(totalFinal)}</span>
        </div>
      </div>
    </div>
  );

  const renderConteudo = () => {
    if (etapa.key === "cliente") return renderCliente();
    if (etapa.key === "entrega") return renderEntrega();
    if (etapa.key === "pagamento") return renderPagamento();
    return renderResumo();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4">
      <div
        id="finalizar-venda-modal"
        className="relative flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-none border border-slate-200/80 bg-[#FFFEFA] shadow-[0_28px_80px_rgba(24,31,36,0.24)] sm:h-auto sm:max-h-[92vh] sm:rounded-[24px]"
      >
        <div className="shrink-0 border-b border-slate-200/80 bg-[#FFFEFA] px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Finalizar venda</h2>
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
                className="h-full rounded-full bg-gradient-to-r from-[#16A36B] to-[#20BD7A] transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F5EF]/50 px-4 py-5 sm:px-6">
          <div className="mb-5">
            <h3 className="mt-1 text-lg font-semibold text-slate-950">{etapa.title}</h3>
          </div>

          {renderConteudo()}
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 sm:px-6">
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
                onClick={handleFinalizar}
                disabled={carregando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A36B] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(22,163,107,0.22)] transition hover:bg-[#11875A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? "Processando..." : "Confirmar venda"}
                {!carregando && <FaCheckCircle />}
              </button>
            ) : (
              <button
                type="button"
                onClick={avancar}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#181F24] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(24,31,36,0.16)] transition hover:bg-[#26313A]"
              >
                Proximo <FaArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
