import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import ProdutoModal from "../components/ProdutoModal";
import { toast } from "react-toastify";
import { FaPlus, FaPen, FaTrashAlt } from "react-icons/fa";

const API_KEY = "6371650aa50b8af82e574e8022553613";

const formatCurrency = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estoquesEditados, setEstoquesEditados] = useState({});
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [novaVariacao, setNovaVariacao] = useState({ numeracao: "", estoque: "" });
  const [mostrarFormularioVariacao, setMostrarFormularioVariacao] = useState(false);
  const [mostrarBotaoFlutuante, setMostrarBotaoFlutuante] = useState(true);
  const [estoqueEditandoId, setEstoqueEditandoId] = useState(null);
  const [editandoProduto, setEditandoProduto] = useState(false);
  const [produtoEditado, setProdutoEditado] = useState({
    nome: "",
    preco: "",
    custoUnitario: "",
    outrosCustos: "",
  });
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [atualizandoVideo, setAtualizandoVideo] = useState(false);

  const carregarProdutos = async () => {
    try {
      setCarregando(true);
      const res = await api.get("/produtos");
      const produtosData = res.data;

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
      preco: produtoSelecionado.preco ?? "",
      custoUnitario: produtoSelecionado.custoUnitario ?? "",
      outrosCustos: produtoSelecionado.outrosCustos ?? "",
    });
    setEditandoProduto(false);
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
        <button
          onClick={() => setMostrarModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
        >
          <FaPlus className="text-xs" /> Novo produto
        </button>
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
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
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
                      selecionado ? "bg-slate-100" : "hover:bg-slate-50"
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
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span>{estoqueTotal} pares</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {produto.variacoes?.length || 0} variações
                        </span>
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

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
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
              <div className="border-b border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="relative h-24 w-24 shrink-0">
                    {produtoSelecionado.imagemUrl ? (
                      <img
                        src={produtoSelecionado.imagemUrl}
                        alt={produtoSelecionado.nome}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                        Sem imagem
                      </div>
                    )}
                    <button
                      className="absolute bottom-2 right-2 rounded-md bg-white p-2 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
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
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-slate-950">
                          {produtoSelecionado.nome}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                            {formatCurrency(produtoSelecionado.preco)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                            Custo {formatCurrency(produtoSelecionado.custoUnitario)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                            Outros {formatCurrency(produtoSelecionado.outrosCustos)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                            {calcularEstoqueTotal(produtoSelecionado)} pares
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => excluirProduto(produtoSelecionado.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <FaTrashAlt size={12} /> Excluir
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => setEditandoProduto((valor) => !valor)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {editandoProduto ? "Fechar edição" : "Editar valores"}
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById("uploadVideoCard")?.click()}
                        disabled={atualizandoVideo}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {atualizandoVideo
                          ? "Processando vídeo..."
                          : produtoSelecionado.videoUrl
                            ? "Trocar vídeo"
                            : "Adicionar vídeo"}
                      </button>
                      {produtoSelecionado.videoUrl && (
                        <a
                          href={produtoSelecionado.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Ver vídeo
                        </a>
                      )}
                      {produtoSelecionado.gifUrl && (
                        <a
                          href={produtoSelecionado.gifUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Ver GIF
                        </a>
                      )}
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
                    </div>
                  </div>
                </div>

                {editandoProduto && (
                  <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <label className="md:col-span-4">
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

              <div className="p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">Variações</h3>
                    <p className="text-sm text-slate-500">Numeração e estoque por grade</p>
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setMostrarFormularioVariacao((valor) => !valor)}
                  >
                    <FaPlus className="text-xs" /> Adicionar variação
                  </button>
                </div>

                {mostrarFormularioVariacao && (
                  <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
                        placeholder="Estoque"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                        value={novaVariacao.estoque}
                        onChange={(e) =>
                          setNovaVariacao((v) => ({ ...v, estoque: e.target.value }))
                        }
                      />
                      <button
                        onClick={adicionarVariacao}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => adicionarGradeCompleta("baixa")}
                        className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 hover:bg-white"
                      >
                        Grade baixa 34-39
                      </button>
                      <button
                        type="button"
                        onClick={() => adicionarGradeCompleta("alta")}
                        className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-600 hover:bg-white"
                      >
                        Grade alta 38-43
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {variacoesOrdenadas.map((variacao) => {
                    const emEdicao = estoqueEditandoId === variacao.id;

                    return (
                      <div key={variacao.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Numeração</p>
                            <p className="text-lg font-semibold text-slate-950">{variacao.numeracao}</p>
                          </div>
                          <button
                            onClick={() => excluirVariacao(variacao.id)}
                            className="rounded-md border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"
                            title="Excluir variação"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          {emEdicao ? (
                            <input
                              type="number"
                              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              value={estoquesEditados[variacao.id] ?? variacao.estoque}
                              onChange={(e) => handleEstoqueChange(variacao.id, e.target.value)}
                            />
                          ) : (
                            <p className="text-sm text-slate-600">
                              Estoque: <span className="font-semibold text-slate-950">{variacao.estoque}</span>
                            </p>
                          )}

                          {emEdicao ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => salvarEstoque(variacao.id)}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEstoqueEditandoId(null)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEstoqueEditandoId(variacao.id)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Editar estoque
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
    </div>
  );
}
