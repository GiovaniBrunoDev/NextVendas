export function MetaCard({ titulo, valorMeta, valorAtual }) {
  const porcentagem = Math.min((valorAtual / valorMeta) * 100, 100);

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-950">{titulo}</h4>
      <p className="text-lg font-semibold text-slate-950">
        {valorAtual.toLocaleString("pt-BR")} / {valorMeta.toLocaleString("pt-BR")}
      </p>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${porcentagem}%` }} />
      </div>
      <p className="text-xs text-slate-500">{porcentagem.toFixed(1)}% concluido</p>
    </div>
  );
}
