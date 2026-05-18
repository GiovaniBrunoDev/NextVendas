import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import ProdutoModal from "../components/ProdutoModal";
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTrashAlt, FaPlus, FaPen } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion"; // 👈 precisa do framer-motion instalado


const dadosMovimentacao = [
  { mes: "Jan", entrou: 120, saiu: 80 },
  { mes: "Fev", entrou: 150, saiu: 110 },
  // puxar isso da API real
];




export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true); // 👈 novo state
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estoquesEditados, setEstoquesEditados] = useState({});
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [editandoEstoque, setEditandoEstoque] = useState({});
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

  const inputImagemRef = useRef(null);

  const calcularRelatorio = () => {
    let totalProdutos = produtos.length;
    let totalVariacoes = 0;
    let quantidadeTotal = 0;
    let valorTotal = 0;
    let custoTotal = 0;

    produtos.forEach((produto) => {
      (produto.variacoes || []).forEach((v) => {
        totalVariacoes++;
        quantidadeTotal += v.estoque;
        valorTotal += v.estoque * produto.preco;
        custoTotal += v.estoque * (produto.custoUnitario + produto.outrosCustos);
      });
    });

    return { totalProdutos, totalVariacoes, quantidadeTotal, valorTotal, custoTotal };
  };

  async function carregarProdutos() {
    try {
      setCarregando(true);
      const res = await api.get("/produtos");
      setProdutos(res.data);
    } catch (err) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setCarregando(false); // 👈 desliga loader
    }
  }

  // esconde o botão de adicionar produto no mobile 
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setMostrarBotaoFlutuante(scrollY < 50); // esconde se rolar mais de 50px
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    carregarProdutos();
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
  }, [produtoSelecionado?.id]);

  // esconde botão flutuante no scroll
  useEffect(() => {
    const handleScroll = () => {
      setMostrarBotaoFlutuante(window.scrollY < 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      carregarProdutos();
    } catch (err) {
      toast.error("Erro ao atualizar estoque");
    }
  };

  const atualizarProdutoNaTela = (produtoAtualizado) => {
    setProdutoSelecionado(produtoAtualizado);
    setProdutos((prev) =>
      prev.map((produto) =>
        produto.id === produtoAtualizado.id ? produtoAtualizado : produto
      )
    );
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
      setMostrarFormularioVariacao(false); //
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

    const gradeSelecionada = tipo === "baixa" ? grades.baixa : grades.alta;

    try {
      await Promise.all(
        gradeSelecionada.map((item) =>
          api.post(`/produtos/${produtoSelecionado.id}/variacoes`, {
            numeracao: item.numeracao,
            estoque: item.estoque,
          })
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
    if (!window.confirm("⚠️ Tem certeza que deseja excluir este produto e TODAS as suas variações?")) return;
    try {
      await api.delete(`/produtos/${produtoId}`);
      toast.success("Produto excluído!");
      setProdutoSelecionado(null);
      setProdutos((prev) => prev.filter((p) => p.id !== produtoId));
    } catch (err) {
      toast.error("Erro ao excluir produto");
    }
  };

  const API_KEY = "6371650aa50b8af82e574e8022553613"; // sua API Key do ImgBB

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
    try {
      // Faz upload para ImgBB e obtém a URL pública
      const novaUrl = await fazerUploadImgBB(file);
      if (!novaUrl) throw new Error("Falha ao obter URL da imagem");

      // Atualiza o produto com a nova URL
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

  const handleSelecionarNovaImagem = (e) => {
    const file = e.target.files[0];
    if (file && produtoSelecionado) {
      trocarImagemProduto(file);
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

  const handleSelecionarNovoVideo = (e) => {
    const file = e.target.files[0];
    if (file) {
      trocarVideoProduto(file);
      e.target.value = "";
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()))
  );

  const calcularEstoqueTotal = (produto) => {
    return (produto.variacoes || []).reduce((soma, v) => soma + v.estoque, 0);
  };
  const { totalProdutos, totalVariacoes, quantidadeTotal, valorTotal, custoTotal } = calcularRelatorio();

   // 🔥 LOADING SCREEN
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Spinner moderno com gradiente neutro/azulado */}
        <div className="relative w-16 h-16">
          {/* Fundo do spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>

          {/* Parte animada */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent 
                  border-t-slate-300 border-r-slate-400 animate-spin"></div>
        </div>

      {/* Texto animado */}
      <p className="mt-6 text-gray-700 font-medium text-lg animate-pulse">
        Preparando seu estoque...
      </p>

      {/* Neutro com leve azul acinzentado */}
        <div className="mt-4 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-slate-300 to-slate-400 animate-[progress_1.5s_ease-in-out_infinite]"></div>
        </div>

      {/* Keyframes para a barra */}
      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}


  return (
    <>
      {/* Botão flutuante visível apenas no mobile */}
      <div className="block sm:hidden mb-4">
        {mostrarBotaoFlutuante && !mostrarModal && (
          <button
            onClick={() => setMostrarModal(true)}
            className="fixed bottom-24 right-4 z-[999] bg-gradient-to-br from-blue-600 to-blue-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-opacity duration-300"
            title="Novo Produto"
            aria-label="Adicionar novo produto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Produtos */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-4">Produtos</h2>
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-md placeholder:text-sm text-base"
          />
          <ul className="divide-y text-sm max-h-[400px] md:max-h-[500px] overflow-auto">
            {produtosFiltrados
              .sort((a, b) => a.nome.localeCompare(b.nome)) // ordena A → Z
              .map((produto) => (
                <li
                  key={produto.id}
                  onClick={() => setProdutoSelecionado(produto)}
                  className={`p-3 cursor-pointer hover:bg-blue-50 rounded flex gap-3 items-center transition-all duration-150 ${produtoSelecionado?.id === produto.id ? "bg-blue-100 font-semibold" : ""
                    }`}
                >
                  {produto.imagemUrl ? (
                    <img
                      src={produto.imagemUrl}
                      alt={produto.nome}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      Sem imagem
                    </div>
                  )}

                  <div>
                    <p>{produto.nome}</p>
                    <p className="text-xs text-gray-500">R$ {produto.preco.toFixed(2)}</p>
                    {produto.videoUrl && (
                      <p className="text-xs text-green-600">Com vídeo</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Estoque total: {calcularEstoqueTotal(produto)}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>




        {/* Detalhes do Produto */}
        <div className="bg-white shadow rounded p-4 min-h-[400px] relative">
          {!produtoSelecionado ? (
            <p className="text-gray-500 text-sm">Selecione um produto à esquerda.</p>
          ) : (
            <>
              <div className="mb-4 border-b pb-4 relative flex flex-col sm:flex-row sm:gap-4">
                <div className="relative w-20 h-20">
                  {produtoSelecionado.imagemUrl ? (
                    <img
                      src={produtoSelecionado.imagemUrl}
                      alt={produtoSelecionado.nome}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500 rounded">
                      Sem imagem
                    </div>
                  )}

                  <button
                    className="absolute bottom-1 right-1 bg-white text-gray-700 rounded-full p-1 shadow hover:bg-gray-100"
                    title="Trocar imagem"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("uploadImagemCard")?.click();
                    }}
                  >
                    <FaPen size={12} />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    id="uploadImagemCard"
                    onChange={handleSelecionarNovaImagem}
                    className="hidden"
                  />
                </div>
                <div className="space-y-3 flex-1">
                  {editandoProduto ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-24">
                      <input
                        type="text"
                        value={produtoEditado.nome}
                        onChange={(e) =>
                          setProdutoEditado((prev) => ({ ...prev, nome: e.target.value }))
                        }
                        className="sm:col-span-2 border border-gray-300 px-3 py-2 rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Preço"
                        value={produtoEditado.preco}
                        onChange={(e) =>
                          setProdutoEditado((prev) => ({ ...prev, preco: e.target.value }))
                        }
                        className="border border-gray-300 px-3 py-2 rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Custo unitário"
                        value={produtoEditado.custoUnitario}
                        onChange={(e) =>
                          setProdutoEditado((prev) => ({ ...prev, custoUnitario: e.target.value }))
                        }
                        className="border border-gray-300 px-3 py-2 rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Outros custos"
                        value={produtoEditado.outrosCustos}
                        onChange={(e) =>
                          setProdutoEditado((prev) => ({ ...prev, outrosCustos: e.target.value }))
                        }
                        className="border border-gray-300 px-3 py-2 rounded text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={salvarProduto}
                          disabled={salvandoProduto}
                          className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white px-3 py-2 rounded text-sm"
                        >
                          {salvandoProduto ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProdutoEditado({
                              nome: produtoSelecionado.nome || "",
                              preco: produtoSelecionado.preco ?? "",
                              custoUnitario: produtoSelecionado.custoUnitario ?? "",
                              outrosCustos: produtoSelecionado.outrosCustos ?? "",
                            });
                            setEditandoProduto(false);
                          }}
                          className="border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-gray-900">{produtoSelecionado.nome}</p>
                      <p className="text-sm text-gray-600">
                        Preço: <strong>R$ {produtoSelecionado.preco.toFixed(2)}</strong> &nbsp;|&nbsp;
                        Custo: <strong>R$ {produtoSelecionado.custoUnitario.toFixed(2)}</strong> &nbsp;|&nbsp;
                        Outros custos: <strong>R$ {produtoSelecionado.outrosCustos.toFixed(2)}</strong>
                      </p>
                    </>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditandoProduto((valor) => !valor)}
                      className="border border-blue-300 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50"
                    >
                      {editandoProduto ? "Fechar edição" : "Editar valores"}
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById("uploadVideoCard")?.click()}
                      disabled={atualizandoVideo}
                      className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-60"
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
                        className="border border-green-300 text-green-700 px-3 py-1.5 rounded hover:bg-green-50"
                      >
                        Ver vídeo
                      </a>
                    )}
                    {produtoSelecionado.gifUrl && (
                      <a
                        href={produtoSelecionado.gifUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-green-300 text-green-700 px-3 py-1.5 rounded hover:bg-green-50"
                      >
                        Ver GIF
                      </a>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      id="uploadVideoCard"
                      onChange={handleSelecionarNovoVideo}
                      className="hidden"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
                      api.delete(`/produtos/${produtoSelecionado.id}`);
                      toast.success("Produto excluído!");
                      setProdutoSelecionado(null);
                      carregarProdutos();
                    }
                  }}
                  className="absolute top-2 right-2 px-3 py-1.5 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>

              <div className="space-y-3 overflow-auto max-h-[400px]">
                {produtoSelecionado.variacoes
                  .slice()
                  .sort((a, b) => a.numeracao - b.numeracao)
                  .map((v) => {
                    const emEdicao = estoqueEditandoId === v.id; // estado para controlar edição
                    return (
                      <div
                        key={v.id}
                        className="flex flex-col sm:flex-row sm:justify-between border rounded p-3 bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">
                            Numeração: <span className="text-blue-600">{v.numeracao}</span>
                          </p>
                          <p className="text-sm text-gray-500">
                            Estoque atual:{" "}
                            {emEdicao ? (
                              <input
                                type="number"
                                className="border px-2 py-1 rounded w-20"
                                value={estoquesEditados[v.id] ?? v.estoque}
                                onChange={(e) => handleEstoqueChange(v.id, e.target.value)}
                              />
                            ) : (
                              <span className="font-semibold">{v.estoque}</span>
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-2 sm:mt-0">
                          {emEdicao ? (
                            <>
                              <button
                                onClick={() => salvarEstoque(v.id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEstoqueEditandoId(null)}
                                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEstoqueEditandoId(v.id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => excluirVariacao(v.id)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                              >
                                <FaTrashAlt size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>


              <div className="mt-4 border-t pt-4">
                <button
                  className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
                  onClick={() => setMostrarFormularioVariacao((v) => !v)}
                >
                  <FaPlus className="text-xs" /> Adicionar variação
                </button>

                {mostrarFormularioVariacao && (
                  <div className="mt-2 flex flex-row flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Numeração"
                      className="border px-2 py-1 rounded w-1/3 min-w-[100px]"
                      value={novaVariacao.numeracao}
                      onChange={(e) =>
                        setNovaVariacao((v) => ({ ...v, numeracao: e.target.value }))
                      }
                    />
                    <input
                      type="number"
                      placeholder="Estoque"
                      className="border px-2 py-1 rounded w-1/3 min-w-[100px]"
                      value={novaVariacao.estoque}
                      onChange={(e) =>
                        setNovaVariacao((v) => ({ ...v, estoque: e.target.value }))
                      }
                    />
                    <button
                      onClick={adicionarVariacao}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded w-1/3 min-w-[100px]"
                    >
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Relatório de Estoque */}
        <div className="bg-white shadow-md rounded-xl p-5 lg:col-span-2 space-y-5">
          <h2 className="text-lg font-semibold mb-2">📊 Relatório de Estoque</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Produtos", value: totalProdutos },
              { label: "Variações", value: totalVariacoes },
              { label: "Qtd. Total", value: quantidadeTotal },
              {
                label: "Valor em Estoque",
                value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorTotal),
              },
              {
                label: "Custo em Estoque",
                value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(custoTotal),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-start justify-center hover:shadow-sm transition"
              >
                <p className="text-gray-500 text-xs sm:text-sm">{item.label}</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>


        <button
          onClick={() => setMostrarModal(true)}
          className="hidden md:flex fixed bottom-5 right-5 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg items-center"
        >
          + Cadastrar Produto
        </button>

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
    </>
  );
}


