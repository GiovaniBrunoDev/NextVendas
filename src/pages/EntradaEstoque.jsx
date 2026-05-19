import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";
import { FaBoxOpen, FaPlus, FaSearch } from "react-icons/fa";

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

export default function EntradaEstoque() {
  const [produtos, setProdutos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [busca, setBusca] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [variacaoId, setVariacaoId] = useState("");
  const [form, setForm] = useState({
    quantidade: "",
    custoUnitario: "",
    outrosCustos: "",
    fornecedor: "",
    observacao: "",
    atualizarCustosProduto: true,
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      const [resProdutos, resEntradas] = await Promise.all([
        api.get("/produtos"),
        api.get("/estoque/entradas"),
      ]);
      setProdutos(resProdutos.data);
      setEntradas(resEntradas.data);
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
  const variacoes = useMemo(
    () =>
      (produtoSelecionado?.variacoes || [])
        .slice()
        .sort((a, b) => Number(a.numeracao) - Number(b.numeracao)),
    [produtoSelecionado]
  );

  const resumo = useMemo(() => {
    const quantidade = entradas.reduce((soma, entrada) => soma + entrada.quantidade, 0);
    const custoTotal = entradas.reduce((soma, entrada) => {
      const custo = Number(entrada.custoUnitario ?? entrada.variacaoProduto?.produto?.custoUnitario ?? 0);
      const outros = Number(entrada.outrosCustos ?? entrada.variacaoProduto?.produto?.outrosCustos ?? 0);
      return soma + (custo + outros) * entrada.quantidade;
    }, 0);

    return { quantidade, custoTotal, total: entradas.length };
  }, [entradas]);

  async function salvarEntrada() {
    if (!variacaoId || !form.quantidade) {
      toast.error("Selecione produto, numeração e quantidade.");
      return;
    }

    try {
      setSalvando(true);
      await api.post("/estoque/entradas", {
        variacaoProdutoId: Number(variacaoId),
        quantidade: Number(form.quantidade),
        custoUnitario: form.custoUnitario,
        outrosCustos: form.outrosCustos,
        fornecedor: form.fornecedor,
        observacao: form.observacao,
        atualizarCustosProduto: form.atualizarCustosProduto,
      });

      toast.success("Entrada de estoque registrada!");
      setForm({
        quantidade: "",
        custoUnitario: "",
        outrosCustos: "",
        fornecedor: "",
        observacao: "",
        atualizarCustosProduto: true,
      });
      setVariacaoId("");
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
              Registre reposições por numeração e mantenha um histórico de compra.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <ResumoPill label="Entradas" value={resumo.total} />
            <ResumoPill label="Pares" value={resumo.quantidade} />
            <ResumoPill label="Custo" value={formatCurrency(resumo.custoTotal)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
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

          <ul className="max-h-[620px] divide-y divide-slate-100 overflow-auto">
            {produtosFiltrados.map((produto) => {
              const selecionado = produto.id === Number(produtoId);
              const estoqueTotal = (produto.variacoes || []).reduce((soma, variacao) => soma + variacao.estoque, 0);

              return (
                <li key={produto.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setProdutoId(produto.id);
                      setVariacaoId("");
                      setForm((prev) => ({
                        ...prev,
                        custoUnitario: produto.custoUnitario ?? "",
                        outrosCustos: produto.outrosCustos ?? "",
                      }));
                    }}
                    className={`flex w-full items-center gap-3 p-3 text-left transition ${
                      selecionado ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <FaBoxOpen />
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
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Nova entrada</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Numeração</span>
                <select
                  value={variacaoId}
                  onChange={(e) => setVariacaoId(e.target.value)}
                  disabled={!produtoSelecionado}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                >
                  <option value="">Selecione</option>
                  {variacoes.map((variacao) => (
                    <option key={variacao.id} value={variacao.id}>
                      {variacao.numeracao} - estoque atual {variacao.estoque}
                    </option>
                  ))}
                </select>
              </label>

              <Campo label="Quantidade" type="number" value={form.quantidade} onChange={(value) => setForm((prev) => ({ ...prev, quantidade: value }))} />
              <Campo label="Fornecedor" value={form.fornecedor} onChange={(value) => setForm((prev) => ({ ...prev, fornecedor: value }))} />
              <Campo label="Custo unitário" type="number" step="0.01" value={form.custoUnitario} onChange={(value) => setForm((prev) => ({ ...prev, custoUnitario: value }))} />
              <Campo label="Outros custos" type="number" step="0.01" value={form.outrosCustos} onChange={(value) => setForm((prev) => ({ ...prev, outrosCustos: value }))} />
              <label className="md:col-span-3">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Observação</span>
                <textarea
                  rows={3}
                  value={form.observacao}
                  onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.atualizarCustosProduto}
                  onChange={(e) => setForm((prev) => ({ ...prev, atualizarCustosProduto: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Atualizar custo do produto com esta entrada
              </label>
              <button
                type="button"
                onClick={salvarEntrada}
                disabled={salvando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              >
                <FaPlus className="text-xs" /> {salvando ? "Salvando..." : "Registrar entrada"}
              </button>
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
                    <th className="px-4 py-3">Qtd.</th>
                    <th className="px-4 py-3">Fornecedor</th>
                    <th className="px-4 py-3">Custo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entradas.map((entrada) => (
                    <tr key={entrada.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{formatDate(entrada.criadoEm)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{entrada.variacaoProduto?.produto?.nome}</td>
                      <td className="px-4 py-3 text-slate-700">{entrada.variacaoProduto?.numeracao}</td>
                      <td className="px-4 py-3 font-semibold text-slate-950">{entrada.quantidade}</td>
                      <td className="px-4 py-3 text-slate-700">{entrada.fornecedor || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(entrada.custoUnitario)}</td>
                    </tr>
                  ))}
                  {entradas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                        Nenhuma entrada registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", step }) {
  return (
    <label>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        step={step}
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
