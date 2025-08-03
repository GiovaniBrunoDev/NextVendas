import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const resposta = await api.get('/produtos');
        setProdutos(resposta.data);
      } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
      }
    }

    carregarProdutos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Produtos Cadastrados</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {produtos.map((produto) => (
          <div key={produto.id} className="bg-white shadow-md rounded-lg p-4 border">
            <h2 className="text-lg font-semibold">{produto.nome}</h2>
            <p className="text-sm text-gray-500">Código: {produto.codigo}</p>
            <p>Preço: R$ {produto.preco.toFixed(2)}</p>
            <p>Número: {produto.numeracao}</p>
            <p>Estoque: {produto.estoque}</p>
            {produto.imagemUrl && (
              <img
                src={produto.imagemUrl}
                alt={produto.nome}
                className="mt-2 w-full h-32 object-cover rounded"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
