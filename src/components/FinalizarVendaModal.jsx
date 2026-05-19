import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { FaCreditCard, FaMoneyBillAlt, FaPercentage, FaTimes } from "react-icons/fa";
import { SiPix } from "react-icons/si";
import Select from "react-select";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: state.isFocused ? "#94a3b8" : "#e2e8f0",
    boxShadow: "none",
    "&:hover": { borderColor: "#94a3b8" },
  }),
  menu: (base) => ({ ...base, zIndex: 60 }),
};

export default function FinalizarVendaModal({ carrinho, aoFechar, aoFinalizar }) {
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [tipoEntrega, setTipoEntrega] = useState("retirada");
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [entregador, setEntregador] = useState("");

  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [endereco, setEndereco] = useState("");
  const [desconto, setDesconto] = useState("");
  const [carregando, setCarregando] = useState(false);

  const totalProdutos = carrinho.reduce((s, item) => s + item.qtd * item.preco, 0);
  const valorEntrega = tipoEntrega === "entrega" ? Number(taxaEntrega || 0) : 0;
  const valorDesconto = Number(desconto || 0);
  const totalFinal = Math.max(totalProdutos + valorEntrega - valorDesconto, 0);

  const opcoes = useMemo(
    () => clientes.map((c) => ({ value: c.id, label: `${c.nome} (${c.telefone || "sem telefone"})` })),
    [clientes]
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
  }, []);

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
        if (!item.variacaoId || String(item.variacaoId).startsWith("manual-")) {
          throw new Error(`Produto "${item.nome}" não possui variação cadastrada.`);
        }
        return { variacaoProdutoId: item.variacaoId, quantidade: item.qtd };
      });

      await api.post("/vendas", {
        produtos,
        total: totalFinal,
        formaPagamento,
        tipoEntrega,
        taxaEntrega: tipoEntrega === "entrega" ? Number(taxaEntrega || 0) : null,
        entregador: tipoEntrega === "entrega" ? entregador : null,
        clienteId: clienteId || null,
      });

      toast.success("Venda finalizada com sucesso!");
      tocarSomVenda();
      aoFinalizar();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erro ao finalizar venda.");
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

  const vendaRapida = () => {
    setFormaPagamento("dinheiro");
    setTipoEntrega("retirada");
    setTaxaEntrega("");
    setEntregador("");
    setClienteSelecionado("");
    setClienteNome("");
    setClienteTelefone("");
    setEndereco("");
    setDesconto("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-4 backdrop-blur-sm">
      <div
        id="finalizar-venda-modal"
        className="relative flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Finalizar venda</h2>
            <p className="mt-1 text-sm text-slate-500">
              Confira cliente, entrega, pagamento e resumo antes de confirmar.
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Fechar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <section className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">Cliente</h3>
                    <p className="text-sm text-slate-500">Opcional para vendas rápidas.</p>
                  </div>
                  <button
                    onClick={vendaRapida}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Venda rápida
                  </button>
                </div>

                {clienteSelecionado ? (
                  <div className="space-y-3">
                    <Select
                      options={opcoes}
                      styles={selectStyles}
                      value={opcoes.find((opt) => opt.value === clienteSelecionado)}
                      onChange={(e) => setClienteSelecionado(e?.value || "")}
                      placeholder="Buscar ou selecionar cliente"
                      isClearable
                    />
                    <button
                      onClick={() => {
                        setClienteSelecionado("");
                        setClienteNome("");
                        setClienteTelefone("");
                      }}
                      className="text-sm font-medium text-slate-700 hover:text-slate-950"
                    >
                      Cadastrar novo cliente
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {clientes.length > 0 && (
                      <Select
                        options={opcoes}
                        styles={selectStyles}
                        onChange={(e) => {
                          const id = e?.value || "";
                          setClienteSelecionado(id);
                          if (id) {
                            const cliente = clientes.find((c) => c.id === id);
                            if (cliente) setEndereco(cliente.endereco || "");
                          } else {
                            setEndereco("");
                          }
                        }}
                        placeholder="Selecionar cliente existente"
                        isClearable
                      />
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Nome do novo cliente"
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Telefone"
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(formatTelefone(e.target.value))}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-950">Entrega</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Retirada", value: "retirada" },
                    { label: "Entrega", value: "entrega" },
                  ].map((opcao) => (
                    <button
                      key={opcao.value}
                      onClick={() => setTipoEntrega(opcao.value)}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                        tipoEntrega === opcao.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>

                {tipoEntrega === "entrega" && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <textarea
                      rows={2}
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Endereço de entrega"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        placeholder="Taxa de entrega"
                        value={taxaEntrega}
                        onChange={(e) => setTaxaEntrega(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Nome do entregador"
                        value={entregador}
                        onChange={(e) => setEntregador(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-950">Pagamento</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { value: "pix", label: "Pix", icon: <SiPix /> },
                    { value: "dinheiro", label: "Dinheiro", icon: <FaMoneyBillAlt /> },
                    { value: "cartao", label: "Cartão", icon: <FaCreditCard /> },
                  ].map((opcao) => (
                    <button
                      key={opcao.value}
                      onClick={() => setFormaPagamento(opcao.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium transition ${
                        formaPagamento === opcao.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-lg">{opcao.icon}</span>
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <FaPercentage /> Desconto
                </label>
                <input
                  type="number"
                  placeholder="Ex: 5.00"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </section>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-950">Resumo</h3>
              <div className="mt-4 max-h-56 space-y-3 overflow-auto">
                {carrinho.map((item, index) => (
                  <div key={`${item.produtoId}-${item.variacaoId}-${index}`} className="text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="min-w-0 truncate text-slate-700">
                        {item.nome} {item.numeracao ? `(Tam. ${item.numeracao})` : ""}
                      </span>
                      <span className="shrink-0 font-medium text-slate-900">
                        {formatCurrency(item.preco * item.qtd)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Qtd. {item.qtd}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Produtos</span>
                  <span>{formatCurrency(totalProdutos)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Entrega</span>
                  <span>{formatCurrency(valorEntrega)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Desconto</span>
                  <span>- {formatCurrency(valorDesconto)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-semibold text-slate-950">
                  <span>Total</span>
                  <span>{formatCurrency(totalFinal)}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button
            onClick={aoFechar}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalizar}
            disabled={carregando}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {carregando ? "Processando..." : "Confirmar venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
