import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import ProdutoModal from "../components/ProdutoModal";
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTrashAlt, FaPlus, FaPen } from "react-icons/fa";

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estoquesEditados, setEstoquesEditados] = useState({});
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [editandoEstoque, setEditandoEstoque] = useState({});
  const [novaVariacao, setNovaVariacao] = useState({ numeracao: "", estoque: "" });
  const [mostrarFormularioVariacao, setMostrarFormularioVariacao] = useState(false);
  const [mostrarBotaoFlutuante, setMostrarBotaoFlutuante] = useState(true);
  const inputImagemRef = useRef(null);

  async function carregarProdutos() {
    const res = await api.get("/produtos");
    setProdutos(res.data);
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

  const trocarImagemProduto = async (file) => {
    const formData = new FormData();
    formData.append("imagem", file);

    try {
      const resUpload = await api.post("/produtos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const novaUrl = resUpload.data.imageUrl;

      await api.put(`/produtos/${produtoSelecionado.id}`, {
        ...produtoSelecionado,
        imagemUrl: novaUrl,
      });

      toast.success("Imagem atualizada com sucesso!");
      carregarProdutos();
    } catch (err) {
      toast.error("Erro ao atualizar imagem.");
    }
  };

  const handleSelecionarNovaImagem = (e) => {
    const file = e.target.files[0];
    if (file && produtoSelecionado) {
      trocarImagemProduto(file);
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()))
  );

  const calcularEstoqueTotal = (produto) => {
    return (produto.variacoes || []).reduce((soma, v) => soma + v.estoque, 0);
  };

  


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
        <h2 className="text-lg font-semibold mb-4">📦 Produtos</h2>
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou código..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <ul className="divide-y text-sm max-h-[400px] md:max-h-[500px] overflow-auto">
          {produtosFiltrados.map((produto) => (
            <li
              key={produto.id}
              onClick={() => setProdutoSelecionado(produto)}
              className={`p-3 cursor-pointer hover:bg-blue-50 rounded flex gap-3 items-center transition-all duration-150 ${
                produtoSelecionado?.id === produto.id ? "bg-blue-100 font-semibold" : ""
              }`}
            >
              {produto.imagemUrlCompleta ? (
                <img
                  src={produto.imagemUrlCompleta}
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
                <p className="text-xs text-gray-500">Estoque total: {calcularEstoqueTotal(produto)}</p>
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
                {produtoSelecionado.imagemUrlCompleta ? (
                  <img
                    src={produtoSelecionado.imagemUrlCompleta}
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
              <div className="space-y-1">
                <p className="text-xl font-semibold text-gray-900">{produtoSelecionado.nome}</p>
                <p className="text-sm text-gray-600">
                  Preço: <strong>R$ {produtoSelecionado.preco.toFixed(2)}</strong> &nbsp;|&nbsp;
                  Custo: <strong>R$ {produtoSelecionado.custoUnitario.toFixed(2)}</strong> &nbsp;|&nbsp;
                  Outros custos: <strong>R$ {produtoSelecionado.outrosCustos.toFixed(2)}</strong>
                </p>
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
              {produtoSelecionado.variacoes.map((v) => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:justify-between border rounded p-3 bg-gray-50">
                  <div>
                    <p className="font-medium">Numeração: <span className="text-blue-600">{v.numeracao}</span></p>
                    <p className="text-sm text-gray-500">Estoque atual: <span className="font-semibold">{v.estoque}</span></p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <input
                      type="number"
                      className="border px-2 py-1 rounded w-20"
                      value={estoquesEditados[v.id] ?? v.estoque}
                      onChange={(e) => handleEstoqueChange(v.id, e.target.value)}
                    />
                    <button
                      onClick={() => salvarEstoque(v.id)}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
                    >
                      <FaSave size={14} />
                    </button>
                    <button
                      onClick={() => excluirVariacao(v.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </div>
                </div>
              ))}
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


