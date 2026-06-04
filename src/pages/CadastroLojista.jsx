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
  "h-10 w-full rounded-[9px] border border-[#DDE5EE] bg-white pl-10 pr-10 text-sm text-[#0B1115] outline-none transition placeholder:text-[#8A94A6] focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 lg:h-9";

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
          className="w-full max-w-[632px] rounded-[24px] border border-[#EEF2F6] bg-white px-6 py-8 shadow-[0_28px_90px_rgba(11,17,21,0.09)] sm:px-12 sm:py-10 lg:max-w-[540px] lg:px-9 lg:py-5 xl:px-10"
        >
          <Link to="/institucional" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] lg:h-8 lg:w-8">
              <img src="/lojia-icon.svg" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-[22px] font-black tracking-[-0.02em] text-[#0B1115] lg:text-lg">Lojia</span>
          </Link>

          <div className="mt-8 lg:mt-4">
            <h1 className="text-[38px] font-black leading-none tracking-[-0.03em] text-[#0B1115] sm:text-[42px] lg:text-[30px]">
              Criar conta
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-[#7D8798] lg:text-[13px] lg:leading-5">
              Cadastre-se para começar a usar a Lojia.
            </p>
          </div>

          <div className="mt-7 space-y-3.5 lg:mt-4 lg:space-y-2">
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

          <label className="mt-3 inline-flex cursor-pointer select-none items-start gap-3 text-sm leading-6 text-[#7D8798] lg:text-xs lg:leading-5">
            <input
              type="checkbox"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border transition ${
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
            className="mt-4 inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[9px] bg-[#16A34A] text-base font-black text-white shadow-[0_18px_36px_rgba(22,163,74,0.25)] transition hover:bg-[#0B1115] disabled:cursor-not-allowed disabled:opacity-65 lg:h-11"
          >
            <UserPlus size={19} strokeWidth={2.1} />
            {salvando ? "Criando conta..." : "Criar conta"}
          </button>

          <div className="mt-3 text-center text-sm text-[#7D8798] lg:text-xs">
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
    <label className="block text-sm font-bold text-[#0B1115] lg:text-xs">
      {label}
      <span className="relative mt-1.5 block">
        <Icon
          size={17}
          strokeWidth={1.8}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7D8798]"
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
