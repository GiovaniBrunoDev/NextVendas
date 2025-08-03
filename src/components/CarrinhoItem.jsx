export default function CarrinhoItem({ item }) {
  return (
    <div className="flex justify-between py-1 border-b">
      <span>{item.nome} x{item.qtd}</span>
      <span>R$ {(item.qtd * item.preco).toFixed(2)}</span>
    </div>
  );
}
