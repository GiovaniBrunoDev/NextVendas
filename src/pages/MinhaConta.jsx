import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Store,
  UserCog,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/10 disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm";

const labelClass = "mb-1.5 block text-xs font-semibold uppercase text-slate-500";

const usuarioInicial = { nome: "", email: "", telefone: "" };
const lojaInicial = {
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  endereco: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
  const numero = Number(value || 0);
  if (!Number.isFinite(numero) || numero <= 0) return "-";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getInitials(nome) {
  const partes = String(nome || "Usuário")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

export default function MinhaConta() {
  const { usuario, lojas = [], lojaAtual, setLojaAtualId, atualizarMinhaConta } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState("perfil");
  const [dadosUsuario, setDadosUsuario] = useState(usuarioInicial);
  const [dadosLoja, setDadosLoja] = useState(lojaInicial);
  const [senha, setSenha] = useState({ atual: "", nova: "" });
  const [salvando, setSalvando] = useState(false);

  const papel = lojaAtual?.papel;
  const loja = lojaAtual?.loja;
  const assinatura = loja?.assinatura;
  const plano = assinatura?.plano;
  const assinaturaAtiva = Boolean(loja?.assinaturaAtiva);
  const podeEditarLoja = usuario?.superadmin || papel === "admin";
  const fotoPerfil = usuario?.fotoUrl || usuario?.avatarUrl || usuario?.imagemUrl;

  const abas = useMemo(
    () => [
      { key: "perfil", label: "Perfil", icon: UserRound },
      { key: "loja", label: "Loja", icon: Store },
      { key: "plano", label: "Plano", icon: CreditCard },
      { key: "seguranca", label: "Segurança", icon: Lock },
    ],
    []
  );

  const planoResumo = useMemo(() => {
    if (!assinatura) {
      return {
        titulo: "Sem assinatura vinculada",
        descricao: "A loja ainda não possui um plano associado.",
        status: "sem assinatura",
        venceEm: "-",
      };
    }

    const status = assinatura.status || (assinaturaAtiva ? "ativa" : "vencida");
    return {
      titulo: assinaturaAtiva ? "Plano ativo" : "Plano vencido",
      descricao: assinaturaAtiva
        ? "Sua loja está liberada para operar normalmente."
        : "Você ainda consegue acessar consultas, mas operações ficam bloqueadas até a regularização.",
      status,
      venceEm: formatDate(assinatura.venceEm),
    };
  }, [assinatura, assinaturaAtiva]);

  useEffect(() => {
    setDadosUsuario({
      nome: usuario?.nome || "",
      email: usuario?.email || "",
      telefone: usuario?.telefone || "",
    });
  }, [usuario]);

  useEffect(() => {
    setDadosLoja({
      nome: loja?.nome || "",
      email: loja?.email || "",
      telefone: loja?.telefone || "",
      documento: loja?.documento || "",
      endereco: loja?.endereco || "",
      bairro: loja?.bairro || "",
      cidade: loja?.cidade || "",
      estado: loja?.estado || "",
      cep: loja?.cep || "",
    });
  }, [loja]);

  function setUsuarioCampo(campo, valor) {
    setDadosUsuario((prev) => ({ ...prev, [campo]: valor }));
  }

  function setLojaCampo(campo, valor) {
    setDadosLoja((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar(e) {
    e.preventDefault();

    try {
      setSalvando(true);
      await atualizarMinhaConta({
        usuario: dadosUsuario,
        loja: podeEditarLoja ? dadosLoja : undefined,
        senhaAtual: senha.atual,
        novaSenha: senha.nova,
      });
      setSenha({ atual: "", nova: "" });
      toast.success("Conta atualizada.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Não foi possível atualizar sua conta.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="lojia-page min-h-screen p-4 sm:p-6">
      <div className="lojia-hero-panel mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Minha conta</h1>
          <p className="mt-1 text-sm text-white/68">
            Organize seus dados, loja, plano e segurança em um só lugar.
          </p>
        </div>
        {abaAtiva !== "plano" && (
          <button
            disabled={salvando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="lojia-surface p-5">
            <div className="flex items-center gap-3">
              <ProfileAvatar nome={usuario?.nome} foto={fotoPerfil} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">{usuario?.nome || "Usuário"}</p>
                <p className="mt-0.5 truncate text-sm font-medium capitalize text-slate-500">
                  {papel || (usuario?.superadmin ? "superadmin" : "sem perfil")}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {abas.map(({ key, label, icon: Icon }) => {
                const ativa = abaAtiva === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAbaAtiva(key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      ativa
                        ? "bg-[#0B1115] text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lojia-surface p-4">
            <div className="flex items-start gap-3">
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  assinaturaAtiva ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-amber-50 text-amber-700"
                }`}
              >
                {assinaturaAtiva ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">{planoResumo.titulo}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Vence em {planoResumo.venceEm}</p>
              </div>
            </div>
          </section>
        </aside>

        <div className="min-w-0">
          {abaAtiva === "perfil" && (
            <div className="space-y-5">
              <Section title="Dados do usuário" icon={UserRound}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome" icon={UserRound}>
                    <input
                      value={dadosUsuario.nome}
                      onChange={(e) => setUsuarioCampo("nome", e.target.value)}
                      className={inputClass}
                      required
                    />
                  </Field>
                  <Field label="E-mail" icon={Mail}>
                    <input
                      type="email"
                      value={dadosUsuario.email}
                      onChange={(e) => setUsuarioCampo("email", e.target.value)}
                      className={inputClass}
                      required
                    />
                  </Field>
                  <Field label="Telefone" icon={Phone}>
                    <input
                      value={dadosUsuario.telefone}
                      onChange={(e) => setUsuarioCampo("telefone", e.target.value)}
                      className={inputClass}
                      placeholder="(00) 00000-0000"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Acesso atual" icon={UserCog}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Info label="Perfil" value={papel || (usuario?.superadmin ? "superadmin" : "sem perfil")} />
                  <Info label="Loja" value={loja?.nome || "-"} />
                  <Info label="Identificador" value={loja?.slug || "-"} />
                </div>
              </Section>
            </div>
          )}

          {abaAtiva === "loja" && (
            <div className="space-y-5">
              <Section title="Dados da loja" icon={Store}>
                {!podeEditarLoja && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Seu perfil pode visualizar os dados da loja, mas somente um admin pode alterar.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome da loja" icon={Building2}>
                    <input
                      value={dadosLoja.nome}
                      onChange={(e) => setLojaCampo("nome", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                      required={podeEditarLoja}
                    />
                  </Field>
                  <Field label="CPF/CNPJ" icon={ShieldCheck}>
                    <input
                      value={dadosLoja.documento}
                      onChange={(e) => setLojaCampo("documento", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                    />
                  </Field>
                  <Field label="E-mail da loja" icon={Mail}>
                    <input
                      type="email"
                      value={dadosLoja.email}
                      onChange={(e) => setLojaCampo("email", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                    />
                  </Field>
                  <Field label="Telefone da loja" icon={Phone}>
                    <input
                      value={dadosLoja.telefone}
                      onChange={(e) => setLojaCampo("telefone", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                    />
                  </Field>
                  <Field label="Endereço" icon={MapPin} wide>
                    <input
                      value={dadosLoja.endereco}
                      onChange={(e) => setLojaCampo("endereco", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                      placeholder="Rua, número e complemento"
                    />
                  </Field>
                  <Field label="Bairro" icon={MapPin}>
                    <input
                      value={dadosLoja.bairro}
                      onChange={(e) => setLojaCampo("bairro", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                    />
                  </Field>
                  <Field label="Cidade" icon={MapPin}>
                    <input
                      value={dadosLoja.cidade}
                      onChange={(e) => setLojaCampo("cidade", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                    />
                  </Field>
                  <Field label="Estado" icon={MapPin}>
                    <input
                      value={dadosLoja.estado}
                      onChange={(e) => setLojaCampo("estado", e.target.value.toUpperCase().slice(0, 2))}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                      placeholder="UF"
                    />
                  </Field>
                  <Field label="CEP" icon={MapPin}>
                    <input
                      value={dadosLoja.cep}
                      onChange={(e) => setLojaCampo("cep", e.target.value)}
                      className={inputClass}
                      disabled={!podeEditarLoja}
                    />
                  </Field>
                </div>
              </Section>

              {lojas.length > 1 && (
                <Section title="Trocar loja" icon={Building2}>
                  <label>
                    <span className={labelClass}>Loja atual</span>
                    <select
                      value={loja?.id || ""}
                      onChange={(e) => setLojaAtualId(e.target.value)}
                      className={`${inputClass} mt-1.5`}
                    >
                      {lojas.map((item) => (
                        <option key={item.loja.id} value={item.loja.id}>
                          {item.loja.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                </Section>
              )}
            </div>
          )}

          {abaAtiva === "plano" && (
            <div className="space-y-5">
              <section className="lojia-surface overflow-hidden p-0">
                <div className={`p-5 ${assinaturaAtiva ? "bg-[#16A34A]/10" : "bg-amber-50"}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          assinaturaAtiva ? "bg-[#16A34A] text-white" : "bg-amber-500 text-white"
                        }`}
                      >
                        {assinaturaAtiva ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">{planoResumo.titulo}</h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{planoResumo.descricao}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        assinaturaAtiva ? "bg-white text-[#16A34A]" : "bg-white text-amber-700"
                      }`}
                    >
                      {planoResumo.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                  <Info label="Plano" value={plano?.nome || assinatura?.planoNome || "Plano atual"} />
                  <Info label="Mensalidade" value={formatCurrency(plano?.valorMensal || assinatura?.valorMensal)} />
                  <Info label="Vencimento" value={planoResumo.venceEm} />
                  <Info label="Loja" value={loja?.nome || "-"} />
                </div>
              </section>

              <Section title="Detalhes da assinatura" icon={CalendarDays}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Status" value={planoResumo.status} />
                  <Info label="Início do trial" value={formatDate(assinatura?.trialInicio || assinatura?.criadoEm)} />
                  <Info label="Fim do trial" value={formatDate(assinatura?.trialFim)} />
                  <Info label="Última atualização" value={formatDate(assinatura?.atualizadoEm)} />
                </div>
              </Section>
            </div>
          )}

          {abaAtiva === "seguranca" && (
            <Section title="Segurança" icon={Lock}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Senha atual" icon={Lock}>
                  <input
                    type="password"
                    value={senha.atual}
                    onChange={(e) => setSenha((prev) => ({ ...prev, atual: e.target.value }))}
                    className={inputClass}
                    placeholder="Obrigatória para trocar senha"
                  />
                </Field>
                <Field label="Nova senha" icon={Lock}>
                  <input
                    type="password"
                    value={senha.nova}
                    onChange={(e) => setSenha((prev) => ({ ...prev, nova: e.target.value }))}
                    className={inputClass}
                    placeholder="Mínimo 6 caracteres"
                  />
                </Field>
              </div>
            </Section>
          )}
        </div>
      </div>
    </form>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="lojia-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1115] text-white">
          <Icon size={17} />
        </span>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, icon: Icon, wide, children }) {
  return (
    <label className={wide ? "block sm:col-span-2" : "block"}>
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        {children}
        <Icon size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-semibold capitalize text-slate-950">{value || "-"}</p>
    </div>
  );
}

function ProfileAvatar({ nome, foto, size = "md" }) {
  const dimension = size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <span className={`flex ${dimension} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#16A34A] text-white shadow-sm`}>
      {foto ? (
        <img src={foto} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-bold">{getInitials(nome)}</span>
      )}
    </span>
  );
}
