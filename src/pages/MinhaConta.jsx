import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Building2,
  CheckCircle2,
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
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16A36B] focus:ring-3 focus:ring-[#16A36B]/10 disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm";

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

export default function MinhaConta() {
  const { usuario, lojas, lojaAtual, setLojaAtualId, atualizarMinhaConta } = useAuth();
  const [dadosUsuario, setDadosUsuario] = useState(usuarioInicial);
  const [dadosLoja, setDadosLoja] = useState(lojaInicial);
  const [senha, setSenha] = useState({ atual: "", nova: "" });
  const [salvando, setSalvando] = useState(false);

  const papel = lojaAtual?.papel;
  const loja = lojaAtual?.loja;
  const podeEditarLoja = usuario?.superadmin || papel === "admin";

  const planoInfo = useMemo(() => {
    const assinatura = loja?.assinatura;
    if (!assinatura) return "Sem assinatura vinculada";
    const data = assinatura.venceEm ? new Date(assinatura.venceEm).toLocaleDateString("pt-BR") : "-";
    return `${assinatura.status || "ativa"} até ${data}`;
  }, [loja?.assinatura]);

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
            Gerencie seu acesso, dados da loja, plano e informações de contato.
          </p>
        </div>
        <button
          disabled={salvando}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#16A36B] px-4 text-sm font-semibold text-white transition hover:bg-[#11875A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
        </div>

        <aside className="space-y-5">
          <section className="lojia-surface p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#16A36B]/10 text-[#11875A]">
                <CheckCircle2 size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">Plano da loja</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{planoInfo}</p>
              </div>
            </div>
          </section>

          <section className="lojia-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserCog size={18} className="text-[#16A36B]" />
              <h2 className="text-sm font-semibold text-slate-950">Acesso atual</h2>
            </div>
            <div className="space-y-3 text-sm">
              <Info label="Perfil" value={papel || (usuario?.superadmin ? "superadmin" : "sem perfil")} />
              <Info label="Loja" value={loja?.nome || "-"} />
              <Info label="Identificador" value={loja?.slug || "-"} />
            </div>
          </section>

          {lojas.length > 1 && (
            <section className="lojia-surface p-5">
              <label>
                <span className={labelClass}>Trocar loja</span>
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
            </section>
          )}
        </aside>
      </div>
    </form>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="lojia-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#181F24] text-white">
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
      <p className="mt-0.5 truncate font-semibold capitalize text-slate-950">{value}</p>
    </div>
  );
}
