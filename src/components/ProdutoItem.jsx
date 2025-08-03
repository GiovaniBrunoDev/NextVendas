export default function ProdutoItem({ produto, aoAdicionar }) {
  return (
    <div
      className="bg-white p-4 shadow-sm rounded border border-gray-200 hover:shadow-md cursor-pointer transition"
      onClick={() => aoAdicionar(produto)}
    >
      <h2 className="font-semibold">{produto.nome}</h2>
      <p className="text-sm text-gray-500">Código: {produto.codigo}</p>
      <p>R$ {produto.preco.toFixed(2)}</p>
    </div>
  );
}
