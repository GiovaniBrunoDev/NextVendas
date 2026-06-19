import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Ticket,
  Trash2,
  UserCog,
  UsersRound,
  Wallet,
  XCircle,
} from "lucide-react";
import api from "../services/api";

const inputClass =
  "min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-base outline-none transition placeholder:text-slate-400 focus:border-slate-400 sm:text-sm";

const tabs = [
  { key: "visao", label: "Visão geral", icon: ShieldCheck },
  { key: "lojas", label: "Lojas", icon: Store },
  { key: "usuarios", label: "Usuários", icon: UsersRound },
  { key: "planos", label: "Planos", icon: Wallet },
  { key: "convites", label: "Convites", icon: Ticket },
];

const perfis = [
  { value: "admin", label: "Admin" },
  { value: "gerente", label: "Gerente" },
  { value: "vendedor", label: "Vendedor" },
];

function formatDate(value) {
  if (!value) return "-";
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function textoBusca(value) {
  return String(value || "").toLowerCase();
}

function statusAssinatura(loja) {
  if (!loja.assinatura) return "sem assinatura";
  return loja.assinaturaAtiva ? loja.assinatura.status || "ativa" : loja.assinatura.status || "vencida";
}

function badgeClasses(status, ativo = true) {
  if (!ativo) return "border-slate-200 bg-slate-100 text-slate-500";
  if (["ativa", "trial", "pendente"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["vencida", "cancelada", "expirado"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function SuperAdmin() {
  const [aba, setAba] = useState("visao");
  const [lojas, setLojas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [convites, setConvites] = useState([]);
  const [busca, setBusca] = useState("");
  const [nomeLoja, setNomeLoja] = useState("");
  const [email, setEmail] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [diasExpiracao, setDiasExpiracao] = useState("7");
  const [nomePlano, setNomePlano] = useState("");
  const [valorPlano, setValorPlano] = useState("");
  const [descricaoPlano, setDescricaoPlano] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const resumo = useMemo(() => {
    const lojasAtivas = lojas.filter((loja) => loja.ativa).length;
    const assinaturasAtivas = lojas.filter((loja) => loja.assinaturaAtiva).length;
    const vencidas = lojas.filter((loja) => loja.assinatura && !loja.assinaturaAtiva).length;
    const usuariosAtivos = usuarios.filter((usuario) => usuario.ativo).length;
    const pendentes = convites.filter((convite) => convite.status === "pendente").length;
    const receitaPrevista = lojas.reduce((soma, loja) => {
      if (!loja.assinaturaAtiva) return soma;
      return soma + Number(loja.assinatura?.plano?.valorMensal || 0);
    }, 0);

    return {
      lojas: lojas.length,
      lojasAtivas,
      assinaturasAtivas,
      vencidas,
      usuarios: usuarios.length,
      usuariosAtivos,
      pendentes,
      receitaPrevista,
    };
  }, [convites, lojas, usuarios]);

  const lojasFiltradas = useMemo(() => {
    const termo = textoBusca(busca);
    if (!termo) return lojas;
    return lojas.filter((loja) =>
      [loja.nome, loja.slug, loja.email, loja.telefone, loja.documento]
        .map(textoBusca)
        .join(" ")
        .includes(termo)
    );
  }, [busca, lojas]);

  const usuariosFiltrados = useMemo(() => {
    const termo = textoBusca(busca);
    if (!termo) return usuarios;
    return usuarios.filter((usuario) =>
      [
        usuario.nome,
        usuario.email,
        usuario.telefone,
        usuario.superadmin ? "superadmin" : "",
        ...(usuario.lojas || []).map((loja) => `${loja.lojaNome} ${loja.papel}`),
      ]
        .map(textoBusca)
        .join(" ")
        .includes(termo)
    );
  }, [busca, usuarios]);

  async function carregar() {
    try {
      setAtualizando(true);
      const [lojasRes, usuariosRes, planosRes, convitesRes] = await Promise.all([
        api.get("/admin/lojas"),
        api.get("/admin/usuarios"),
        api.get("/admin/planos"),
        api.get("/admin/convites"),
      ]);
      setLojas(Array.isArray(lojasRes.data) ? lojasRes.data : []);
      setUsuarios(Array.isArray(usuariosRes.data) ? usuariosRes.data : []);
      setPlanos(Array.isArray(planosRes.data) ? planosRes.data : []);
      setConvites(Array.isArray(convitesRes.data) ? convitesRes.data : []);
      if (!planoId && planosRes.data?.[0]?.id) setPlanoId(String(planosRes.data[0].id));
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao carregar admin.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
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
        diasExpiracao: Number(diasExpiracao || 7),
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
      toast.success(`Assinatura renovada por ${dias} dias.`);
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao atualizar assinatura.");
    }
  }

  async function atualizarStatusLoja(loja, ativa) {
    try {
      await api.put(`/admin/lojas/${loja.id}`, { ativa });
      toast.success(ativa ? "Loja ativada." : "Loja inativada.");
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao atualizar loja.");
    }
  }

  async function atualizarUsuario(usuario, payload) {
    try {
      await api.put(`/admin/usuarios/${usuario.id}`, payload);
      toast.success("Usuário atualizado.");
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao atualizar usuário.");
    }
  }

  async function excluirUsuario(usuario) {
    const mensagem = usuario.historicoOperacional
      ? `O usuário ${usuario.nome} possui histórico. Ele será desativado e removido das lojas. Continuar?`
      : `Excluir definitivamente o usuário ${usuario.nome}?`;

    if (!window.confirm(mensagem)) return;

    try {
      const { data } = await api.delete(`/admin/usuarios/${usuario.id}`);
      toast.success(data.mensagem || "Usuário removido.");
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao excluir usuário.");
    }
  }

  async function atualizarMembro(membro, payload) {
    try {
      await api.put(`/admin/membros/${membro.id}`, payload);
      toast.success("Acesso atualizado.");
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao atualizar acesso.");
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
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-slate-500 border-t-slate-700" />
        </div>
        <p className="mt-5 text-sm font-medium text-slate-600">Carregando admin...</p>
      </div>
    );
  }

  return (
    <div className="lojia-page min-h-screen p-4 sm:p-6">
      <header className="lojia-hero-panel mb-5 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Super Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Central de controle da Lojia</h1>
          <p className="mt-1 text-sm text-white/68">
            Gerencie lojas, usuários, planos, convites e mensalidades em um só lugar.
          </p>
        </div>
        <button
          type="button"
          onClick={carregar}
          disabled={atualizando}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60"
        >
          <RefreshCw size={16} className={atualizando ? "animate-spin" : ""} />
          Atualizar
        </button>
      </header>

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lojas ativas" value={`${resumo.lojasAtivas}/${resumo.lojas}`} icon={Store} />
        <MetricCard label="Assinaturas ativas" value={resumo.assinaturasAtivas} icon={CheckCircle2} />
        <MetricCard label="Usuários ativos" value={`${resumo.usuariosAtivos}/${resumo.usuarios}`} icon={UsersRound} />
        <MetricCard label="Receita prevista" value={formatCurrency(resumo.receitaPrevista)} icon={Wallet} />
      </section>

      <section className="lojia-surface sticky top-0 z-10 mb-5 p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setAba(key)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                  aba === key
                    ? "bg-[#0B1115] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:text-slate-950"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <label className="relative min-w-0 xl:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar loja, usuário, email ou slug"
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-base outline-none focus:border-slate-400 sm:text-sm"
            />
          </label>
        </div>
      </section>

      {aba === "visao" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="lojia-surface p-5">
            <h2 className="text-base font-semibold text-slate-950">Operação SaaS</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Lojas vencidas" value={resumo.vencidas} icon={AlertTriangle} />
              <InfoTile label="Convites pendentes" value={resumo.pendentes} icon={Ticket} />
              <InfoTile label="Planos cadastrados" value={planos.length} icon={CreditCard} />
              <InfoTile label="Usuários totais" value={usuarios.length} icon={UserCog} />
            </div>
          </section>

          <section className="lojia-surface p-5">
            <h2 className="text-base font-semibold text-slate-950">Ações rápidas</h2>
            <div className="mt-4 space-y-2">
              <QuickAction icon={Plus} label="Criar convite" onClick={() => setAba("convites")} />
              <QuickAction icon={UsersRound} label="Gerenciar usuários" onClick={() => setAba("usuarios")} />
              <QuickAction icon={Wallet} label="Criar plano" onClick={() => setAba("planos")} />
              <QuickAction icon={Store} label="Ver lojas" onClick={() => setAba("lojas")} />
            </div>
          </section>
        </div>
      )}

      {aba === "lojas" && (
        <section className="space-y-3">
          {lojasFiltradas.map((loja) => (
            <article key={loja.id} className="lojia-surface overflow-hidden p-0">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">{loja.nome}</h2>
                    <StatusBadge status={statusAssinatura(loja)} ativo={loja.ativa} />
                    {!loja.ativa && <StatusBadge status="inativa" ativo={false} />}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{loja.slug}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {loja.email || "Sem email"} · {loja.telefone || "Sem telefone"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => renovar(loja, 7)} className="lojia-ghost-action px-3 py-2 text-sm font-semibold">
                    +7 dias
                  </button>
                  <button onClick={() => renovar(loja, 30)} className="lojia-primary-action px-3 py-2 text-sm font-semibold">
                    +30 dias
                  </button>
                  <button
                    onClick={() => atualizarStatusLoja(loja, !loja.ativa)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {loja.ativa ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                    {loja.ativa ? "Inativar" : "Ativar"}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-4">
                <InfoTile compact label="Plano" value={loja.assinatura?.plano?.nome || "Sem plano"} icon={CreditCard} />
                <InfoTile compact label="Vencimento" value={formatDate(loja.assinatura?.venceEm)} icon={CalendarClock} />
                <InfoTile compact label="Vendas" value={loja._count?.vendas || 0} icon={Wallet} />
                <InfoTile compact label="Produtos" value={loja._count?.produtos || 0} icon={Building2} />
              </div>

              <div className="border-t border-slate-200 p-4">
                <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Equipe da loja</p>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {(loja.membros || []).map((membro) => (
                    <MemberRow key={membro.id} membro={membro} onChange={atualizarMembro} />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {aba === "usuarios" && (
        <section className="grid gap-3 xl:grid-cols-2">
          {usuariosFiltrados.map((usuario) => (
            <article key={usuario.id} className="lojia-surface p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-slate-950">{usuario.nome}</h2>
                    <StatusBadge status={usuario.ativo ? "ativo" : "inativo"} ativo={usuario.ativo} />
                    {usuario.superadmin && <StatusBadge status="superadmin" />}
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Mail size={14} /> {usuario.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Criado em {formatDate(usuario.criadoEm)} · {usuario.lojas?.length || 0} loja(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => atualizarUsuario(usuario, { ativo: !usuario.ativo })}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {usuario.ativo ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                    {usuario.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => excluirUsuario(usuario)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 size={15} /> Excluir
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(usuario.lojas || []).map((membro) => (
                  <MemberRow key={membro.id} membro={membro} onChange={atualizarMembro} compact />
                ))}
                {(!usuario.lojas || usuario.lojas.length === 0) && (
                  <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                    Usuário sem loja vinculada.
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {aba === "planos" && (
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="lojia-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
              <Wallet size={18} /> Novo plano
            </h2>
            <form onSubmit={criarPlano} className="space-y-3">
              <input value={nomePlano} onChange={(e) => setNomePlano(e.target.value)} placeholder="Nome do plano" className={inputClass} required />
              <input value={valorPlano} onChange={(e) => setValorPlano(e.target.value)} placeholder="Valor mensal" type="number" className={inputClass} required />
              <textarea
                value={descricaoPlano}
                onChange={(e) => setDescricaoPlano(e.target.value)}
                placeholder="Descrição"
                className={`${inputClass} min-h-24 py-3`}
              />
              <button className="lojia-primary-action min-h-11 w-full text-sm font-semibold">Salvar plano</button>
            </form>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            {planos.map((plano) => (
              <article key={plano.id} className="lojia-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{plano.nome}</h3>
                    <p className="mt-1 text-sm text-slate-500">{plano.descricao || "Sem descrição"}</p>
                  </div>
                  <StatusBadge status={plano.ativo ? "ativo" : "inativo"} ativo={plano.ativo} />
                </div>
                <p className="mt-4 text-2xl font-semibold text-slate-950">{formatCurrency(plano.valorMensal)}</p>
              </article>
            ))}
          </section>
        </div>
      )}

      {aba === "convites" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="lojia-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
              <Plus size={18} /> Novo convite
            </h2>
            <form onSubmit={criarConvite} className="grid gap-3">
              <input value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} placeholder="Nome da loja" className={inputClass} required />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email do dono" type="email" className={inputClass} />
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <select value={planoId} onChange={(e) => setPlanoId(e.target.value)} className={inputClass}>
                  <option value="">Sem plano</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>{plano.nome}</option>
                  ))}
                </select>
                <input value={diasExpiracao} onChange={(e) => setDiasExpiracao(e.target.value)} placeholder="Dias" type="number" className={inputClass} />
              </div>
              <button className="lojia-primary-action min-h-11 text-sm font-semibold">Criar convite</button>
            </form>
          </section>

          <section className="lojia-surface overflow-hidden p-0">
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-semibold text-slate-950">Convites recentes</h2>
            </div>
            <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
              {convites.map((convite) => (
                <div key={convite.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">{convite.nomeLoja}</p>
                      <p className="mt-1 text-xs text-slate-500">{convite.email || "Sem email definido"}</p>
                    </div>
                    <StatusBadge status={convite.status} />
                  </div>
                  <p className="mt-3 break-all rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">
                    {convite.link}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => copiar(convite.link)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      <Copy size={15} /> Copiar
                    </button>
                    <a href={convite.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                      <ExternalLink size={15} /> Abrir
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="lojia-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function InfoTile({ label, value, icon: Icon, compact = false }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 ${compact ? "p-3" : "p-4"}`}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        <Icon size={14} /> {label}
      </p>
      <p className={`mt-1 font-semibold text-slate-950 ${compact ? "text-sm" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
    >
      <span className="inline-flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <span className="text-slate-400">→</span>
    </button>
  );
}

function StatusBadge({ status, ativo = true }) {
  const texto = String(status || "sem status");
  return (
    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${badgeClasses(texto, ativo)}`}>
      {texto}
    </span>
  );
}

function MemberRow({ membro, onChange, compact = false }) {
  const nome = membro.usuario?.nome || membro.lojaNome || membro.loja?.nome || "Sem nome";
  const detalhe = membro.usuario?.email || membro.lojaSlug || membro.loja?.slug || "";

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 ${compact ? "p-2.5" : "p-3"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{nome}</p>
          {detalhe && <p className="mt-0.5 truncate text-xs text-slate-500">{detalhe}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={membro.papel}
            onChange={(e) => onChange(membro, { papel: e.target.value })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-600 outline-none focus:border-slate-400"
          >
            {perfis.map((perfil) => (
              <option key={perfil.value} value={perfil.value}>{perfil.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(membro, { ativo: !membro.ativo })}
            className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
              membro.ativo
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {membro.ativo ? "Ativo" : "Inativo"}
          </button>
        </div>
      </div>
    </div>
  );
}
