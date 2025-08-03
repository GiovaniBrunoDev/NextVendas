import { useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

export default function ProdutoModal({ aoFechar, aoCadastrar }) {
  const [form, setForm] = useState({
  nome: "",
  preco: "",
  custoUnitario: "",
  outrosCustos: "",
});

  const [imagemPreview, setImagemPreview] = useState(null);
const [imagemFile, setImagemFile] = useState(null);

  const [variacoes, setVariacoes] = useState([{ numeracao: "", estoque: "" }]);
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVariacaoChange = (index, campo, valor) => {
    const novas = [...variacoes];
    novas[index][campo] = valor;
    setVariacoes(novas);
  };

  const adicionarVariacao = () => {
    setVariacoes([...variacoes, { numeracao: "", estoque: "" }]);
  };

  const removerVariacao = (index) => {
    if (variacoes.length > 1) {
      setVariacoes(variacoes.filter((_, i) => i !== index));
    }
  };

  const adicionarGradeCompleta = (tipo) => {
    const grades = {
      baixa: ["34", "35", "36", "37", "38", "39"],
      alta: ["38", "39", "40", "41", "42", "43"],
    };

    const gradePronta = grades[tipo].map((n, i) => ({
      numeracao: n,
      estoque: i === 2 || i === 3 ? 3 : 1,
    }));

    setVariacoes(gradePronta);
    toast.info(`Grade ${tipo} carregada. Ajuste conforme necessário.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const preco = parseFloat(form.preco || "0");
      const custoUnitario = parseFloat(form.custoUnitario || "0");
      const outrosCustos = parseFloat(form.outrosCustos || "0");

      const variacoesValidadas = variacoes
        .map((v) => ({
          numeracao: v.numeracao.trim(),
          estoque: parseInt(v.estoque),
        }))
        .filter((v) => v.numeracao && !isNaN(v.estoque));

      if (!form.nome || variacoesValidadas.length === 0) {
        toast.error("Preencha nome e pelo menos uma variação com estoque.");
        return;
      }

      let imagemUrl = "";

      if (imagemFile) {
        try {
          imagemUrl = await fazerUploadLocal();
        } catch (error) {
          toast.error("Erro ao enviar imagem.");
          return;
        }
      }


      await api.post("/produtos", {
        ...form,
        preco,
        imagemUrl,
        custoUnitario,
        outrosCustos,
        variacoes: variacoesValidadas,
      });

      toast.success("Produto cadastrado com sucesso!");
      setForm({ nome: "", preco: "", custoUnitario: "", outrosCustos: "", imagemUrl: "" });
      setVariacoes([{ numeracao: "", estoque: "" }]);

      setTimeout(() => aoCadastrar(), 800);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cadastrar produto.");
    } finally {
      setCarregando(false);
    }
  };

  const handleSelecionarImagem = (e) => {
  const file = e.target.files[0];
  if (file) {
    setImagemPreview(URL.createObjectURL(file));
    setImagemFile(file);
  }
};

const fazerUploadLocal = async () => {
  const formData = new FormData();
  formData.append("imagem", imagemFile);

  const res = await api.post("/produtos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.imageUrl; // retorna "/uploads/imagem.jpg"
};

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={aoFechar}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-blue-700 mb-6 border-b pb-2">
          Novo Produto
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="nome"
            placeholder="Nome do produto"
            value={form.nome}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-md"
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              type="number"
              step="0.01"
              name="preco"
              placeholder="Preço (R$)"
              value={form.preco}
              onChange={handleChange}
              className="border p-2 rounded"
            />
            <input
              type="number"
              step="0.01"
              name="custoUnitario"
              placeholder="Custo Unitário"
              value={form.custoUnitario}
              onChange={handleChange}
              className="border p-2 rounded"
            />
            <input
              type="number"
              step="0.01"
              name="outrosCustos"
              placeholder="Outros Custos"
              value={form.outrosCustos}
              onChange={handleChange}
              className="border p-2 rounded"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleSelecionarImagem}
              className="border p-2 rounded w-full"
            />

          </div>

          {imagemPreview && (
              <div className="flex justify-center">
                <img
                  src={imagemPreview}
                  alt="Prévia"
                  className="w-28 h-28 object-cover rounded-lg border shadow"
                />
              </div>
            )}


          <div>
            <label className="block font-medium mb-2 text-gray-700">
              Grade de variações
            </label>

            {variacoes.map((v, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Numeração"
                  value={v.numeracao}
                  onChange={(e) =>
                    handleVariacaoChange(index, "numeracao", e.target.value)
                  }
                  className="w-1/2 border p-2 rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Estoque"
                  value={v.estoque}
                  onChange={(e) =>
                    handleVariacaoChange(index, "estoque", e.target.value)
                  }
                  className="w-1/3 border p-2 rounded"
                  required
                />
                <button
                  type="button"
                  onClick={() => removerVariacao(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✖
                </button>
              </div>
            ))}

            <div className="flex flex-wrap gap-4 mt-4">
              <button
                type="button"
                onClick={adicionarVariacao}
                className="text-sm text-blue-600 hover:underline"
              >
                + Adicionar variação
              </button>
              <button
                type="button"
                onClick={() => adicionarGradeCompleta("baixa")}
                className="text-sm text-gray-600 hover:underline"
              >
                Grade Baixa (34–39)
              </button>
              <button
                type="button"
                onClick={() => adicionarGradeCompleta("alta")}
                className="text-sm text-gray-600 hover:underline"
              >
                Grade Alta (38–43)
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={aoFechar}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                carregando ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {carregando ? "Salvando..." : "Salvar Produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
