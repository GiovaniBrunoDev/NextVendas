import { useEffect, useState } from "react";
import api from "../services/api";
import { MetaCard } from "../components/MetaCard";

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
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">🎯 Metas</h2>

      {/* Formulário */}
      <div className="bg-white shadow p-4 rounded-lg space-y-3">
        <input
          type="text"
          placeholder="Título da meta"
          className="w-full border p-2 rounded"
          value={novaMeta.titulo}
          onChange={(e) => setNovaMeta({ ...novaMeta, titulo: e.target.value })}
        />
        <input
          type="number"
          placeholder="Valor meta"
          className="w-full border p-2 rounded"
          value={novaMeta.valorMeta}
          onChange={(e) => setNovaMeta({ ...novaMeta, valorMeta: e.target.value })}
        />
        <select
          className="w-full border p-2 rounded"
          value={novaMeta.tipo}
          onChange={(e) => setNovaMeta({ ...novaMeta, tipo: e.target.value })}
        >
          <option value="vendas">Vendas (R$)</option>
          <option value="lucro">Lucro</option>
          <option value="produtosVendidos">Produtos Vendidos</option>
          <option value="clientes">Clientes Atendidos</option>
        </select>
        <select
          className="w-full border p-2 rounded"
          value={novaMeta.periodo}
          onChange={(e) => setNovaMeta({ ...novaMeta, periodo: e.target.value })}
        >
          <option value="dia">Dia</option>
          <option value="semana">Semana</option>
          <option value="mes">Mês</option>
        </select>
        <button onClick={criarMeta} className="bg-blue-600 text-white px-4 py-2 rounded">
          Criar Meta
        </button>
      </div>

      {/* Listagem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metas.map((m) => (
          <MetaCard
            key={m.id}
            titulo={m.titulo}
            valorMeta={m.valorMeta}
            valorAtual={100} // depois você liga com vendas reais
          />
        ))}
      </div>
    </div>
  );
}
