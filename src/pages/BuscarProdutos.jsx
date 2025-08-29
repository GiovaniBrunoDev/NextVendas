import { useState } from "react";

export default function BuscaProduto() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);

  const buscar = async () => {
    const res = await fetch(`/api/produtos/buscar?q=${query}`);
    const data = await res.json();
    setResultados(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Busca de Produtos</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome do produto"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={buscar}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Buscar
        </button>
      </div>

      {resultados.length > 0 ? (
        <div className="grid gap-4">
          {resultados.map((produto) => (
            <div key={produto.id} className="p-4 border rounded-lg shadow-md bg-white">
              <h2 className="text-lg font-semibold">{produto.nome}</h2>
              <p className="text-gray-600">Preço: R$ {produto.preco.toFixed(2)}</p>

              {produto.imagemUrlCompleta && (
                <img
                  src={produto.imagemUrlCompleta}
                  alt={produto.nome}
                  className="w-24 h-24 object-cover mt-2"
                />
              )}

              <div className="mt-2">
                <h3 className="font-medium">Variações:</h3>
                <ul className="list-disc pl-6">
                  {produto.variacoes.map((v) => (
                    <li
                      key={v.id}
                      className={v.estoque > 0 ? "text-green-600" : "text-red-500"}
                    >
                      Numeração {v.numeracao} — Estoque: {v.estoque}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        query && <p className="text-gray-500">Nenhum produto encontrado.</p>
      )}
    </div>
  );
}
