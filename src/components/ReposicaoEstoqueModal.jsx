import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api";
import useModalPresence from "../hooks/useModalPresence";

const ETAPAS = ["Produto", "Quantidades", "Compra", "Revisão"];

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

const numeroFormulario = (valor) => {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = Number(String(valor).replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
};

const imagemProduto = (produto) => produto?.imagemUrlCompleta || produto?.imagemUrl || "";

export default function ReposicaoEstoqueModal({
  produtos = [],
  fornecedores = [],
  produtoInicialId,
  onClose,
  onSaved,
}) {
  useModalPresence();

  const produtoInicial = produtos.find((item) => String(item.id) === String(produtoInicialId));
  const [etapa, setEtapa] = useState(produtoInicial ? 2 : 1);
  const [busca, setBusca] = useState("");
  const [produtoId, setProdutoId] = useState(produtoInicial ? String(produtoInicial.id) : "");
  const [grade, setGrade] = useState(gradesPadrao.baixa);
  const [tipoGrade, setTipoGrade] = useState("baixa");
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    custoUnitario: produtoInicial?.custoUnitario ?? "",
    outrosCustos: produtoInicial?.outrosCustos ?? "",
    fornecedorId: produtoInicial?.fornecedorId ? String(produtoInicial.fornecedorId) : "",
    observacao: "",
    atualizarCustosProduto: true,
  });

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos
      .filter((produto) => {
        const base = `${produto.nome || ""} ${produto.marca || ""} ${produto.fornecedor?.nome || ""}`.toLowerCase();
        return base.includes(termo);
      })
      .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  }, [produtos, busca]);

  const produtoSelecionado = produtos.find((produto) => String(produto.id) === String(produtoId));

  const mapaVariacoes = useMemo(
    () =>
      (produtoSelecionado?.variacoes || []).reduce((acc, variacao) => {
        acc[String(variacao.numeracao)] = variacao;
        return acc;
      }, {}),
    [produtoSelecionado]
  );

  const gradeValida = useMemo(
    () =>
      grade
        .map((item) => {
          const numeracao = String(item.numeracao || "").trim();
          return {
            numeracao,
            quantidade: Number(item.quantidade || 0),
            variacaoProdutoId: mapaVariacoes[numeracao]?.id || null,
          };
        })
        .filter((item) => item.numeracao && Number.isInteger(item.quantidade) && item.quantidade > 0),
    [grade, mapaVariacoes]
  );

  const totalGrade = gradeValida.reduce((soma, item) => soma + item.quantidade, 0);
  const custoUnitario = numeroFormulario(form.custoUnitario) || 0;
  const outrosCustos = numeroFormulario(form.outrosCustos) || 0;
  const custoPrevisto = totalGrade * (custoUnitario + outrosCustos);
  const fornecedorSelecionado = fornecedores.find((item) => String(item.id) === String(form.fornecedorId));

  function selecionarProduto(produto) {
    setProdutoId(String(produto.id));
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
    setTipoGrade("manual");
    setGrade((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [campo]: valor } : item))
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

  function validarEtapa(atual) {
    if (atual === 1 && !produtoSelecionado) {
      toast.error("Selecione um produto para continuar.");
      return false;
    }

    if (atual === 2 && gradeValida.length === 0) {
      toast.error("Informe ao menos uma numeração com quantidade.");
      return false;
    }

    if (atual === 3) {
      const custo = numeroFormulario(form.custoUnitario);
      const outros = numeroFormulario(form.outrosCustos);

      if (form.custoUnitario !== "" && (custo === null || custo < 0)) {
        toast.error("Informe um custo unitário válido.");
        return false;
      }
      if (form.outrosCustos !== "" && (outros === null || outros < 0)) {
        toast.error("Informe outros custos corretamente.");
        return false;
      }
    }

    return true;
  }

  function avancar() {
    if (!validarEtapa(etapa)) return;
    setEtapa((atual) => Math.min(4, atual + 1));
  }

  function voltar() {
    setEtapa((atual) => Math.max(1, atual - 1));
  }

  async function salvarEntrada() {
    if (![1, 2, 3].every(validarEtapa)) return;

    try {
      setSalvando(true);
      await api.post("/estoque/entradas/grade", {
        produtoId: produtoSelecionado.id,
        itens: gradeValida,
        custoUnitario: numeroFormulario(form.custoUnitario),
        outrosCustos: numeroFormulario(form.outrosCustos),
        fornecedor: fornecedorSelecionado?.nome || "",
        observacao: form.observacao,
        atualizarCustosProduto: form.atualizarCustosProduto,
      });

      toast.success("Reposição registrada com sucesso.");
      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error("Erro ao salvar reposição:", error);
      toast.error(error.response?.data?.error || "Erro ao registrar reposição.");
    } finally {
      setSalvando(false);
    }
  }

  const progresso = `${(etapa / ETAPAS.length) * 100}%`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-[#0B1115]/30 p-0 backdrop-blur-[3px] sm:items-center sm:p-5">
      <div className="flex h-[95dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-white/80 bg-white shadow-[0_30px_90px_rgba(11,17,21,0.22)] sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl">
        <header className="shrink-0 bg-white px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-950">Adicionar reposição</h2>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <span className="font-semibold text-[#16A34A]">{ETAPAS[etapa - 1]}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">{etapa} de {ETAPAS.length}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
              aria-label="Fechar reposição"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-5 h-[3px] overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#16A34A] transition-all duration-300" style={{ width: progresso }} />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
          {etapa === 1 && (
            <EtapaProduto
              produtos={produtosFiltrados}
              produtoSelecionado={produtoSelecionado}
              busca={busca}
              onBusca={setBusca}
              onSelecionar={selecionarProduto}
            />
          )}

          {etapa === 2 && (
            <EtapaQuantidades
              produto={produtoSelecionado}
              grade={grade}
              gradeValida={gradeValida}
              tipoGrade={tipoGrade}
              mapaVariacoes={mapaVariacoes}
              totalGrade={totalGrade}
              onAplicarGrade={aplicarGrade}
              onAtualizarItem={atualizarItemGrade}
              onAdicionarLinha={adicionarLinhaManual}
              onRemoverLinha={removerLinha}
            />
          )}

          {etapa === 3 && (
            <EtapaCompra
              produto={produtoSelecionado}
              fornecedores={fornecedores}
              form={form}
              totalGrade={totalGrade}
              custoPrevisto={custoPrevisto}
              onForm={setForm}
            />
          )}

          {etapa === 4 && (
            <EtapaRevisao
              produto={produtoSelecionado}
              grade={gradeValida}
              mapaVariacoes={mapaVariacoes}
              fornecedor={fornecedorSelecionado}
              form={form}
              custoPrevisto={custoPrevisto}
              totalGrade={totalGrade}
            />
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={etapa === 1 ? onClose : voltar}
              disabled={salvando}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-60"
            >
              {etapa > 1 && <ArrowLeft size={16} />}
              {etapa === 1 ? "Cancelar" : "Voltar"}
            </button>

            {etapa < 4 ? (
              <button
                type="button"
                onClick={avancar}
                disabled={salvando || (etapa === 1 && !produtoSelecionado)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0B1115] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(11,17,21,0.16)] transition hover:bg-[#18232A] disabled:opacity-50"
              >
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={salvarEntrada}
                disabled={salvando}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-5 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                {salvando ? "Registrando..." : "Confirmar reposição"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function EtapaProduto({ produtos, produtoSelecionado, busca, onBusca, onSelecionar }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-950">Qual produto será reposto?</h3>
        <p className="mt-1 text-sm text-slate-500">Busque e selecione um produto para continuar.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          autoFocus
          type="text"
          placeholder="Buscar por produto, marca ou fornecedor"
          value={busca}
          onChange={(event) => onBusca(event.target.value)}
          className="w-full rounded-lg border border-transparent bg-slate-50 py-3 pl-10 pr-3 text-base outline-none transition placeholder:text-slate-400 focus:border-[#16A34A]/35 focus:bg-white focus:ring-4 focus:ring-[#16A34A]/[0.07]"
        />
      </div>

      <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {produtos.map((produto) => {
          const selecionado = produtoSelecionado?.id === produto.id;
          const estoqueTotal = (produto.variacoes || []).reduce(
            (soma, variacao) => soma + Number(variacao.estoque || 0),
            0
          );

          return (
            <button
              key={produto.id}
              type="button"
              onClick={() => onSelecionar(produto)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                selecionado
                  ? "border-[#16A34A]/40 bg-emerald-50/55"
                  : "border-transparent bg-slate-50/70 hover:bg-slate-100/70"
              }`}
            >
              <ProdutoImagem produto={produto} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-950">{produto.nome}</p>
                  {selecionado && <CheckCircle2 size={17} className="shrink-0 text-[#16A34A]" />}
                </div>
                <p className="mt-1 text-xs text-slate-500">{estoqueTotal} pares em estoque</p>
                <p className="mt-1 text-xs text-slate-500">Custo atual {formatCurrency(produto.custoUnitario)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {!produtos.length && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Nenhum produto encontrado.
        </div>
      )}
    </div>
  );
}

function EtapaQuantidades({
  produto,
  grade,
  gradeValida,
  tipoGrade,
  mapaVariacoes,
  totalGrade,
  onAplicarGrade,
  onAtualizarItem,
  onAdicionarLinha,
  onRemoverLinha,
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <EtapaCabecalho
        titulo="Informe as quantidades"
        texto="Use uma grade pronta ou monte a entrada numeração por numeração."
        produto={produto}
      />

      <div className="mt-6 grid gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-3">
        {[
          { key: "baixa", label: "Grade baixa", detail: "34 ao 39" },
          { key: "alta", label: "Grade alta", detail: "38 ao 43" },
          { key: "manual", label: "Manual", detail: "Monte livremente" },
        ].map((opcao) => (
          <button
            key={opcao.key}
            type="button"
            onClick={() => onAplicarGrade(opcao.key)}
            className={`rounded-md px-3 py-2.5 text-left transition ${
              tipoGrade === opcao.key
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:bg-white/55 hover:text-slate-800"
            }`}
          >
            <p className="text-sm font-semibold">{opcao.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{opcao.detail}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg bg-slate-50/70">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-950">Grade da reposição</h4>
            <p className="mt-0.5 text-xs text-slate-500">{gradeValida.length} numerações · {totalGrade} pares</p>
          </div>
          <button type="button" onClick={onAdicionarLinha} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:text-slate-950">
            <Plus size={15} /> Numeração
          </button>
        </div>

        <div className="divide-y divide-white bg-white/60">
          {grade.map((item, index) => {
            const numeracao = String(item.numeracao || "").trim();
            const variacao = mapaVariacoes[numeracao];
            const estoqueAtual = Number(variacao?.estoque || 0);
            const quantidade = Number(item.quantidade || 0);

            return (
              <div key={`${index}-${numeracao}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px] gap-2 p-3 sm:grid-cols-[150px_150px_minmax(0,1fr)_40px] sm:items-center sm:px-4">
                <label>
                  <span className="mb-1 block text-[11px] font-semibold uppercase text-slate-500 sm:hidden">Numeração</span>
                  <input
                    value={item.numeracao}
                    onChange={(event) => onAtualizarItem(index, "numeracao", event.target.value)}
                    placeholder="Número"
                    className="w-full rounded-lg border border-transparent bg-white px-3 py-2.5 text-base outline-none ring-1 ring-slate-200/80 focus:border-[#16A34A]/35 focus:ring-[#16A34A]/35 sm:text-sm"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-semibold uppercase text-slate-500 sm:hidden">Entrada</span>
                  <input
                    type="number"
                    min="0"
                    value={item.quantidade}
                    onChange={(event) => onAtualizarItem(index, "quantidade", event.target.value)}
                    placeholder="Quantidade"
                    className="w-full rounded-lg border border-transparent bg-white px-3 py-2.5 text-base outline-none ring-1 ring-slate-200/80 focus:border-[#16A34A]/35 focus:ring-[#16A34A]/35 sm:text-sm"
                  />
                </label>
                <div className="col-span-2 flex items-center gap-2 text-xs text-slate-500 sm:col-span-1">
                  <span>Atual: <strong className="text-slate-800">{estoqueAtual}</strong></span>
                  <ArrowRight size={13} />
                  <span>Depois: <strong className="text-slate-950">{estoqueAtual + (Number.isNaN(quantidade) ? 0 : quantidade)}</strong></span>
                  {!variacao && numeracao && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">novo</span>}
                </div>
                <button type="button" onClick={() => onRemoverLinha(index)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remover numeração">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EtapaCompra({ produto, fornecedores, form, totalGrade, custoPrevisto, onForm }) {
  const alterar = (campo, valor) => onForm((prev) => ({ ...prev, [campo]: valor }));

  return (
    <div className="mx-auto max-w-3xl">
      <EtapaCabecalho
        titulo="Complete os dados da compra"
        texto="Essas informações ajudam a manter custos e fornecedores organizados."
        produto={produto}
      />

      <div className="mt-6 grid gap-5 rounded-lg bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5">
        <Campo label="Custo unitário" inputMode="decimal" value={form.custoUnitario} onChange={(value) => alterar("custoUnitario", value)} />
        <Campo label="Outros custos por unidade" inputMode="decimal" value={form.outrosCustos} onChange={(value) => alterar("outrosCustos", value)} />
        <label className="sm:col-span-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Fornecedor</span>
          <select
            value={form.fornecedorId}
            onChange={(event) => alterar("fornecedorId", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-transparent bg-white px-3 py-3 text-base outline-none ring-1 ring-slate-200/80 focus:border-[#16A34A]/35 focus:ring-[#16A34A]/35 sm:text-sm"
          >
            <option value="">Sem fornecedor</option>
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Observação opcional</span>
          <textarea
            rows={3}
            value={form.observacao}
            onChange={(event) => alterar("observacao", event.target.value)}
            placeholder="Ex: reposição da coleção de inverno"
            className="mt-1.5 w-full resize-none rounded-lg border border-transparent bg-white px-3 py-3 text-base outline-none ring-1 ring-slate-200/80 focus:border-[#16A34A]/35 focus:ring-[#16A34A]/35 sm:text-sm"
          />
        </label>
        <label className="sm:col-span-2 flex items-start gap-3 border-t border-slate-200/80 pt-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.atualizarCustosProduto}
            onChange={(event) => alterar("atualizarCustosProduto", event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <strong className="block text-slate-950">Atualizar o custo do produto</strong>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Os valores informados nesta compra substituirão os custos atuais.</span>
          </span>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ResumoPill label="Total de pares" value={totalGrade} />
        <ResumoPill label="Custo previsto" value={formatCurrency(custoPrevisto)} />
      </div>
    </div>
  );
}

function EtapaRevisao({ produto, grade, mapaVariacoes, fornecedor, form, custoPrevisto, totalGrade }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#16A34A]">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-950">Revise antes de confirmar</h3>
        <p className="mt-1 text-sm text-slate-500">O estoque será aumentado conforme as quantidades abaixo.</p>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50/70 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <ProdutoImagem produto={produto} className="h-14 w-14" />
          <div className="min-w-0">
            <h4 className="truncate text-base font-semibold text-slate-950">{produto?.nome}</h4>
            <p className="mt-1 text-sm text-slate-500">{fornecedor?.nome || "Sem fornecedor informado"}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ResumoPill label="Numerações" value={grade.length} />
          <ResumoPill label="Pares" value={totalGrade} />
          <ResumoPill label="Custo unitário" value={formatCurrency(numeroFormulario(form.custoUnitario))} />
          <ResumoPill label="Custo previsto" value={formatCurrency(custoPrevisto)} />
        </div>

        <div className="mt-5 overflow-hidden rounded-lg bg-white">
          <div className="grid grid-cols-4 gap-2 border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase text-slate-400">
            <span>Numeração</span><span>Atual</span><span>Entrada</span><span>Novo saldo</span>
          </div>
          <div className="max-h-[300px] divide-y divide-slate-50 overflow-y-auto">
            {grade.map((item) => {
              const estoqueAtual = Number(mapaVariacoes[item.numeracao]?.estoque || 0);
              return (
                <div key={item.numeracao} className="grid grid-cols-4 gap-2 px-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-950">{item.numeracao}</span>
                  <span className="text-slate-600">{estoqueAtual}</span>
                  <span className="font-semibold text-[#16A34A]">+{item.quantidade}</span>
                  <span className="font-semibold text-slate-950">{estoqueAtual + item.quantidade}</span>
                </div>
              );
            })}
          </div>
        </div>

        {form.observacao && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Observação</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{form.observacao}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EtapaCabecalho({ titulo, texto, produto }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{titulo}</h3>
        <p className="mt-1 text-sm text-slate-500">{texto}</p>
      </div>
      {produto && (
        <div className="flex max-w-full items-center gap-3 rounded-lg bg-slate-50 p-2.5 sm:max-w-[300px]">
          <ProdutoImagem produto={produto} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{produto.nome}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{produto.marca || "Sem marca"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ProdutoImagem({ produto, className }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400 ${className}`}>
      {imagemProduto(produto) ? (
        <img src={imagemProduto(produto)} alt="" className="h-full w-full object-cover" />
      ) : (
        <Box size={20} />
      )}
    </div>
  );
}

function Campo({ label, value, onChange, inputMode }) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <input
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-transparent bg-white px-3 py-3 text-base outline-none ring-1 ring-slate-200/80 focus:border-[#16A34A]/35 focus:ring-[#16A34A]/35 sm:text-sm"
      />
    </label>
  );
}

function ResumoPill({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
