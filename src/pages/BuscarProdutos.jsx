import { useState, useEffect } from "react";
import api from "../services/api";

export default function BuscaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);

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

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()))
  );

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
      </div>

      {/* Estados de carregamento / erro */}
      {carregando && (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      )}

      {erroCarregamento && (
        <p className="text-red-500 text-center mt-4">
          ❌ Erro ao carregar produtos.
        </p>
      )}

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
                        let estilo = "bg-gray-100 text-gray-400 border-gray-200 line-through"; // padrão esgotado

                        if (v.estoque > 5) {
                            estilo = "bg-green-50 text-green-700 border-green-300";
                        } else if (v.estoque > 0) {
                            estilo = "bg-blue-50 text-blue-700 border-blue-200";
                        }

                        return (
                            <div
                            key={v.id}
                            className={`flex flex-col items-center justify-center w-16 h-10 rounded-md border ${estilo} shadow-sm hover:shadow transition duration-150`}
                            >
                            <span className="text-[13px] font-bold text-gray-800 leading-none">{v.numeracao}</span>
                            <span className="text-[11px] text-gray-500 leading-none mt-[3px]">{v.estoque} unid.</span>
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
