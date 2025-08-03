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
  const inputImagemRef = useRef(null);

  async function carregarProdutos() {
    const res = await api.get("/produtos");
    setProdutos(res.data);
  }

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
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <ul className="divide-y text-sm max-h-[500px] overflow-auto">
          {produtosFiltrados.map((produto) => (
            <li
              key={produto.id}
              onClick={() => setProdutoSelecionado(produto)}
              className={`p-3 cursor-pointer hover:bg-blue-50 rounded flex gap-3 items-center ${
                produtoSelecionado?.id === produto.id ? "bg-blue-100 font-semibold" : ""
              }`}
            >
              {/* Miniatura */}
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

              {/* Informações do produto */}
              <div>
                <p>{produto.nome}</p>
                <p className="text-xs text-gray-500">R$ {produto.preco.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Estoque total: {calcularEstoqueTotal(produto)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Card do Produto Selecionado */}
      <div className="bg-white shadow rounded p-4 min-h-[400px] relative">
        <h2 className="text-lg font-semibold mb-4">🔢 Variações</h2>
        {!produtoSelecionado ? (
          <p className="text-gray-500 text-sm">Selecione um produto à esquerda.</p>
        ) : (
          <>
            <div className="mb-6 border-b pb-4 relative">
  <div className="flex gap-4 items-start">
    {/* Imagem do produto com botão de editar */}
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

      {/* Botão para trocar imagem */}
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

    {/* Informações de texto */}
    <div className="space-y-1">
      <p className="text-xl font-semibold text-gray-900">{produtoSelecionado.nome}</p>
      <p className="text-sm text-gray-600">
        Preço: <strong>R$ {produtoSelecionado.preco.toFixed(2)}</strong> &nbsp;|&nbsp;
        Custo: <strong>R$ {produtoSelecionado.custoUnitario.toFixed(2)}</strong> &nbsp;|&nbsp;
        Outros custos: <strong>R$ {produtoSelecionado.outrosCustos.toFixed(2)}</strong>
      </p>
    </div>
  </div>

  {/* Botão excluir produto */}
  <button
    onClick={() => excluirProduto(produtoSelecionado.id)}
    className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-transparent border border-red-300 rounded transition-colors duration-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
  >
    Excluir Produto
  </button>
</div>


            {/* Lista de Variações */}
            <div className="space-y-4 max-h-[420px] overflow-auto">
              {produtoSelecionado.variacoes.map((v) => {
                const estaEditando = editandoEstoque[v.id];
                return (
                  <div key={v.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 shadow-sm">
                    <div>
                      <p className="font-medium">
                        Numeração: <span className="text-blue-600">{v.numeracao}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Estoque atual: <span className="font-semibold">{v.estoque}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0 items-center">
                      {estaEditando ? (
                        <>
                          <input
                            type="number"
                            className="border rounded px-2 py-1 w-24"
                            value={estoquesEditados[v.id] ?? v.estoque}
                            onChange={(e) => handleEstoqueChange(v.id, e.target.value)}
                          />
                          <button
                            onClick={() => {
                              salvarEstoque(v.id);
                              setEditandoEstoque((prev) => ({ ...prev, [v.id]: false }));
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition"
                            title="Salvar"
                          >
                            <FaSave size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditandoEstoque((prev) => ({ ...prev, [v.id]: true }))}
                          className="bg-gray-400 hover:bg-gray-500 text-white p-2 rounded-full transition"
                          title="Editar estoque"
                        >
                          <FaEdit size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => excluirVariacao(v.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition"
                        title="Excluir variação"
                      >
                        <FaTrashAlt size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Adicionar Nova Variação */}
            {!mostrarFormularioVariacao ? (
              <div className="mt-6">
                <button
                  onClick={() => setMostrarFormularioVariacao(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md shadow-sm transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <span className="text-lg">➕</span>
                  <span>Adicionar Nova Variação</span>
                </button>
              </div>
            ) : (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">➕ Nova Variação</h3>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Numeração (ex: 39)"
                    value={novaVariacao.numeracao}
                    onChange={(e) => setNovaVariacao({ ...novaVariacao, numeracao: e.target.value })}
                    className="border rounded px-3 py-2 text-sm w-full sm:w-40"
                  />
                  <input
                    type="number"
                    placeholder="Estoque"
                    value={novaVariacao.estoque}
                    onChange={(e) => setNovaVariacao({ ...novaVariacao, estoque: e.target.value })}
                    className="border rounded px-3 py-2 text-sm w-full sm:w-32"
                  />
                  <button
                    onClick={adicionarVariacao}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                  >
                    <FaPlus className="inline mr-1" /> Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setMostrarFormularioVariacao(false);
                      setNovaVariacao({ numeracao: "", estoque: "" });
                    }}
                    className="text-sm text-gray-600 hover:underline ml-2"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Botões de Grade Inteira */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => adicionarGradeCompleta("baixa")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Adicionar Grade Baixa
                  </button>
                  <button
                    onClick={() => adicionarGradeCompleta("alta")}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Adicionar Grade Alta
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botão de Cadastrar Produto */}
      <button
        onClick={() => setMostrarModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg"
      >
        + Cadastrar Produto
      </button>

      {/* Modal */}
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
