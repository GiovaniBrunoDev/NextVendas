import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { FaBoxOpen, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import { CheckCircle2, X } from "lucide-react";
import useModalPresence from "../hooks/useModalPresence";

const gradesPadrao = {
  baixa: [
    { numeracao: "34", quantidade: 1 },
    { numeracao: "35", quantidade: 2 },
    { numeracao: "36", quantidade: 3 },
    { numeracao: "37", quantidade: 3 },
    { numeracao: "38", quantidade: 2 },
    { numeracao: "39", quantidade: 1 },
  ],
  alta: [
    { numeracao: "38", quantidade: 1 },
    { numeracao: "39", quantidade: 2 },
    { numeracao: "40", quantidade: 3 },
    { numeracao: "41", quantidade: 3 },
    { numeracao: "42", quantidade: 2 },
    { numeracao: "43", quantidade: 1 },
  ],
};

const gradeVazia = [{ numeracao: "", quantidade: "" }];

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

const formatDate = (data) =>
  new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ordenarGrade = (itens) =>
  itens.slice().sort((a, b) => Number(a.numeracao || 0) - Number(b.numeracao || 0));

const numeroFormulario = (valor) => {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
};

const tiposMovimento = {
  reposicao: "Reposição",
  venda: "Venda",
  cancelamento_venda: "Cancelamento de venda",
  reserva_pedido: "Reserva de pedido",
  edicao_pedido_retorno: "Edição de pedido",
  edicao_pedido_reserva: "Nova reserva",
  cancelamento_pedido: "Cancelamento de pedido",
  troca_retorno: "Retorno de troca",
  troca_saida: "Saída de troca",
  ajuste_manual: "Ajuste manual",
  cadastro_produto: "Cadastro do produto",
  cadastro_variacao: "Cadastro de numeração",
};

const imagemProduto = (produto) => produto?.imagemUrlCompleta || produto?.imagemUrl || "";

export default function EntradaEstoque() {
  const [produtos, setProdutos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [grade, setGrade] = useState(gradesPadrao.baixa);
  const [tipoGrade, setTipoGrade] = useState("baixa");
  const [form, setForm] = useState({
    custoUnitario: "",
    outrosCustos: "",
    fornecedorId: "",
    observacao: "",
    atualizarCustosProduto: true,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [conferenciaAberta, setConferenciaAberta] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      const [resProdutos, resEntradas, resMovimentos, resFornecedores] = await Promise.all([
        api.get("/produtos"),
        api.get("/estoque/entradas"),
        api.get("/estoque/movimentos"),
        api.get("/fornecedores"),
      ]);
      setProdutos(resProdutos.data);
      setEntradas(resEntradas.data);
      setMovimentos(resMovimentos.data);
      setFornecedores(resFornecedores.data);
    } catch (error) {
      console.error("Erro ao carregar entrada de estoque:", error);
      toast.error("Erro ao carregar entradas de estoque.");
    } finally {
      setCarregando(false);
    }
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos
      .filter((produto) => produto.nome.toLowerCase().includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, busca]);

  const produtoSelecionado = produtos.find((produto) => produto.id === Number(produtoId));

  const mapaVariacoes = useMemo(() => {
    return (produtoSelecionado?.variacoes || []).reduce((acc, variacao) => {
      acc[String(variacao.numeracao)] = variacao;
      return acc;
    }, {});
  }, [produtoSelecionado]);

  const resumo = useMemo(() => {
    const quantidade = entradas.reduce((soma, entrada) => soma + entrada.quantidade, 0);
    const custoTotal = entradas.reduce((soma, entrada) => {
      const custo = Number(entrada.custoUnitario ?? entrada.variacaoProduto?.produto?.custoUnitario ?? 0);
      const outros = Number(entrada.outrosCustos ?? entrada.variacaoProduto?.produto?.outrosCustos ?? 0);
      return soma + (custo + outros) * entrada.quantidade;
    }, 0);

    return { quantidade, custoTotal, total: entradas.length };
  }, [entradas]);

  const gradeValida = useMemo(() => {
    return grade
      .map((item) => ({
        numeracao: String(item.numeracao || "").trim(),
        quantidade: Number(item.quantidade || 0),
        variacaoProdutoId: mapaVariacoes[String(item.numeracao || "").trim()]?.id || null,
      }))
      .filter((item) => item.numeracao && Number.isInteger(item.quantidade) && item.quantidade > 0);
  }, [grade, mapaVariacoes]);

  const totalGrade = gradeValida.reduce((soma, item) => soma + item.quantidade, 0);
  const custoPrevisto =
    totalGrade * ((numeroFormulario(form.custoUnitario) || 0) + (numeroFormulario(form.outrosCustos) || 0));

  function selecionarProduto(produto) {
    setProdutoId(produto.id);
    setForm((prev) => ({
      ...prev,
      custoUnitario: produto.custoUnitario ?? "",
      outrosCustos: produto.outrosCustos ?? "",
      fornecedorId: produto.fornecedorId ? String(produto.fornecedorId) : "",
    }));
  }

  function aplicarGrade(tipo) {
    setTipoGrade(tipo);
    setGrade(tipo === "manual" ? gradeVazia : gradesPadrao[tipo]);
  }

  function atualizarItemGrade(index, campo, valor) {
    setGrade((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [campo]: valor } : item
      )
    );
  }

  function adicionarLinhaManual() {
    setTipoGrade("manual");
    setGrade((prev) => [...prev, { numeracao: "", quantidade: "" }]);
  }

  function removerLinha(index) {
    setGrade((prev) => {
      const novaGrade = prev.filter((_, itemIndex) => itemIndex !== index);
      return novaGrade.length ? novaGrade : gradeVazia;
    });
  }

  function validarEntrada() {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto.");
      return false;
    }

    if (gradeValida.length === 0) {
      toast.error("Informe ao menos uma numeração com quantidade.");
      return false;
    }

    const custoUnitario = numeroFormulario(form.custoUnitario);
    const outrosCustos = numeroFormulario(form.outrosCustos);

    if (form.custoUnitario !== "" && custoUnitario === null) {
      toast.error("Informe um custo unitário válido.");
      return false;
    }

    if (form.outrosCustos !== "" && outrosCustos === null) {
      toast.error("Informe outros custos corretamente.");
      return false;
    }

    return true;
  }

  function abrirConferencia() {
    if (!validarEntrada()) return;
    setConferenciaAberta(true);
  }

  async function salvarEntrada() {
    if (!validarEntrada()) return;

    const custoUnitario = numeroFormulario(form.custoUnitario);
    const outrosCustos = numeroFormulario(form.outrosCustos);
    const fornecedorSelecionado = fornecedores.find((item) => String(item.id) === String(form.fornecedorId));

    try {
      setSalvando(true);
      await api.post("/estoque/entradas/grade", {
        produtoId: produtoSelecionado.id,
        itens: gradeValida,
        custoUnitario,
        outrosCustos,
        fornecedor: fornecedorSelecionado?.nome || "",
        observacao: form.observacao,
        atualizarCustosProduto: form.atualizarCustosProduto,
      });

      toast.success("Entrada por grade registrada!");
      setForm((prev) => ({
        ...prev,
        fornecedorId: "",
        observacao: "",
      }));
      setConferenciaAberta(false);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao salvar entrada:", error);
      toast.error(error.response?.data?.error || "Erro ao registrar entrada.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando entradas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Entrada de estoque</h1>
            <p className="mt-1 text-sm text-slate-500">
              Registre reposições por grade, ajuste manualmente as numerações e mantenha histórico.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <ResumoPill label="Entradas" value={resumo.total} />
            <ResumoPill label="Pares" value={resumo.quantidade} />
            <ResumoPill label="Custo" value={formatCurrency(resumo.custoTotal)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-950">Produto</h2>
            <div className="relative mt-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produto"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>

          <ul className="max-h-[680px] divide-y divide-slate-100 overflow-auto">
            {produtosFiltrados.map((produto) => {
              const selecionado = produto.id === Number(produtoId);
              const estoqueTotal = (produto.variacoes || []).reduce((soma, variacao) => soma + variacao.estoque, 0);

              return (
                <li key={produto.id}>
                  <button
                    type="button"
                    onClick={() => selecionarProduto(produto)}
                    className={`flex w-full items-center gap-3 p-3 text-left transition ${
                      selecionado ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-500">
                      {imagemProduto(produto) ? (
                        <img src={imagemProduto(produto)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <FaBoxOpen />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{produto.nome}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {estoqueTotal} pares · custo {formatCurrency(produto.custoUnitario)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Nova entrada por grade</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {produtoSelecionado
                      ? produtoSelecionado.nome
                      : "Selecione um produto para lançar reposição."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <ResumoPill label="Linhas" value={gradeValida.length} />
                  <ResumoPill label="Pares" value={totalGrade} />
                  <ResumoPill label="Custo prev." value={formatCurrency(custoPrevisto)} />
                  <ResumoPill label="Grade" value={tipoGrade === "baixa" ? "Baixa" : tipoGrade === "alta" ? "Alta" : "Manual"} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { key: "baixa", label: "Grade baixa", detail: "34 ao 39 · 12 pares" },
                  { key: "alta", label: "Grade alta", detail: "38 ao 43 · 12 pares" },
                  { key: "manual", label: "Manual", detail: "Monte livremente" },
                ].map((opcao) => (
                  <button
                    key={opcao.key}
                    type="button"
                    onClick={() => aplicarGrade(opcao.key)}
                    className={`rounded-lg border p-3 text-left transition ${
                      tipoGrade === opcao.key
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold">{opcao.label}</p>
                    <p className={`mt-1 text-xs ${tipoGrade === opcao.key ? "text-slate-300" : "text-slate-500"}`}>
                      {opcao.detail}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">Numerações da entrada</h3>
                  <button
                    type="button"
                    onClick={adicionarLinhaManual}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FaPlus className="text-xs" /> Adicionar número
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Numeração</th>
                        <th className="px-3 py-3">Qtd. entrada</th>
                        <th className="px-3 py-3">Estoque atual</th>
                        <th className="px-3 py-3">Após entrada</th>
                        <th className="w-12 px-3 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordenarGrade(grade).map((item, indexOriginal) => {
                        const index = grade.findIndex((linha) => linha === item);
                        const numeracao = String(item.numeracao || "").trim();
                        const variacao = mapaVariacoes[numeracao];
                        const estoqueAtual = Number(variacao?.estoque || 0);
                        const quantidade = Number(item.quantidade || 0);

                        return (
                          <tr key={`${numeracao || "novo"}-${indexOriginal}`}>
                            <td className="px-3 py-2">
                              <input
                                value={item.numeracao}
                                onChange={(e) => {
                                  setTipoGrade("manual");
                                  atualizarItemGrade(index, "numeracao", e.target.value);
                                }}
                                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                value={item.quantidade}
                                onChange={(e) => {
                                  setTipoGrade("manual");
                                  atualizarItemGrade(index, "quantidade", e.target.value);
                                }}
                                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              />
                            </td>
                            <td className="px-3 py-2 text-slate-600">{estoqueAtual}</td>
                            <td className="px-3 py-2 font-semibold text-slate-950">
                              {estoqueAtual + (Number.isNaN(quantidade) ? 0 : quantidade)}
                              {!variacao && numeracao && (
                                <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  novo
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => removerLinha(index)}
                                className="rounded-md border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"
                                title="Remover linha"
                              >
                                <FaTrashAlt size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">Dados da compra</h3>
                <div className="mt-4 space-y-3">
                  <label>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Fornecedor</span>
                    <select
                      value={form.fornecedorId}
                      onChange={(event) => setForm((prev) => ({ ...prev, fornecedorId: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    >
                      <option value="">Sem fornecedor</option>
                      {fornecedores.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Campo label="Custo unitário" inputMode="decimal" value={form.custoUnitario} onChange={(value) => setForm((prev) => ({ ...prev, custoUnitario: value }))} />
                  <Campo label="Outros custos" inputMode="decimal" value={form.outrosCustos} onChange={(value) => setForm((prev) => ({ ...prev, outrosCustos: value }))} />
                  <label>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Observação</span>
                    <textarea
                      rows={3}
                      value={form.observacao}
                      onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                  </label>
                  <label className="inline-flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.atualizarCustosProduto}
                      onChange={(e) => setForm((prev) => ({ ...prev, atualizarCustosProduto: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    />
                    <span>Atualizar custo do produto com esta entrada</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={abrirConferencia}
                  disabled={salvando || !produtoSelecionado}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} /> Conferir reposição
                </button>
              </aside>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-950">Histórico recente</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Numeração</th>
                    <th className="px-4 py-3">Operação</th>
                    <th className="px-4 py-3">Movimento</th>
                    <th className="px-4 py-3">Saldo</th>
                    <th className="px-4 py-3">Usuário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimentos.map((movimento) => (
                    <tr key={movimento.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{formatDate(movimento.criadoEm)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{movimento.variacaoProduto?.produto?.nome}</td>
                      <td className="px-4 py-3 text-slate-700">{movimento.variacaoProduto?.numeracao}</td>
                      <td className="px-4 py-3 text-slate-700">{tiposMovimento[movimento.tipo] || movimento.tipo}</td>
                      <td className={`px-4 py-3 font-semibold ${movimento.quantidade >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {movimento.quantidade >= 0 ? "+" : ""}
                        {movimento.quantidade}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{movimento.saldoAnterior} → {movimento.saldoFinal}</td>
                      <td className="px-4 py-3 text-slate-700">{movimento.criadoPor?.nome || "-"}</td>
                    </tr>
                  ))}
                  {movimentos.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                        Nenhuma movimentação registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {conferenciaAberta && (
        <ConferenciaReposicao
          produto={produtoSelecionado}
          grade={gradeValida}
          mapaVariacoes={mapaVariacoes}
          fornecedor={fornecedores.find((item) => String(item.id) === String(form.fornecedorId))}
          custoPrevisto={custoPrevisto}
          totalGrade={totalGrade}
          salvando={salvando}
          onFechar={() => setConferenciaAberta(false)}
          onConfirmar={salvarEntrada}
        />
      )}
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", step, inputMode }) {
  return (
    <label>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        step={step}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}

function ResumoPill({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ConferenciaReposicao({
  produto,
  grade,
  mapaVariacoes,
  fornecedor,
  custoPrevisto,
  totalGrade,
  salvando,
  onFechar,
  onConfirmar,
}) {
  useModalPresence();

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Conferir reposição</h2>
            <p className="mt-1 text-sm text-slate-500">Revise as quantidades antes de atualizar o estoque.</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            aria-label="Fechar conferência"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-slate-500">
              {imagemProduto(produto) ? (
                <img src={imagemProduto(produto)} alt="" className="h-full w-full object-cover" />
              ) : (
                <FaBoxOpen />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{produto?.nome}</p>
              <p className="mt-1 text-xs text-slate-500">{fornecedor?.nome || "Sem fornecedor informado"}</p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Numeração</th>
                  <th className="px-3 py-2.5">Atual</th>
                  <th className="px-3 py-2.5">Entrada</th>
                  <th className="px-3 py-2.5">Novo saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grade.map((item) => {
                  const estoqueAtual = Number(mapaVariacoes[item.numeracao]?.estoque || 0);
                  return (
                    <tr key={item.numeracao}>
                      <td className="px-3 py-2.5 font-medium text-slate-950">{item.numeracao}</td>
                      <td className="px-3 py-2.5 text-slate-600">{estoqueAtual}</td>
                      <td className="px-3 py-2.5 font-semibold text-emerald-700">+{item.quantidade}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-950">{estoqueAtual + item.quantidade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ResumoPill label="Total de pares" value={totalGrade} />
            <ResumoPill label="Custo previsto" value={formatCurrency(custoPrevisto)} />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={salvando}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#020C2C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#081743] disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            {salvando ? "Registrando..." : "Confirmar reposição"}
          </button>
        </div>
      </div>
    </div>
  );
}
