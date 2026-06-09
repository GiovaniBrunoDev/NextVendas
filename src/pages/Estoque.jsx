import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import ProdutoModal from "../components/ProdutoModal";
import ReposicaoEstoqueModal from "../components/ReposicaoEstoqueModal";
import { toast } from "react-toastify";
import { FaPlus, FaPen, FaTrashAlt } from "react-icons/fa";
import {
  BadgePercent,
  Barcode,
  Boxes,
  CircleDollarSign,
  ChevronDown,
  ClipboardCheck,
  Hash,
  Image,
  Info,
  Layers3,
  PackagePlus,
  Pencil,
  Tag,
  Truck,
  Video,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import useLojaConfiguracoes from "../hooks/useLojaConfiguracoes";

const API_KEY = "6371650aa50b8af82e574e8022553613";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

export default function Estoque({ onNavigate }) {
  const { lojaAtual } = useAuth();
  const { configuracoes } = useLojaConfiguracoes();
  const podeAdicionarVideo = Number(lojaAtual?.loja?.id) === 1;
  const alertaEstoqueConfig = Number(configuracoes.alertaEstoque);
  const limiteEstoqueBaixo = Number.isFinite(alertaEstoqueConfig)
    ? Math.max(0, alertaEstoqueConfig)
    : 2;
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarReposicaoModal, setMostrarReposicaoModal] = useState(false);
  const [estoquesEditados, setEstoquesEditados] = useState({});
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [novaVariacao, setNovaVariacao] = useState({ numeracao: "", estoque: "" });
  const [mostrarFormularioVariacao, setMostrarFormularioVariacao] = useState(false);
  const [gerenciandoVariacoes, setGerenciandoVariacoes] = useState(false);
  const [mostrarDetalhesProduto, setMostrarDetalhesProduto] = useState(false);
  const [mostrarBotaoFlutuante, setMostrarBotaoFlutuante] = useState(true);
  const [estoqueEditandoId, setEstoqueEditandoId] = useState(null);
  const [editandoProduto, setEditandoProduto] = useState(false);
  const [produtoEditado, setProdutoEditado] = useState({
    nome: "",
    marca: "",
    genero: "unissex",
    fornecedorId: "",
    preco: "",
    custoUnitario: "",
    outrosCustos: "",
  });
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [atualizandoVideo, setAtualizandoVideo] = useState(false);

  const carregarProdutos = async () => {
    try {
      setCarregando(true);
      const resProdutos = await api.get("/produtos");
      const produtosData = resProdutos.data;

      setProdutos(produtosData);
      setProdutoSelecionado((selecionadoAtual) => {
        if (!selecionadoAtual) return null;
        return produtosData.find((produto) => produto.id === selecionadoAtual.id) || null;
      });
    } catch (err) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setCarregando(false);
    }

    try {
      const resFornecedores = await api.get("/fornecedores");
      setFornecedores(Array.isArray(resFornecedores.data) ? resFornecedores.data : []);
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
      setFornecedores([]);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    const handleScroll = () => setMostrarBotaoFlutuante(window.scrollY < 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!produtoSelecionado) return;

    setProdutoEditado({
      nome: produtoSelecionado.nome || "",
      marca: produtoSelecionado.marca || "",
      genero: produtoSelecionado.genero || "unissex",
      fornecedorId: produtoSelecionado.fornecedorId || "",
      preco: produtoSelecionado.preco ?? "",
      custoUnitario: produtoSelecionado.custoUnitario ?? "",
      outrosCustos: produtoSelecionado.outrosCustos ?? "",
    });
    setEditandoProduto(false);
    setGerenciandoVariacoes(false);
    setMostrarDetalhesProduto(false);
    setMostrarFormularioVariacao(false);
    setEstoqueEditandoId(null);
  }, [produtoSelecionado?.id]);

  const calcularEstoqueTotal = (produto) =>
    (produto.variacoes || []).reduce((soma, v) => soma + v.estoque, 0);

  const relatorio = useMemo(() => {
    let totalVariacoes = 0;
    let quantidadeTotal = 0;
    let valorTotal = 0;
    let custoTotal = 0;

    produtos.forEach((produto) => {
      (produto.variacoes || []).forEach((variacao) => {
        totalVariacoes++;
        quantidadeTotal += variacao.estoque;
        valorTotal += variacao.estoque * produto.preco;
        custoTotal += variacao.estoque * (produto.custoUnitario + produto.outrosCustos);
      });
    });

    return {
      totalProdutos: produtos.length,
      totalVariacoes,
      quantidadeTotal,
      valorTotal,
      custoTotal,
    };
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return produtos
      .filter((produto) =>
        produto.nome.toLowerCase().includes(texto) ||
        (produto.codigo && produto.codigo.toLowerCase().includes(texto))
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, busca]);

  const variacoesOrdenadas = useMemo(() => {
    return (produtoSelecionado?.variacoes || [])
      .slice()
      .sort((a, b) => Number(a.numeracao) - Number(b.numeracao));
  }, [produtoSelecionado]);

  const detalhesProduto = useMemo(() => {
    if (!produtoSelecionado) return null;
    const estoque = calcularEstoqueTotal(produtoSelecionado);
    const custoTotalUnitario =
      Number(produtoSelecionado.custoUnitario || 0) + Number(produtoSelecionado.outrosCustos || 0);
    const lucroUnitario = Number(produtoSelecionado.preco || 0) - custoTotalUnitario;
    const preco = Number(produtoSelecionado.preco || 0);
    const variacoesComEstoque = variacoesOrdenadas.filter((variacao) => variacao.estoque > 0).length;
    const variacoesSemEstoque = variacoesOrdenadas.length - variacoesComEstoque;
    const codigosBarras = variacoesOrdenadas.filter((variacao) => variacao.codigoBarras).length;

    return {
      estoque,
      custoTotalUnitario,
      lucroUnitario,
      margemPercentual: preco > 0 ? (lucroUnitario / preco) * 100 : 0,
      valorVendaEstoque: estoque * preco,
      valorCustoEstoque: estoque * custoTotalUnitario,
      variacoesComEstoque,
      variacoesSemEstoque,
      codigosBarras,
      menorNumeracao: variacoesOrdenadas[0]?.numeracao || "—",
      maiorNumeracao: variacoesOrdenadas[variacoesOrdenadas.length - 1]?.numeracao || "—",
      statusEstoque: estoque <= 0 ? "Sem estoque" : estoque <= limiteEstoqueBaixo ? "Estoque baixo" : "Disponível",
    };
  }, [limiteEstoqueBaixo, produtoSelecionado, variacoesOrdenadas]);

  const produtoAlertas = useMemo(() => {
    if (!produtoSelecionado || !detalhesProduto) return [];

    const alertas = [];
    if (!produtoSelecionado.imagemUrl) alertas.push({ label: "Sem imagem", tone: "warning" });
    if (!produtoSelecionado.marca) alertas.push({ label: "Sem marca", tone: "neutral" });
    if (!produtoSelecionado.fornecedor?.nome) alertas.push({ label: "Sem fornecedor", tone: "neutral" });
    if (detalhesProduto.custoTotalUnitario <= 0) alertas.push({ label: "Sem custo", tone: "warning" });
    if (detalhesProduto.margemPercentual > 0 && detalhesProduto.margemPercentual < 25) {
      alertas.push({ label: "Margem baixa", tone: "warning" });
    }
    if (detalhesProduto.estoque <= 0) {
      alertas.push({ label: "Produto zerado", tone: "danger" });
    } else if (detalhesProduto.estoque <= limiteEstoqueBaixo) {
      alertas.push({ label: `Estoque ≤ ${limiteEstoqueBaixo}`, tone: "warning" });
    }
    if (!variacoesOrdenadas.length) alertas.push({ label: "Sem grade", tone: "danger" });

    return alertas;
  }, [detalhesProduto, limiteEstoqueBaixo, produtoSelecionado, variacoesOrdenadas.length]);

  const atualizarProdutoNaTela = (produtoAtualizado) => {
    setProdutoSelecionado(produtoAtualizado);
    setProdutos((prev) =>
      prev.map((produto) =>
        produto.id === produtoAtualizado.id ? produtoAtualizado : produto
      )
    );
  };

  const handleEstoqueChange = (variacaoId, novoEstoque) => {
    setEstoquesEditados((prev) => ({
      ...prev,
      [variacaoId]: novoEstoque,
    }));
  };

  const salvarEstoque = async (variacaoId) => {
    const novoEstoque = parseInt(estoquesEditados[variacaoId]);

    if (isNaN(novoEstoque)) {
      toast.error("Estoque inválido");
      return;
    }

    try {
      await api.patch(`/produtos/variacoes/${variacaoId}`, { estoque: novoEstoque });
      toast.success("Estoque atualizado com sucesso");
      setEstoqueEditandoId(null);
      carregarProdutos();
    } catch (err) {
      toast.error("Erro ao atualizar estoque");
    }
  };

  const salvarProduto = async () => {
    if (!produtoSelecionado) return;

    const nome = produtoEditado.nome.trim();
    const genero = ["feminino", "masculino", "unissex"].includes(produtoEditado.genero)
      ? produtoEditado.genero
      : "unissex";
    const preco = Number(produtoEditado.preco);
    const custoUnitario = Number(produtoEditado.custoUnitario);
    const outrosCustos = Number(produtoEditado.outrosCustos);

    if (!nome || [preco, custoUnitario, outrosCustos].some((valor) => Number.isNaN(valor))) {
      toast.error("Preencha nome, preço e custos corretamente.");
      return;
    }

    try {
      setSalvandoProduto(true);
      const { data } = await api.put(`/produtos/${produtoSelecionado.id}`, {
        nome,
        marca: produtoEditado.marca?.trim() || null,
        genero,
        fornecedorId: produtoEditado.fornecedorId || null,
        preco,
        custoUnitario,
        outrosCustos,
      });

      atualizarProdutoNaTela(data);
      setEditandoProduto(false);
      toast.success("Produto atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      toast.error("Erro ao atualizar produto.");
    } finally {
      setSalvandoProduto(false);
    }
  };

  const adicionarVariacao = async () => {
    if (!produtoSelecionado) return;

    const { numeracao, estoque } = novaVariacao;
    if (!numeracao || estoque === "") {
      toast.error("Preencha todos os campos da nova variação");
      return;
    }

    try {
      await api.post(`/produtos/${produtoSelecionado.id}/variacoes`, {
        numeracao,
        estoque: parseInt(estoque),
      });
      toast.success("Variação adicionada com sucesso!");
      setNovaVariacao({ numeracao: "", estoque: "" });
      setMostrarFormularioVariacao(false);
      carregarProdutos();
    } catch (err) {
      toast.error("Erro ao adicionar variação");
    }
  };

  const adicionarGradeCompleta = async (tipo) => {
    if (!produtoSelecionado) return;

    const grades = {
      baixa: [
        { numeracao: 34, estoque: 1 },
        { numeracao: 35, estoque: 2 },
        { numeracao: 36, estoque: 3 },
        { numeracao: 37, estoque: 3 },
        { numeracao: 38, estoque: 2 },
        { numeracao: 39, estoque: 1 },
      ],
      alta: [
        { numeracao: 38, estoque: 1 },
        { numeracao: 39, estoque: 2 },
        { numeracao: 40, estoque: 3 },
        { numeracao: 41, estoque: 3 },
        { numeracao: 42, estoque: 2 },
        { numeracao: 43, estoque: 1 },
      ],
    };

    try {
      await Promise.all(
        grades[tipo].map((item) =>
          api.post(`/produtos/${produtoSelecionado.id}/variacoes`, item)
        )
      );
      toast.success(`Grade ${tipo} adicionada com sucesso!`);
      carregarProdutos();
    } catch (err) {
      toast.error(`Erro ao adicionar grade ${tipo}`);
    }
  };

  const excluirVariacao = async (variacaoId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta variação?")) return;

    try {
      await api.delete(`/produtos/variacoes/${variacaoId}`);
      toast.success("Variação excluída!");
      carregarProdutos();
    } catch (err) {
      toast.error("Erro ao excluir variação");
    }
  };

  const excluirProduto = async (produtoId) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto e todas as suas variações?")) return;

    try {
      await api.delete(`/produtos/${produtoId}`);
      toast.success("Produto excluído!");
      setProdutoSelecionado(null);
      setProdutos((prev) => prev.filter((p) => p.id !== produtoId));
    } catch (err) {
      toast.error("Erro ao excluir produto");
    }
  };

  const fazerUploadImgBB = async (imagemFile) => {
    if (!imagemFile) return "";

    const formData = new FormData();
    formData.append("image", imagemFile);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.data.url;
    } catch (err) {
      console.error("Erro ao enviar para ImgBB:", err);
      return "";
    }
  };

  const trocarImagemProduto = async (file) => {
    if (!produtoSelecionado || !file) return;

    try {
      const novaUrl = await fazerUploadImgBB(file);
      if (!novaUrl) throw new Error("Falha ao obter URL da imagem");

      const { data } = await api.put(`/produtos/${produtoSelecionado.id}`, {
        imagemUrl: novaUrl,
      });

      atualizarProdutoNaTela(data);
      toast.success("Imagem atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar imagem:", err);
      toast.error("Erro ao atualizar imagem.");
    }
  };

  const trocarVideoProduto = async (file) => {
    if (!produtoSelecionado || !file) return;

    try {
      setAtualizandoVideo(true);

      const formData = new FormData();
      formData.append("video", file);
      formData.append("nomeProduto", produtoSelecionado.nome);

      const uploadRes = await api.post("/upload-video", formData);
      const videoUrl = uploadRes.data.videoUrl || uploadRes.data.url;
      const gifUrl = uploadRes.data.gifUrl;

      if (!videoUrl || !gifUrl) {
        console.error("Resposta inválida do upload de vídeo:", uploadRes.data);
        throw new Error("Upload de vídeo não retornou videoUrl/gifUrl.");
      }

      const { data } = await api.put(`/produtos/${produtoSelecionado.id}`, {
        videoUrl,
        gifUrl,
      });

      atualizarProdutoNaTela(data);
      toast.success("Vídeo atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar vídeo:", err);
      toast.error("Erro ao atualizar vídeo.");
    } finally {
      setAtualizandoVideo(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Preparando estoque...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Estoque</h1>
          <p className="mt-1 text-sm text-slate-500">
            {produtos.length} produtos cadastrados, {relatorio.quantidadeTotal} pares em estoque.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => onNavigate?.("inventario")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ClipboardCheck size={16} /> Inventário
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("etiquetas")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Barcode size={16} /> Etiquetas
          </button>
          <button
            type="button"
            onClick={() => setMostrarReposicaoModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <PackagePlus size={16} /> Adicionar reposição
          </button>
          <button
            onClick={() => setMostrarModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
          >
            <FaPlus className="text-xs" /> Novo produto
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Produtos", value: relatorio.totalProdutos },
          { label: "Variações", value: relatorio.totalVariacoes },
          { label: "Pares", value: relatorio.quantidadeTotal },
          { label: "Valor em estoque", value: formatCurrency(relatorio.valorTotal) },
          { label: "Custo em estoque", value: formatCurrency(relatorio.custoTotal) },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Produtos</h2>
                <p className="text-sm text-slate-500">{produtosFiltrados.length} resultados</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou código"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <ul className="max-h-[680px] divide-y divide-slate-100 overflow-auto">
            {produtosFiltrados.map((produto) => {
              const estoqueTotal = calcularEstoqueTotal(produto);
              const selecionado = produtoSelecionado?.id === produto.id;

              return (
                <li key={produto.id}>
                  <button
                    type="button"
                    onClick={() => setProdutoSelecionado(produto)}
                    className={`flex w-full items-center gap-3 p-3 text-left transition ${
                      selecionado
                        ? "bg-slate-50 shadow-[inset_3px_0_0_#0B1115]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {produto.imagemUrl ? (
                      <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] text-slate-400">
                        Sem imagem
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{produto.nome}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatCurrency(produto.preco)}</span>
                        {produto.marca && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                            <span>{produto.marca}</span>
                          </>
                        )}
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span>{estoqueTotal} pares</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {produto.variacoes?.length || 0} variações
                        </span>
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                          {produto.genero || "unissex"}
                        </span>
                        {produto.fornecedor?.nome && (
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {produto.fornecedor.nome}
                          </span>
                        )}
                        {produto.videoUrl && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            Com vídeo
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
          {!produtoSelecionado ? (
            <div className="flex min-h-[520px] items-center justify-center p-8 text-center">
              <div>
                <p className="text-lg font-semibold text-slate-900">Selecione um produto</p>
                <p className="mt-1 text-sm text-slate-500">
                  Escolha um item da lista para editar valores, mídia e variações.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="relative border-b border-slate-100 bg-white p-4 sm:p-5 lg:p-6">
                <button
                  onClick={() => excluirProduto(produtoSelecionado.id)}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:right-5 sm:top-5"
                  title="Excluir produto"
                  aria-label="Excluir produto"
                >
                  <FaTrashAlt size={12} />
                </button>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="relative h-36 w-36 shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 sm:h-40 sm:w-40">
                    {produtoSelecionado.imagemUrl ? (
                      <img
                        src={produtoSelecionado.imagemUrl}
                        alt={produtoSelecionado.nome}
                        className="h-full w-full rounded-xl object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl text-xs text-slate-400">
                        Sem imagem
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm ${
                        detalhesProduto?.estoque > 0
                          ? "border-emerald-200 bg-white/95 text-emerald-700"
                          : "border-rose-200 bg-white/95 text-rose-700"
                      }`}
                    >
                      {detalhesProduto?.statusEstoque}
                    </span>
                    <button
                      className="absolute bottom-3 right-3 rounded-xl bg-white p-2 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-950"
                      title="Trocar imagem"
                      onClick={() => document.getElementById("uploadImagemCard")?.click()}
                    >
                      <FaPen size={12} />
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      id="uploadImagemCard"
                      onChange={(e) => trocarImagemProduto(e.target.files[0])}
                      className="hidden"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0 pr-12">
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                          <Hash size={13} />
                          <span>Produto {produtoSelecionado.id}</span>
                        </div>
                        <h2 className="text-xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                          {produtoSelecionado.nome}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                          <ProductTag icon={Tag} value={produtoSelecionado.marca || "Sem marca"} />
                          <ProductTag value={capitalize(produtoSelecionado.genero || "unissex")} />
                          <ProductTag icon={Truck} value={produtoSelecionado.fornecedor?.nome || "Sem fornecedor"} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const proximoEstado = !mostrarDetalhesProduto;
                            setMostrarDetalhesProduto(proximoEstado);
                            if (proximoEstado) {
                              setGerenciandoVariacoes(false);
                              setMostrarFormularioVariacao(false);
                              setEstoqueEditandoId(null);
                            }
                          }}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                            mostrarDetalhesProduto
                              ? "border-[#0B1115] bg-[#0B1115] text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Info size={15} />
                          {mostrarDetalhesProduto ? "Ocultar detalhes" : "Ver detalhes"}
                          <ChevronDown
                            size={15}
                            className={`transition-transform ${mostrarDetalhesProduto ? "rotate-180" : ""}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoProduto((valor) => !valor)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          {editandoProduto ? "Fechar edição" : "Editar produto"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMostrarReposicaoModal(true)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <PackagePlus size={15} />
                          Repor produto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const proximoEstado = !gerenciandoVariacoes;
                            setGerenciandoVariacoes(proximoEstado);
                            if (proximoEstado) setMostrarDetalhesProduto(false);
                            if (!proximoEstado) {
                              setMostrarFormularioVariacao(false);
                              setEstoqueEditandoId(null);
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1115] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#131C22]"
                        >
                          <Layers3 size={16} />
                          {gerenciandoVariacoes ? "Concluir edição" : "Gerenciar variações"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <SummaryStat
                        icon={CircleDollarSign}
                        label="Preço de venda"
                        value={formatCurrency(produtoSelecionado.preco)}
                        detail={`Custo total ${formatCurrency(detalhesProduto?.custoTotalUnitario)}`}
                      />
                      <SummaryStat
                        icon={BadgePercent}
                        label="Lucro bruto/un."
                        value={formatCurrency(detalhesProduto?.lucroUnitario)}
                        detail={`${formatPercent(detalhesProduto?.margemPercentual)} de margem`}
                      />
                      <SummaryStat
                        icon={Boxes}
                        label="Estoque total"
                        value={`${detalhesProduto?.estoque || 0} pares`}
                        detail={`${detalhesProduto?.variacoesComEstoque || 0} tamanhos disponíveis`}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500">Saúde do cadastro</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Limite de estoque baixo: {limiteEstoqueBaixo} {limiteEstoqueBaixo === 1 ? "par" : "pares"}.
                          </p>
                        </div>
                        {produtoAlertas.length === 0 && (
                          <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Cadastro completo
                          </span>
                        )}
                      </div>

                      {produtoAlertas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {produtoAlertas.map((alerta) => (
                            <HealthBadge key={alerta.label} tone={alerta.tone}>
                              {alerta.label}
                            </HealthBadge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <MediaBadge icon={Image} active={Boolean(produtoSelecionado.imagemUrl)} label="Imagem" />
                      <MediaBadge icon={Video} active={Boolean(produtoSelecionado.videoUrl)} label="Vídeo" />
                      <MediaBadge icon={Image} active={Boolean(produtoSelecionado.gifUrl)} label="GIF" />
                      {podeAdicionarVideo && (
                        <button
                          type="button"
                          onClick={() => document.getElementById("uploadVideoCard")?.click()}
                          disabled={atualizandoVideo}
                          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Video size={15} />
                          {atualizandoVideo
                            ? "Processando vídeo..."
                            : produtoSelecionado.videoUrl
                              ? "Trocar vídeo"
                              : "Adicionar vídeo"}
                        </button>
                      )}
                      {produtoSelecionado.videoUrl && (
                        <a
                          href={produtoSelecionado.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          Ver vídeo
                        </a>
                      )}
                      {produtoSelecionado.gifUrl && (
                        <a
                          href={produtoSelecionado.gifUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          Ver GIF
                        </a>
                      )}
                      {podeAdicionarVideo && (
                        <input
                          type="file"
                          accept="video/*"
                          id="uploadVideoCard"
                          onChange={(e) => {
                            trocarVideoProduto(e.target.files[0]);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {mostrarDetalhesProduto && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">Detalhes do produto</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Informações comerciais, disponibilidade e identificação.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      Valor potencial {formatCurrency(detalhesProduto?.valorVendaEstoque)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    <DetailGroup title="Cadastro">
                      <DetailRow label="Referência" value={`Produto ${produtoSelecionado.id}`} />
                      <DetailRow label="Marca" value={produtoSelecionado.marca || "Não informada"} />
                      <DetailRow label="Gênero" value={capitalize(produtoSelecionado.genero || "unissex")} />
                      <DetailRow label="Fornecedor" value={produtoSelecionado.fornecedor?.nome || "Não informado"} />
                    </DetailGroup>

                    <DetailGroup title="Custos e margem">
                      <DetailRow label="Custo unitário" value={formatCurrency(produtoSelecionado.custoUnitario)} />
                      <DetailRow label="Outros custos" value={formatCurrency(produtoSelecionado.outrosCustos)} />
                      <DetailRow label="Custo total" value={formatCurrency(detalhesProduto?.custoTotalUnitario)} />
                      <DetailRow label="Margem bruta" value={formatPercent(detalhesProduto?.margemPercentual)} />
                    </DetailGroup>

                    <DetailGroup title="Disponibilidade">
                      <DetailRow
                        label="Grade cadastrada"
                        value={`${detalhesProduto?.menorNumeracao} a ${detalhesProduto?.maiorNumeracao}`}
                      />
                      <DetailRow label="Tamanhos disponíveis" value={detalhesProduto?.variacoesComEstoque || 0} />
                      <DetailRow label="Tamanhos esgotados" value={detalhesProduto?.variacoesSemEstoque || 0} />
                      <DetailRow
                        label="Códigos de barras"
                        value={`${detalhesProduto?.codigosBarras || 0} de ${variacoesOrdenadas.length}`}
                      />
                    </DetailGroup>

                    <DetailGroup title="Valor do estoque">
                      <DetailRow label="Pares disponíveis" value={detalhesProduto?.estoque || 0} />
                      <DetailRow label="Custo armazenado" value={formatCurrency(detalhesProduto?.valorCustoEstoque)} />
                      <DetailRow label="Venda potencial" value={formatCurrency(detalhesProduto?.valorVendaEstoque)} />
                      <DetailRow label="Lucro potencial" value={formatCurrency(
                        detalhesProduto?.valorVendaEstoque - detalhesProduto?.valorCustoEstoque
                      )} />
                    </DetailGroup>
                  </div>
                </div>
                )}

                {editandoProduto && (
                  <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <label>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Nome</span>
                        <input
                          type="text"
                          value={produtoEditado.nome}
                          onChange={(e) =>
                            setProdutoEditado((prev) => ({ ...prev, nome: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                      </label>
                      <label>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Marca</span>
                        <input
                          type="text"
                          value={produtoEditado.marca}
                          onChange={(e) =>
                            setProdutoEditado((prev) => ({ ...prev, marca: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                      </label>
                      <label>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Gênero</span>
                        <select
                          value={produtoEditado.genero}
                          onChange={(e) =>
                            setProdutoEditado((prev) => ({ ...prev, genero: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        >
                          <option value="feminino">Feminino</option>
                          <option value="masculino">Masculino</option>
                          <option value="unissex">Unissex</option>
                        </select>
                      </label>
                      <label>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Fornecedor</span>
                        <select
                          value={produtoEditado.fornecedorId}
                          onChange={(e) =>
                            setProdutoEditado((prev) => ({ ...prev, fornecedorId: e.target.value }))
                          }
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
                      <label>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Preço</span>
                        <input
                          type="number"
                          step="0.01"
                          value={produtoEditado.preco}
                          onChange={(e) =>
                            setProdutoEditado((prev) => ({ ...prev, preco: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                      </label>
                      <label>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Custo</span>
                        <input
                          type="number"
                          step="0.01"
                          value={produtoEditado.custoUnitario}
                          onChange={(e) =>
                            setProdutoEditado((prev) => ({ ...prev, custoUnitario: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                      </label>
                      <label>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Outros custos</span>
                        <input
                          type="number"
                          step="0.01"
                          value={produtoEditado.outrosCustos}
                          onChange={(e) =>
                            setProdutoEditado((prev) => ({ ...prev, outrosCustos: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                      </label>
                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={salvarProduto}
                          disabled={salvandoProduto}
                          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                          {salvandoProduto ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoProduto(false)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">Grade atual</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Visão rápida da numeração e quantidade disponível.
                    </p>
                  </div>
                  {!gerenciandoVariacoes && (
                    <p className="text-xs font-medium text-slate-500">
                      {variacoesOrdenadas.length} variações · {detalhesProduto?.estoque || 0} pares
                    </p>
                  )}
                </div>

                {variacoesOrdenadas.length > 0 ? (
                  <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
                    {variacoesOrdenadas.map((variacao) => (
                      <div
                        key={variacao.id}
                        className="flex min-h-16 flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                      >
                        <span className="text-base font-semibold text-slate-950">{variacao.numeracao}</span>
                        <span className={`text-xs font-medium ${variacao.estoque > 0 ? "text-slate-500" : "text-rose-600"}`}>
                          {variacao.estoque} {variacao.estoque === 1 ? "par" : "pares"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Este produto ainda não possui variações.
                  </div>
                )}

                {gerenciandoVariacoes && (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-950">Editar grade e estoque</h4>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Adicione numerações ou ajuste as quantidades existentes.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        onClick={() => setMostrarFormularioVariacao((valor) => !valor)}
                      >
                        <FaPlus className="text-xs" />
                        {mostrarFormularioVariacao ? "Fechar inclusão" : "Adicionar variação"}
                      </button>
                    </div>

                    {mostrarFormularioVariacao && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="text"
                            placeholder="Numeração"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                            value={novaVariacao.numeracao}
                            onChange={(e) =>
                              setNovaVariacao((v) => ({ ...v, numeracao: e.target.value }))
                            }
                          />
                          <input
                            type="number"
                            placeholder="Quantidade"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                            value={novaVariacao.estoque}
                            onChange={(e) =>
                              setNovaVariacao((v) => ({ ...v, estoque: e.target.value }))
                            }
                          />
                          <button
                            onClick={adicionarVariacao}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                          >
                            Adicionar
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => adicionarGradeCompleta("baixa")}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-slate-400"
                          >
                            Usar grade baixa 34-39
                          </button>
                          <button
                            type="button"
                            onClick={() => adicionarGradeCompleta("alta")}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-slate-400"
                          >
                            Usar grade alta 38-43
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {variacoesOrdenadas.map((variacao) => {
                        const emEdicao = estoqueEditandoId === variacao.id;

                        return (
                          <div
                            key={variacao.id}
                            className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-center justify-between gap-4 sm:min-w-40 sm:justify-start">
                              <div>
                                <p className="text-xs font-medium text-slate-500">Numeração</p>
                                <p className="text-base font-semibold text-slate-950">{variacao.numeracao}</p>
                              </div>
                              {!emEdicao && (
                                <p className="text-sm text-slate-500">
                                  <span className="font-semibold text-slate-950">{variacao.estoque}</span>{" "}
                                  {variacao.estoque === 1 ? "par" : "pares"}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              {emEdicao ? (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    aria-label={`Estoque da numeração ${variacao.numeracao}`}
                                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-24 sm:flex-none"
                                    value={estoquesEditados[variacao.id] ?? variacao.estoque}
                                    onChange={(e) => handleEstoqueChange(variacao.id, e.target.value)}
                                  />
                                  <button
                                    onClick={() => salvarEstoque(variacao.id)}
                                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => setEstoqueEditandoId(null)}
                                    className="rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEstoqueEditandoId(variacao.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                  >
                                    <Pencil size={14} /> Alterar
                                  </button>
                                  <button
                                    onClick={() => excluirVariacao(variacao.id)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
                                    title="Excluir variação"
                                    aria-label={`Excluir numeração ${variacao.numeracao}`}
                                  >
                                    <FaTrashAlt size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="block sm:hidden">
        {mostrarBotaoFlutuante && !mostrarModal && (
          <button
            onClick={() => setMostrarModal(true)}
            className="fixed bottom-24 right-4 z-[999] flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg"
            title="Novo Produto"
            aria-label="Adicionar novo produto"
          >
            <FaPlus />
          </button>
        )}
      </div>

      {mostrarModal && (
        <ProdutoModal
          aoFechar={() => setMostrarModal(false)}
          aoCadastrar={() => {
            setMostrarModal(false);
            carregarProdutos();
          }}
        />
      )}

      {mostrarReposicaoModal && (
        <ReposicaoEstoqueModal
          produtos={produtos}
          fornecedores={fornecedores}
          produtoInicialId={produtoSelecionado?.id}
          onClose={() => setMostrarReposicaoModal(false)}
          onSaved={carregarProdutos}
        />
      )}
    </div>
  );
}

function capitalize(value) {
  const texto = String(value || "");
  return texto ? `${texto.charAt(0).toUpperCase()}${texto.slice(1)}` : "";
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function ProductTag({ icon: Icon, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
      {Icon && <Icon size={12} />}
      {value}
    </span>
  );
}

function SummaryStat({ icon: Icon, label, value, detail }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500" title={detail}>{detail}</p>
    </div>
  );
}

function MediaBadge({ icon: Icon, active, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-medium ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      {Icon && <Icon size={12} />}
      <span>{label}</span>
    </span>
  );
}

function HealthBadge({ tone = "neutral", children }) {
  const classes = {
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    neutral: "border-slate-200 bg-white text-slate-600",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[tone] || classes.neutral}`}>
      {children}
    </span>
  );
}

function DetailGroup({ title, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3">
      <h4 className="mb-2 text-[11px] font-semibold uppercase text-slate-400">{title}</h4>
      <dl className="space-y-1">{children}</dl>
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 rounded-lg px-1 py-1">
      <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="truncate text-right text-xs font-medium text-slate-800" title={String(value)}>
        {value}
      </dd>
    </div>
  );
}
