import { useState, useEffect } from "react";
import api from "../services/api";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";


export default function BuscaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  const [numeracaoSelecionada, setNumeracaoSelecionada] = useState("");

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErroCarregamento(false);
      const res = await api.get("/produtos");
      setProdutos(res.data);
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

  // Lista de numerações únicas (ordenadas)
  const todasNumeracoes = [
    ...new Set(produtos.flatMap((p) => p.variacoes.map((v) => v.numeracao))),
  ].sort((a, b) => a - b);

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()))
  );

  // Função para baixar imagens em ZIP
  async function baixarImagens() {
    if (!numeracaoSelecionada) {
      alert("Selecione uma numeração primeiro.");
      return;
    }

    const zip = new JSZip();

    const produtosComVariacao = produtos.filter((p) =>
      p.variacoes.some(
        (v) => v.numeracao === numeracaoSelecionada && v.estoque > 0
      )
    );

    if (produtosComVariacao.length === 0) {
      alert("Nenhum produto encontrado com essa numeração em estoque.");
      return;
    }

    for (const produto of produtosComVariacao) {
      if (!produto.imagemUrl) continue;

      try {
        const res = await fetch(produto.imagemUrl);
        const blob = await res.blob();

        // Nome seguro para o arquivo (sem espaços e com código/id)
        const nomeArquivo = `${produto.codigo || produto.id || "produto"}_${
          numeracaoSelecionada
        }.jpg`;

        zip.file(nomeArquivo, blob);
      } catch (err) {
        console.error(`Erro ao baixar ${produto.imagemUrl}:`, err);
      }
    }


    const conteudo = await zip.generateAsync({ type: "blob" });
    saveAs(conteudo, `imagens_variacao_${numeracaoSelecionada}.zip`);
  }

   // 🔥 Tela de carregamento
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Círculo Loader */}
        <motion.svg
          className="w-16 h-16 text-gray-600"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset="60"
          />
        </motion.svg>

        {/* Texto */}
        <motion.p
          className="mt-6 text-gray-600 font-medium text-lg tracking-wide"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Carregando Produtos...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Campo de busca fixo */}
      <div className="sticky top-0 bg-white z-10 pb-3">
        <h1 className="text-lg font-semibold mb-2">Consulta de Produtos</h1>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite nome ou código..."
          className="w-full border border-gray-300 p-3 rounded-md placeholder:text-sm text-base"
        />

        {/* Seleção da numeração e botão */}
        <div className="flex items-center gap-2 mt-3">
          <select
            value={numeracaoSelecionada}
            onChange={(e) => setNumeracaoSelecionada(e.target.value)}
            className="flex-1 border border-gray-300 p-2 rounded-md"
          >
            <option value="">Selecione uma numeração</option>
            {todasNumeracoes.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>

          <button
            onClick={baixarImagens}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            Baixar
          </button>
        </div>
      </div>

      {/* Lista */}
      {!carregando && !erroCarregamento && (
        <>
          {produtosFiltrados.length > 0 ? (
            <div className="space-y-4 mt-4">
              {produtosFiltrados.map((produto) => (
                <div
                  key={produto.id}
                  className="bg-white border rounded-xl p-4 shadow-sm"
                >
                  {/* Cabeçalho do card */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={
                        produto.imagemUrl ||
                        "https://cdn-icons-png.flaticon.com/512/771/771543.png"
                      }
                      alt={produto.nome}
                      className="w-12 h-12 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {produto.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        Código: {produto.codigo || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Numerações */}
                  <div className="grid grid-cols-4 gap-2">
                    {produto.variacoes
                      .slice()
                      .sort((a, b) => a.numeracao - b.numeracao)
                      .map((v) => {
                        let estilo =
                          "bg-gray-100 text-gray-400 border-gray-200 line-through";
                        if (v.estoque > 5) {
                          estilo =
                            "bg-green-50 text-green-700 border-green-300";
                        } else if (v.estoque > 0) {
                          estilo = "bg-blue-50 text-blue-700 border-blue-200";
                        }
                        return (
                          <div
                            key={v.id}
                            className={`flex flex-col items-center justify-center w-16 h-10 rounded-md border ${estilo} shadow-sm hover:shadow transition duration-150`}
                          >
                            <span className="text-[13px] font-bold text-gray-800 leading-none">
                              {v.numeracao}
                            </span>
                            <span className="text-[11px] text-gray-500 leading-none mt-[3px]">
                              {v.estoque} unid.
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            busca && (
              <p className="text-gray-500 text-center mt-4">
                Nenhum produto encontrado.
              </p>
            )
          )}
        </>
      )}
    </div>
  );
}
