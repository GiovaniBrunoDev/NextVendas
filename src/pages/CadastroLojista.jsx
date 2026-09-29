import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Store,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-base text-[#0B1115] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#16A34A] focus:bg-white focus:ring-4 focus:ring-[#16A34A]/10 sm:text-sm lg:h-10";

const inicial = {
  nome: "",
  lojaNome: "",
  email: "",
  telefone: "",
  senha: "",
  confirmarSenha: "",
};

export default function CadastroLojista() {
  const { autenticado, cadastrarLojista } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(inicial);
  const [aceitouTermos, setAceitouTermos] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  if (autenticado) return <Navigate to="/" replace />;

  function setCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function validar() {
    if (!form.nome.trim()) {
      toast.error("Informe seu nome completo.");
      return false;
    }

    if (!form.lojaNome.trim()) {
      toast.error("Informe o nome da sua loja.");
      return false;
    }

    if (!form.email.trim()) {
      toast.error("Informe seu e-mail.");
      return false;
    }

    if (form.senha.length < 8) {
      toast.error("A senha precisa ter ao menos 8 caracteres.");
      return false;
    }

    if (form.senha !== form.confirmarSenha) {
      toast.error("As senhas não conferem.");
      return false;
    }

    if (!aceitouTermos) {
      toast.error("Aceite os termos para criar sua conta.");
      return false;
    }

    return true;
  }

  async function enviar(e) {
    e.preventDefault();
    if (!validar()) return;

    try {
      setSalvando(true);
      await cadastrarLojista({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        senha: form.senha,
        lojaNome: form.lojaNome,
        lojaEmail: form.email,
        lojaTelefone: form.telefone,
      });
      toast.success("Conta criada. Bem-vindo à Lojia.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Não foi possível criar sua conta.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] w-full overflow-x-hidden bg-[#FFFDF9] text-[#0B1115] lg:h-[100dvh] lg:overflow-hidden lg:grid-cols-[51%_49%]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden bg-[#E8F4FF] lg:block lg:rounded-r-[34px] lg:shadow-[18px_0_45px_rgba(11,17,21,0.08)]">
        <img
          src="/cadastro-showcase-reference.png"
          alt="Lojia, cadastro para loja de calçados"
          className="h-full min-h-[100dvh] w-full object-cover"
        />
      </section>

      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-7 sm:px-8 lg:px-10 lg:py-4">
        <form
          onSubmit={enviar}
          className="w-full max-w-[620px] rounded-2xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_18px_55px_rgba(11,17,21,0.07)] sm:px-9 sm:py-8 lg:max-w-[540px] lg:px-8 lg:py-5"
        >
          <Link to="/institucional" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg lg:h-8 lg:w-8">
              <img src="/lojia-icon.svg" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-xl font-bold text-[#0B1115] lg:text-lg">Lojia</span>
          </Link>

          <div className="mt-7 lg:mt-4">
            <h1 className="text-3xl font-semibold leading-tight text-[#0B1115] lg:text-[28px]">
              Criar conta
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-500 lg:text-[13px] lg:leading-5">
              Preencha seus dados para começar.
            </p>
          </div>

          <div className="mt-6 space-y-3.5 lg:mt-4 lg:space-y-2.5">
            <Campo label="Nome completo" icon={UserRound}>
              <input
                autoComplete="name"
                value={form.nome}
                onChange={(e) => setCampo("nome", e.target.value)}
                className={inputClass}
                placeholder="Digite seu nome completo"
                required
              />
            </Campo>

            <Campo label="Nome da loja" icon={Store}>
              <input
                value={form.lojaNome}
                onChange={(e) => setCampo("lojaNome", e.target.value)}
                className={inputClass}
                placeholder="Digite o nome da sua loja"
                required
              />
            </Campo>

            <Campo label="E-mail" icon={Mail}>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setCampo("email", e.target.value)}
                className={inputClass}
                placeholder="seu@email.com"
                required
              />
            </Campo>

            <Campo label="WhatsApp" icon={MessageCircle}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.telefone}
                onChange={(e) => setCampo("telefone", e.target.value)}
                className={inputClass}
                placeholder="(11) 99999-9999"
              />
            </Campo>

            <Campo label="Senha" icon={LockKeyhole}>
              <input
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                value={form.senha}
                onChange={(e) => setCampo("senha", e.target.value)}
                className={inputClass}
                placeholder="Mínimo de 8 caracteres"
                required
              />
              <BotaoSenha
                ativo={mostrarSenha}
                onClick={() => setMostrarSenha((valor) => !valor)}
                label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              />
            </Campo>

            <Campo label="Confirmar senha" icon={LockKeyhole}>
              <input
                type={mostrarConfirmacao ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirmarSenha}
                onChange={(e) => setCampo("confirmarSenha", e.target.value)}
                className={inputClass}
                placeholder="Digite novamente sua senha"
                required
              />
              <BotaoSenha
                ativo={mostrarConfirmacao}
                onClick={() => setMostrarConfirmacao((valor) => !valor)}
                label={mostrarConfirmacao ? "Ocultar confirmação" : "Mostrar confirmação"}
              />
            </Campo>
          </div>

          <label className="mt-4 inline-flex cursor-pointer select-none items-start gap-2.5 text-sm leading-5 text-slate-500 lg:mt-3 lg:text-xs">
            <input
              type="checkbox"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                aceitouTermos ? "border-[#16A34A] bg-[#16A34A] text-white" : "border-[#DDE5EE] bg-white text-transparent"
              }`}
            >
              <Check size={15} strokeWidth={3} />
            </span>
            <span>
              Concordo com os{" "}
              <Link to="/institucional" className="font-bold text-[#16A34A] transition hover:text-[#0B1115]">
                Termos de uso
              </Link>{" "}
              e{" "}
              <Link to="/institucional" className="font-bold text-[#16A34A] transition hover:text-[#0B1115]">
                Política de Privacidade
              </Link>
            </span>
          </label>

          <button
            disabled={salvando}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-[#16A34A] text-base font-semibold text-white shadow-[0_8px_20px_rgba(22,163,74,0.16)] transition hover:bg-[#138A40] disabled:cursor-not-allowed disabled:opacity-65 lg:mt-4 lg:h-11 lg:text-sm"
          >
            <UserPlus size={19} strokeWidth={2.1} />
            {salvando ? "Criando conta..." : "Criar conta"}
          </button>

          <div className="mt-4 border-t border-slate-100 pt-4 text-center text-sm text-slate-500 lg:mt-3 lg:pt-3 lg:text-xs">
            Já tem uma conta?{" "}
            <Link to="/login" className="font-bold text-[#16A34A] transition hover:text-[#0B1115]">
              Entrar
            </Link>
          </div>
        </form>

        <div className="mt-6 inline-flex items-center gap-3 text-[15px] text-[#7D8798] lg:absolute lg:bottom-4 lg:mt-0 lg:text-sm">
          <ShieldCheck size={18} strokeWidth={1.8} />
          Ambiente 100% seguro e certificado
        </div>
      </section>
    </main>
  );
}

function Campo({ label, icon: Icon, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700 lg:text-xs">
      {label}
      <span className="relative mt-1.5 block">
        <Icon
          size={17}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        {children}
      </span>
    </label>
  );
}

function BotaoSenha({ ativo, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7D8798] transition hover:bg-[#F3F6F8] hover:text-[#0B1115]"
      aria-label={label}
    >
      {ativo ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}
