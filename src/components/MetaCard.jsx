export function MetaCard({ titulo, valorMeta, valorAtual }) {
  const porcentagem = Math.min((valorAtual / valorMeta) * 100, 100);

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-2">
      <h4 className="text-sm font-semibold text-gray-700">{titulo}</h4>
      <p className="text-lg font-bold text-gray-900">
        {valorAtual.toLocaleString("pt-BR")} / {valorMeta.toLocaleString("pt-BR")}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${porcentagem}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{porcentagem.toFixed(1)}% concluído</p>
    </div>
  );
}
