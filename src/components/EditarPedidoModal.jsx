import { useEffect, useMemo, useState } from "react";
import { CalendarDays, PackagePlus, Plus, Save, Trash2, Truck, UserRound, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";
import useModalPresence from "../hooks/useModalPresence";

const inputClass =
  "w-full rounded-lg border border-[#E5DED2] bg-[#FFFEFA] px-3 py-2.5 text-base outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:bg-white sm:text-sm";

const labelClass = "mb-1.5 block text-xs font-medium uppercase text-slate-500";

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function numero(valor, fallback = 0) {
  if (valor === null || valor === undefined || valor === "") return fallback;
  const parsed = Number(String(valor).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dataInput(value) {
  if (!value) return "";
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "";

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function itemPedidoParaForm(item) {
  const manual = !item.variacaoProdutoId;
  return {
    key: item.id || `${Date.now()}-${Math.random()}`,
    manual,
    variacaoProdutoId: item.variacaoProdutoId || "",
    nomeManual: item.nomeManual || item.variacaoProduto?.produto?.nome || "",
    numeracaoManual: item.numeracaoManual || item.variacaoProduto?.numeracao || "",
    quantidade: String(item.quantidade || 1),
    precoUnitario: String(item.precoUnitario ?? ""),
    custoUnitario: String(item.custoUnitario ?? ""),
    outrosCustos: String(item.outrosCustos ?? ""),
  };
}

function novoItemManual() {
  return {
    key: `manual-${Date.now()}-${Math.random()}`,
    manual: true,
    variacaoProdutoId: "",
    nomeManual: "",
    numeracaoManual: "",
    quantidade: "1",
    precoUnitario: "",
    custoUnitario: "0",
    outrosCustos: "0",
  };
}

export default function EditarPedidoModal({ pedido, aoFechar, aoSalvar, carregando }) {
  useModalPresence();

  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({
    clienteId: pedido?.clienteId || "",
    dataEntrega: dataInput(pedido?.dataEntrega),
    horarioEntrega: pedido?.horarioEntrega || "",
    tipoEntrega: pedido?.tipoEntrega || "retirada",
    endereco: pedido?.endereco || pedido?.cliente?.endereco || "",
    taxaEntrega: String(pedido?.taxaEntrega ?? 0),
    observacoes: pedido?.observacoes || "",
  });
  const [itens, setItens] = useState(() =>
    pedido?.itens?.length ? pedido.itens.map(itemPedidoParaForm) : [novoItemManual()]
  );

  useEffect(() => {
    let ativo = true;

    async function carregarClientes() {
      try {
        const { data } = await api.get("/clientes");
        if (ativo) setClientes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar clientes para editar pedido:", error);
      }
    }

    carregarClientes();
    return () => {
      ativo = false;
    };
  }, []);

  const total = useMemo(() => {
    const subtotal = itens.reduce(
      (acc, item) => acc + numero(item.quantidade, 0) * numero(item.precoUnitario, 0),
      0
    );
    const taxa = form.tipoEntrega === "entrega" ? numero(form.taxaEntrega, 0) : 0;
    return subtotal + taxa;
  }, [form.taxaEntrega, form.tipoEntrega, itens]);

  function atualizarForm(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function atualizarItem(key, campo, valor) {
    setItens((prev) => prev.map((item) => (item.key === key ? { ...item, [campo]: valor } : item)));
  }

  function removerItem(key) {
    setItens((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  function validar() {
    if (!itens.length) {
      toast.error("Adicione ao menos um item.");
      return false;
    }

    const itemInvalido = itens.find((item) => {
      const quantidade = numero(item.quantidade, 0);
      const preco = numero(item.precoUnitario, 0);

      if (quantidade <= 0 || preco <= 0) return true;
      if (item.manual && !item.nomeManual.trim()) return true;
      return false;
    });

    if (itemInvalido) {
      toast.error("Revise os itens do pedido.");
      return false;
    }

    if (form.tipoEntrega === "entrega" && numero(form.taxaEntrega, 0) < 0) {
      toast.error("Informe a taxa de entrega corretamente.");
      return false;
    }

    return true;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validar()) return;

    aoSalvar({
      clienteId: form.clienteId || null,
      dataEntrega: form.dataEntrega || null,
      horarioEntrega: form.horarioEntrega || null,
      tipoEntrega: form.tipoEntrega,
      endereco: form.tipoEntrega === "entrega" ? form.endereco : null,
      taxaEntrega: form.tipoEntrega === "entrega" ? numero(form.taxaEntrega, 0) : 0,
      observacoes: form.observacoes,
      itens: itens.map((item) =>
        item.manual
          ? {
              manual: true,
              nomeManual: item.nomeManual.trim(),
              numeracaoManual: item.numeracaoManual.trim() || null,
              quantidade: numero(item.quantidade, 1),
              precoUnitario: numero(item.precoUnitario, 0),
              custoUnitario: numero(item.custoUnitario, 0),
              outrosCustos: numero(item.outrosCustos, 0),
            }
          : {
              variacaoProdutoId: Number(item.variacaoProdutoId),
              quantidade: numero(item.quantidade, 1),
              precoUnitario: numero(item.precoUnitario, 0),
            }
      ),
    });
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-5">
      <form
        onSubmit={handleSubmit}
        className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-slate-200/80 bg-[#FFFEFA] shadow-[0_28px_80px_rgba(11,17,21,0.24)] sm:h-auto sm:max-h-[92vh] sm:rounded-[24px]"
      >
        <div className="shrink-0 border-b border-slate-200/80 px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Pedido #{pedido?.id}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Editar pedido</h2>
            </div>
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F5EF]/50 p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950">
                <UserRound size={16} /> Informacoes
              </p>

              <div className="space-y-4">
                <label>
                  <span className={labelClass}>Cliente</span>
                  <select
                    value={form.clienteId}
                    onChange={(event) => atualizarForm("clienteId", event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Cliente nao informado</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label>
                    <span className={labelClass}>Data</span>
                    <input
                      type="date"
                      value={form.dataEntrega}
                      onChange={(event) => atualizarForm("dataEntrega", event.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Horario</span>
                    <input
                      type="time"
                      value={form.horarioEntrega}
                      onChange={(event) => atualizarForm("horarioEntrega", event.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>

                <div>
                  <span className={labelClass}>Entrega</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "retirada", label: "Retirada", icon: PackagePlus },
                      { value: "entrega", label: "Entrega", icon: Truck },
                    ].map((item) => {
                      const Icon = item.icon;
                      const ativo = form.tipoEntrega === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => atualizarForm("tipoEntrega", item.value)}
                          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                            ativo
                              ? "border-[#0B1115] bg-[#0B1115] text-white"
                              : "border-[#E5DED2] bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.tipoEntrega === "entrega" && (
                  <div className="grid grid-cols-1 gap-3">
                    <label>
                      <span className={labelClass}>Endereco</span>
                      <input
                        value={form.endereco}
                        onChange={(event) => atualizarForm("endereco", event.target.value)}
                        placeholder="Rua, numero, bairro"
                        className={inputClass}
                      />
                    </label>
                    <label>
                      <span className={labelClass}>Taxa de entrega</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.taxaEntrega}
                        onChange={(event) => atualizarForm("taxaEntrega", event.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}

                <label>
                  <span className={labelClass}>Observacoes</span>
                  <textarea
                    rows={4}
                    value={form.observacoes}
                    onChange={(event) => atualizarForm("observacoes", event.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Algum detalhe importante do pedido"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <CalendarDays size={16} /> Itens
                </p>
                <button
                  type="button"
                  onClick={() => setItens((prev) => [...prev, novoItemManual()])}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#16A34A]/30 bg-[#16A34A]/10 px-3 text-xs font-semibold text-[#0B1115] transition hover:bg-[#16A34A]/15"
                >
                  <Plus size={14} /> Item avulso
                </button>
              </div>

              <div className="space-y-3">
                {itens.map((item) => (
                  <div key={item.key} className="rounded-lg border border-slate-200 bg-[#FFFEFA] p-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_90px_110px_40px]">
                      <label className="min-w-0">
                        <span className={labelClass}>Produto</span>
                        {item.manual ? (
                          <input
                            value={item.nomeManual}
                            onChange={(event) => atualizarItem(item.key, "nomeManual", event.target.value)}
                            placeholder="Nome do item"
                            className={inputClass}
                          />
                        ) : (
                          <div className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                            <p className="truncate font-medium text-slate-950">{item.nomeManual || "Produto"}</p>
                            <p className="text-xs text-slate-500">Tam. {item.numeracaoManual || "-"}</p>
                          </div>
                        )}
                      </label>

                      <label>
                        <span className={labelClass}>Tam.</span>
                        <input
                          value={item.numeracaoManual}
                          onChange={(event) => atualizarItem(item.key, "numeracaoManual", event.target.value)}
                          disabled={!item.manual}
                          className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
                        />
                      </label>

                      <label>
                        <span className={labelClass}>Qtd.</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(event) => atualizarItem(item.key, "quantidade", event.target.value)}
                          className={inputClass}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removerItem(item.key)}
                        disabled={itens.length <= 1}
                        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Remover item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <label>
                        <span className={labelClass}>Venda</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precoUnitario}
                          onChange={(event) => atualizarItem(item.key, "precoUnitario", event.target.value)}
                          className={inputClass}
                        />
                      </label>

                      {item.manual && (
                        <>
                          <label>
                            <span className={labelClass}>Custo</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.custoUnitario}
                              onChange={(event) => atualizarItem(item.key, "custoUnitario", event.target.value)}
                              className={inputClass}
                            />
                          </label>
                          <label>
                            <span className={labelClass}>Outros</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.outrosCustos}
                              onChange={(event) => atualizarItem(item.key, "outrosCustos", event.target.value)}
                              className={inputClass}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Total atualizado</p>
              <p className="text-xl font-semibold text-slate-950">{moeda(total)}</p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={aoFechar}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={carregando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1115] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(11,17,21,0.16)] transition hover:bg-[#131C22] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? "Salvando..." : "Salvar alteracoes"}
                {!carregando && <Save size={15} />}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
