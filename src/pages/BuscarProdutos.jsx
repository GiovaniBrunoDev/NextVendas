import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download, Image, PackageSearch, Search, Share2, Tag, X } from "lucide-react";

const API_BASE_URL = (api.defaults.baseURL || "").replace(/\/$/, "");
const DOWNLOAD_CONCURRENCY = 6;

const generoLabels = {
  feminino: "Feminino",
  masculino: "Masculino",
  unissex: "Unissex",
};

const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const nomeArquivoSeguro = (valor) => {
  const base = String(valor || "produto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return base || "produto";
};

const estoqueDaNumeracao = (produto, numeracao) => {
  if (!numeracao) {
    return (produto.variacoes || []).reduce((soma, variacao) => soma + Number(variacao.estoque || 0), 0);
  }

  return Number((produto.variacoes || []).find((variacao) => String(variacao.numeracao) === String(numeracao))?.estoque || 0);
};

const imagemProduto = (produto) => {
  const imagemOriginal = produto.imagemUrl || "";

  if (/^https?:\/\//i.test(imagemOriginal) || imagemOriginal.startsWith("data:")) {
    return imagemOriginal;
  }

  if (produto.imagemUrlCompleta) return produto.imagemUrlCompleta;
  if (imagemOriginal.startsWith("/") && API_BASE_URL) return `${API_BASE_URL}${imagemOriginal}`;
  return imagemOriginal;
};

const extensaoPorMime = (mime = "") => {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
};

async function baixarBlobProduto(produto) {
  const url = imagemProduto(produto);

  if (/^https?:\/\//i.test(url)) {
    try {
      const resposta = await fetch(url, { cache: "force-cache" });

      if (resposta.ok) {
        const blob = await resposta.blob();
        if (blob.size > 0) {
          return {
            blob,
            contentType: blob.type || resposta.headers.get("content-type") || "image/jpeg",
          };
        }
      }
    } catch (err) {
      console.warn("Download direto bloqueado, tentando pelo servidor:", err);
    }
  }

  const res = await api.get(`/produtos/${produto.id}/imagem-download`, {
    responseType: "blob",
  });

  return {
    blob: res.data,
    contentType: res.headers?.["content-type"] || res.data?.type || "image/jpeg",
  };
}

const formatarMoeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function BuscaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [buscaConsulta, setBuscaConsulta] = useState("");
  const [buscaCompartilhamento, setBuscaCompartilhamento] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [numeracaoSelecionada, setNumeracaoSelecionada] = useState("");
  const [generoSelecionado, setGeneroSelecionado] = useState("");
  const [marcaSelecionada, setMarcaSelecionada] = useState("");
  const [modalCompartilharAberto, setModalCompartilharAberto] = useState(false);
  const [feedbackCompartilhamento, setFeedbackCompartilhamento] = useState(null);
  const [progressoDownload, setProgressoDownload] = useState(null);

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErroCarregamento(false);
      const res = await api.get("/produtos");
      setProdutos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setErroCarregamento(true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    if (!modalCompartilharAberto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [modalCompartilharAberto]);

  useEffect(() => {
    setFeedbackCompartilhamento(null);
  }, [buscaCompartilhamento, generoSelecionado, marcaSelecionada, numeracaoSelecionada]);

  const todasNumeracoes = useMemo(
    () =>
      [...new Set(produtos.flatMap((produto) => (produto.variacoes || []).map((variacao) => variacao.numeracao)))]
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b)),
    [produtos]
  );

  const marcas = useMemo(
    () =>
      [...new Set(produtos.map((produto) => produto.marca).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [produtos]
  );

  const generos = useMemo(
    () =>
      [...new Set(produtos.map((produto) => produto.genero || "unissex"))]
        .filter(Boolean)
        .sort((a, b) => (generoLabels[a] || a).localeCompare(generoLabels[b] || b, "pt-BR")),
    [produtos]
  );

  const produtosConsulta = useMemo(() => {
    const termo = normalizarTexto(buscaConsulta);

    return produtos
      .filter((produto) => {
        const textoBusca = [produto.nome, produto.codigo].map(normalizarTexto).join(" ");
        return !termo || textoBusca.includes(termo);
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [buscaConsulta, produtos]);

  const produtosCompartilhamento = useMemo(() => {
    const termo = normalizarTexto(buscaCompartilhamento);

    return produtos
      .filter((produto) => {
        const textoBusca = [produto.nome, produto.codigo, produto.marca, produto.fornecedor?.nome]
          .map(normalizarTexto)
          .join(" ");
        const passaBusca = !termo || textoBusca.includes(termo);
        const passaNumeracao =
          !numeracaoSelecionada ||
          (produto.variacoes || []).some(
            (variacao) => String(variacao.numeracao) === String(numeracaoSelecionada) && Number(variacao.estoque || 0) > 0
          );
        const passaGenero = !generoSelecionado || (produto.genero || "unissex") === generoSelecionado;
        const passaMarca = !marcaSelecionada || produto.marca === marcaSelecionada;

        return passaBusca && passaNumeracao && passaGenero && passaMarca;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [buscaCompartilhamento, generoSelecionado, marcaSelecionada, numeracaoSelecionada, produtos]);

  const produtosParaCompartilhar = useMemo(
    () => produtosCompartilhamento.filter((produto) => numeracaoSelecionada && imagemProduto(produto)),
    [numeracaoSelecionada, produtosCompartilhamento]
  );

  const filtrosCompartilhamentoAtivos = [
    numeracaoSelecionada,
    generoSelecionado,
    marcaSelecionada,
    buscaCompartilhamento.trim(),
  ].filter(Boolean).length;

  const totalComEstoque = useMemo(
    () => produtos.filter((produto) => estoqueDaNumeracao(produto) > 0).length,
    [produtos]
  );

  function limparFiltrosCompartilhamento() {
    setBuscaCompartilhamento("");
    setNumeracaoSelecionada("");
    setGeneroSelecionado("");
    setMarcaSelecionada("");
  }

  async function baixarImagens() {
    if (!numeracaoSelecionada) {
      setFeedbackCompartilhamento({
        tipo: "aviso",
        texto: "Selecione a numeração do cliente para baixar somente os itens disponíveis.",
      });
      return;
    }

    if (produtosParaCompartilhar.length === 0) {
      setFeedbackCompartilhamento({
        tipo: "aviso",
        texto: "Não encontrei imagens disponíveis para essa seleção. Ajuste os filtros ou confira as fotos dos produtos.",
      });
      return;
    }

    try {
      setBaixando(true);
      setFeedbackCompartilhamento(null);
      setProgressoDownload({ atual: 0, total: produtosParaCompartilhar.length });
      const zip = new JSZip();
      const nomesUsados = new Map();
      let arquivosAdicionados = 0;
      let cursor = 0;
      const resultados = [];

      const baixarProximo = async () => {
        const index = cursor;
        cursor += 1;
        const produto = produtosParaCompartilhar[index];
        if (!produto) return;

        try {
          const imagem = await baixarBlobProduto(produto);
          resultados[index] = { produto, ...imagem };
        } catch (err) {
          console.error(`Erro ao baixar ${imagemProduto(produto)}:`, err);
        } finally {
          setProgressoDownload((prev) =>
            prev ? { ...prev, atual: Math.min(prev.atual + 1, prev.total) } : prev
          );
          await baixarProximo();
        }
      };

      const trabalhadores = Array.from(
        { length: Math.min(DOWNLOAD_CONCURRENCY, produtosParaCompartilhar.length) },
        () => baixarProximo()
      );

      await Promise.all(trabalhadores);

      for (const resultado of resultados.filter(Boolean)) {
        const extensao = extensaoPorMime(resultado.contentType);
        const nomeBase = `${nomeArquivoSeguro(resultado.produto.nome)}-tam-${numeracaoSelecionada}`;
        const repeticoes = nomesUsados.get(nomeBase) || 0;
        nomesUsados.set(nomeBase, repeticoes + 1);
        const nomeArquivo = repeticoes > 0 ? `${nomeBase}-${repeticoes + 1}.${extensao}` : `${nomeBase}.${extensao}`;
        zip.file(nomeArquivo, resultado.blob);
        arquivosAdicionados += 1;
      }

      if (arquivosAdicionados === 0) {
        setFeedbackCompartilhamento({
          tipo: "erro",
          texto: "Não foi possível salvar as imagens desta seleção. Tente novamente ou confira se as imagens estão abrindo no produto.",
        });
        return;
      }

      const conteudo = await zip.generateAsync({ type: "blob" });
      saveAs(conteudo, `itens-disponiveis-tam-${numeracaoSelecionada}.zip`);
      setFeedbackCompartilhamento({
        tipo: arquivosAdicionados === produtosParaCompartilhar.length ? "sucesso" : "aviso",
        texto:
          arquivosAdicionados === produtosParaCompartilhar.length
            ? `Pacote criado com ${arquivosAdicionados} imagem${arquivosAdicionados === 1 ? "" : "s"}.`
            : `Pacote criado com ${arquivosAdicionados} de ${produtosParaCompartilhar.length} imagens. Algumas fotos não puderam ser baixadas.`,
      });
    } finally {
      setBaixando(false);
      setProgressoDownload(null);
    }
  }

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F7F5EF]">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-[#16A36B] border-t-[#020C2C]"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Consultando produtos...</p>
      </div>
    );
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                <PackageSearch size={14} className="text-[#16A36B]" />
                Consultar
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Encontre produtos rapidamente.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Consulte por nome ou código e veja as numerações disponíveis. Para enviar opções ao cliente, use o fluxo de compartilhamento.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalCompartilharAberto(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#020C2C] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <Share2 size={17} />
              Compartilhar imagens
              {filtrosCompartilhamentoAtivos > 0 && (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">
                  {filtrosCompartilhamentoAtivos}
                </span>
              )}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <label className="relative block">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={buscaConsulta}
                onChange={(e) => setBuscaConsulta(e.target.value)}
                placeholder="Digite nome ou código do produto"
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white sm:text-sm"
              />
            </label>

            <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
              <Resumo label="Produtos" value={produtos.length} />
              <Resumo label="Encontrados" value={produtosConsulta.length} />
              <Resumo label="Com estoque" value={totalComEstoque} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Resultado da consulta</p>
              <p className="text-xs text-slate-500">
                {produtosConsulta.length} produto{produtosConsulta.length === 1 ? "" : "s"} na lista
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {erroCarregamento ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Não foi possível carregar os produtos.
              </div>
            ) : produtosConsulta.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {produtosConsulta.map((produto) => (
                  <ProdutoConsultaCard key={produto.id} produto={produto} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <PackageSearch size={34} className="mb-3 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">Nenhum produto encontrado</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Tente buscar pelo nome ou código cadastrado no estoque.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {modalCompartilharAberto && (
        <CompartilharImagensModal
          buscaCompartilhamento={buscaCompartilhamento}
          setBuscaCompartilhamento={setBuscaCompartilhamento}
          numeracaoSelecionada={numeracaoSelecionada}
          setNumeracaoSelecionada={setNumeracaoSelecionada}
          generoSelecionado={generoSelecionado}
          setGeneroSelecionado={setGeneroSelecionado}
          marcaSelecionada={marcaSelecionada}
          setMarcaSelecionada={setMarcaSelecionada}
          todasNumeracoes={todasNumeracoes}
          generos={generos}
          marcas={marcas}
          filtrosAtivos={filtrosCompartilhamentoAtivos}
          produtosFiltrados={produtosCompartilhamento.length}
          produtosComImagem={produtosParaCompartilhar.length}
          produtosPreview={produtosParaCompartilhar.slice(0, 4)}
          baixando={baixando}
          progresso={progressoDownload}
          feedback={feedbackCompartilhamento}
          onBaixarImagens={baixarImagens}
          onLimpar={limparFiltrosCompartilhamento}
          onFechar={() => setModalCompartilharAberto(false)}
        />
      )}
    </div>
  );
}

function CompartilharImagensModal({
  buscaCompartilhamento,
  setBuscaCompartilhamento,
  numeracaoSelecionada,
  setNumeracaoSelecionada,
  generoSelecionado,
  setGeneroSelecionado,
  marcaSelecionada,
  setMarcaSelecionada,
  todasNumeracoes,
  generos,
  marcas,
  filtrosAtivos,
  produtosFiltrados,
  produtosComImagem,
  produtosPreview,
  baixando,
  progresso,
  feedback,
  onBaixarImagens,
  onLimpar,
  onFechar,
}) {
  const podeBaixar = numeracaoSelecionada && produtosComImagem > 0 && !baixando;
  const feedbackClasses = {
    sucesso: "border-[#16A36B]/30 bg-[#16A36B]/10 text-[#020C2C]",
    aviso: "border-amber-200 bg-amber-50 text-amber-800",
    erro: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Compartilhar imagens</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Gere um pacote com os itens disponíveis na numeração do cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            aria-label="Fechar compartilhamento"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Busca opcional</span>
            <span className="relative block">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={buscaCompartilhamento}
                onChange={(e) => setBuscaCompartilhamento(e.target.value)}
                placeholder="Produto, marca ou fornecedor"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white sm:text-sm"
              />
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Numeração do cliente</span>
              <Select value={numeracaoSelecionada} onChange={setNumeracaoSelecionada} label="Selecione">
                {todasNumeracoes.map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </Select>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Gênero</span>
              <Select value={generoSelecionado} onChange={setGeneroSelecionado} label="Todos">
                {generos.map((genero) => (
                  <option key={genero} value={genero}>{generoLabels[genero] || genero}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Marca</span>
            <Select value={marcaSelecionada} onChange={setMarcaSelecionada} label="Todas">
              {marcas.map((marca) => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-lg font-semibold text-slate-950">{produtosFiltrados}</p>
              <p className="text-[11px] font-medium uppercase text-slate-500">Itens filtrados</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-lg font-semibold text-slate-950">{produtosComImagem}</p>
              <p className="text-[11px] font-medium uppercase text-slate-500">Com imagem</p>
            </div>
          </div>

          {baixando && progresso?.total > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Baixando imagens</span>
                <span className="text-slate-500">
                  {progresso.atual}/{progresso.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#16A36B] transition-all"
                  style={{ width: `${Math.round((progresso.atual / progresso.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {feedback ? (
            <div className={`rounded-lg border p-3 text-xs ${feedbackClasses[feedback.tipo] || feedbackClasses.aviso}`}>
              {feedback.texto}
            </div>
          ) : !numeracaoSelecionada ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Primeiro escolha a numeração do cliente.
            </div>
          ) : produtosComImagem === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Nenhum produto com imagem nessa seleção. Você pode limpar os filtros ou conferir as fotos no estoque.
            </div>
          ) : (
            <div className="rounded-lg border border-[#16A36B]/25 bg-[#16A36B]/10 p-3 text-xs text-[#020C2C]">
              Pronto para baixar {produtosComImagem} imagem{produtosComImagem === 1 ? "" : "s"}.
            </div>
          )}

          {produtosPreview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-500">Prévia do pacote</p>
              <div className="space-y-2">
                {produtosPreview.map((produto) => (
                  <div key={produto.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                      <img src={imagemProduto(produto)} alt={produto.nome} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{produto.nome}</p>
                      <p className="text-xs text-slate-500">{produto.marca || "Sem marca"}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {numeracaoSelecionada}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2 border-t border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:p-5">
          <button
            type="button"
            onClick={onBaixarImagens}
            disabled={!podeBaixar}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#020C2C] px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Download size={16} />
            {baixando
              ? progresso?.total
                ? `Baixando ${progresso.atual}/${progresso.total}`
                : "Gerando pacote..."
              : produtosComImagem > 0
                ? `Baixar ${produtosComImagem} imagem${produtosComImagem === 1 ? "" : "s"}`
                : "Baixar imagens"}
          </button>

          <button
            type="button"
            onClick={onLimpar}
            disabled={filtrosAtivos === 0}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpar
          </button>

          <button
            type="button"
            onClick={onFechar}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#16A36B] px-4 text-sm font-semibold text-white transition hover:bg-[#020C2C]"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({ value, onChange, label, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base outline-none transition focus:border-slate-400 focus:bg-white sm:text-sm"
    >
      <option value="">{label}</option>
      {children}
    </select>
  );
}

function Resumo({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-base font-semibold text-slate-950">{value}</p>
      <p className="text-[10px] font-medium uppercase text-slate-500">{label}</p>
    </div>
  );
}

function ProdutoConsultaCard({ produto }) {
  const estoqueTotal = estoqueDaNumeracao(produto);
  const variacoes = (produto.variacoes || []).slice().sort((a, b) => Number(a.numeracao) - Number(b.numeracao));

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex gap-3 p-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:h-28 sm:w-28">
          {imagemProduto(produto) ? (
            <img src={imagemProduto(produto)} alt={produto.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Image size={28} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{produto.nome}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {produto.codigo ? `Cód. ${produto.codigo}` : "Sem código"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                estoqueTotal > 0 ? "bg-[#16A36B]/10 text-[#020C2C]" : "bg-slate-100 text-slate-500"
              }`}
            >
              {estoqueTotal} un.
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              {formatarMoeda(produto.preco)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              {produto.marca || "Sem marca"}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              {generoLabels[produto.genero] || produto.genero || "Unissex"}
            </span>
            {produto.fornecedor?.nome && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                <Tag size={11} /> {produto.fornecedor.nome}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 p-3">
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
          {variacoes.map((variacao) => {
            const disponivel = Number(variacao.estoque || 0) > 0;

            return (
              <div
                key={variacao.id}
                className={`flex h-11 flex-col items-center justify-center rounded-md border text-xs ${
                  disponivel
                    ? "border-slate-200 bg-white text-slate-700"
                    : "border-slate-200 bg-slate-100 text-slate-400 line-through"
                }`}
              >
                <span className="font-semibold">{variacao.numeracao}</span>
                <span className="text-[10px]">{variacao.estoque} un.</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
