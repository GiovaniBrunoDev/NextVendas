import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import api from "../services/api";
import { MetaCard } from "../components/MetaCard";

const inputClass =
  "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white";

export default function Metas() {
  const [metas, setMetas] = useState([]);
  const [novaMeta, setNovaMeta] = useState({ titulo: "", valorMeta: "", tipo: "vendas", periodo: "mes" });

  async function carregarMetas() {
    const res = await api.get("/metas");
    setMetas(res.data);
  }

  async function criarMeta() {
    if (!novaMeta.titulo || !novaMeta.valorMeta) return alert("Preencha os campos");
    await api.post("/metas", { ...novaMeta, valorMeta: parseFloat(novaMeta.valorMeta) });
    setNovaMeta({ titulo: "", valorMeta: "", tipo: "vendas", periodo: "mes" });
    carregarMetas();
  }

  useEffect(() => {
    carregarMetas();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
          <Target size={22} className="text-slate-500" /> Metas
        </h1>
        <p className="mt-1 text-sm text-slate-500">Acompanhe objetivos de vendas, lucro, produtos e clientes.</p>
      </div>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-950">Nova meta</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_160px_180px_150px_auto]">
          <input
            type="text"
            placeholder="Titulo da meta"
            className={inputClass}
            value={novaMeta.titulo}
            onChange={(e) => setNovaMeta({ ...novaMeta, titulo: e.target.value })}
          />
          <input
            type="number"
            placeholder="Valor"
            className={inputClass}
            value={novaMeta.valorMeta}
            onChange={(e) => setNovaMeta({ ...novaMeta, valorMeta: e.target.value })}
          />
          <select className={inputClass} value={novaMeta.tipo} onChange={(e) => setNovaMeta({ ...novaMeta, tipo: e.target.value })}>
            <option value="vendas">Vendas (R$)</option>
            <option value="lucro">Lucro</option>
            <option value="produtosVendidos">Produtos vendidos</option>
            <option value="clientes">Clientes atendidos</option>
          </select>
          <select className={inputClass} value={novaMeta.periodo} onChange={(e) => setNovaMeta({ ...novaMeta, periodo: e.target.value })}>
            <option value="dia">Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mês</option>
          </select>
          <button onClick={criarMeta} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Criar
          </button>
        </div>
      </section>

      {metas.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 text-center">
          <Target size={32} className="mb-3 text-slate-400" />
          <p className="text-sm font-medium text-slate-900">Nenhuma meta cadastrada</p>
          <p className="mt-1 text-sm text-slate-500">Crie a primeira meta para acompanhar o desempenho.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metas.map((m) => (
            <MetaCard key={m.id} titulo={m.titulo} valorMeta={m.valorMeta} valorAtual={100} />
          ))}
        </div>
      )}
    </div>
  );
}
