import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CalendarClock, Copy, Plus, RefreshCw, Store, Ticket, Wallet } from "lucide-react";
import api from "../services/api";

const inputClass =
  "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SuperAdmin() {
  const [lojas, setLojas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [convites, setConvites] = useState([]);
  const [nomeLoja, setNomeLoja] = useState("");
  const [email, setEmail] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [nomePlano, setNomePlano] = useState("");
  const [valorPlano, setValorPlano] = useState("");
  const [descricaoPlano, setDescricaoPlano] = useState("");
  const [carregando, setCarregando] = useState(true);

  const resumo = useMemo(() => {
    const ativas = lojas.filter((loja) => loja.assinaturaAtiva).length;
    const vencidas = lojas.length - ativas;
    const pendentes = convites.filter((convite) => convite.status === "pendente").length;
    return { ativas, vencidas, pendentes };
  }, [convites, lojas]);

  async function carregar() {
    try {
      const [lojasRes, planosRes, convitesRes] = await Promise.all([
        api.get("/admin/lojas"),
        api.get("/admin/planos"),
        api.get("/admin/convites"),
      ]);
      setLojas(lojasRes.data);
      setPlanos(planosRes.data);
      setConvites(convitesRes.data);
      if (!planoId && planosRes.data?.[0]?.id) setPlanoId(String(planosRes.data[0].id));
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao carregar admin.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarConvite(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/admin/convites", {
        nomeLoja,
        email: email || null,
        planoId: planoId || null,
      });
      setConvites((prev) => [data, ...prev]);
      setNomeLoja("");
      setEmail("");
      toast.success("Convite criado.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao criar convite.");
    }
  }

  async function criarPlano(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/admin/planos", {
        nome: nomePlano,
        valorMensal: Number(valorPlano || 0),
        descricao: descricaoPlano || null,
      });
      setPlanos((prev) => [...prev, data]);
      setNomePlano("");
      setValorPlano("");
      setDescricaoPlano("");
      toast.success("Plano criado.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao criar plano.");
    }
  }

  async function renovar(loja, dias = 30) {
    const venceEm = new Date();
    venceEm.setDate(venceEm.getDate() + dias);

    try {
      await api.put(`/admin/assinaturas/${loja.id}`, {
        status: "ativa",
        planoId: loja.assinatura?.planoId || planos[0]?.id || null,
        venceEm: venceEm.toISOString(),
      });
      toast.success("Assinatura atualizada.");
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao atualizar assinatura.");
    }
  }

  async function copiar(texto) {
    await navigator.clipboard.writeText(texto);
    toast.success("Link copiado.");
  }

  if (carregando) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700"></div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Lojas, planos e convites</h1>
          <p className="mt-1 text-sm text-slate-500">Controle manual de acesso e mensalidades das lojas.</p>
        </div>
        <button onClick={carregar} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: "Lojas ativas", value: resumo.ativas, icon: Store },
          { label: "Vencidas", value: resumo.vencidas, icon: CalendarClock },
          { label: "Convites pendentes", value: resumo.pendentes, icon: Ticket },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
              <Icon size={14} /> {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mb-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
            <Plus size={18} /> Novo convite
          </h2>
          <form onSubmit={criarConvite} className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]">
            <input value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} placeholder="Nome da loja" className={inputClass} required />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email do dono" type="email" className={inputClass} />
            <select value={planoId} onChange={(e) => setPlanoId(e.target.value)} className={inputClass}>
              <option value="">Sem plano</option>
              {planos.map((plano) => (
                <option key={plano.id} value={plano.id}>{plano.nome}</option>
              ))}
            </select>
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Criar</button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-950">
            <Wallet size={18} /> Novo plano
          </h2>
          <form onSubmit={criarPlano} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
            <input value={nomePlano} onChange={(e) => setNomePlano(e.target.value)} placeholder="Nome" className={inputClass} required />
            <input value={valorPlano} onChange={(e) => setValorPlano(e.target.value)} placeholder="Valor" type="number" className={inputClass} required />
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Salvar</button>
            <input value={descricaoPlano} onChange={(e) => setDescricaoPlano(e.target.value)} placeholder="Descricao" className={`${inputClass} sm:col-span-3`} />
          </form>
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-950">Lojas</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {lojas.map((loja) => (
            <div key={loja.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-center">
              <div>
                <p className="flex items-center gap-2 font-medium text-slate-950">
                  <Store size={16} /> {loja.nome}
                </p>
                <p className="text-xs text-slate-500">{loja.slug}</p>
              </div>
              <span className="w-max rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                {loja.assinatura?.status || "sem assinatura"}
              </span>
              <span className="text-sm text-slate-500">Vence {formatDate(loja.assinatura?.venceEm)}</span>
              <button onClick={() => renovar(loja)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Marcar +30 dias
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-950">Planos</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {planos.map((plano) => (
              <div key={plano.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{plano.nome}</p>
                  <p className="font-semibold text-slate-950">{formatCurrency(plano.valorMensal)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">{plano.descricao || "Sem descricao"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-950">Convites</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {convites.map((convite) => (
              <div key={convite.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_120px_auto] lg:items-center">
                <div>
                  <p className="font-medium text-slate-950">{convite.nomeLoja}</p>
                  <p className="break-all text-xs text-slate-500">{convite.link}</p>
                </div>
                <span className="text-sm capitalize text-slate-500">{convite.status}</span>
                <button onClick={() => copiar(convite.link)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Copy size={16} /> Copiar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
