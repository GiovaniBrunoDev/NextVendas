import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const inputClass =
  "h-[52px] w-full rounded-[9px] border border-[#DDE5EE] bg-white pl-11 pr-11 text-[15px] text-[#020C2C] outline-none transition placeholder:text-[#8A94A6] focus:border-[#16A36B] focus:ring-4 focus:ring-[#16A36B]/10 lg:h-[46px] lg:text-sm";

export default function Login() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailSalvo =
    typeof window !== "undefined" ? localStorage.getItem("lojia_login_email") || "" : "";
  const lembrarSalvo =
    typeof window !== "undefined" ? localStorage.getItem("lojia_login_lembrar") === "true" : true;

  const [email, setEmail] = useState(emailSalvo);
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(lembrarSalvo);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const suporteHref = `mailto:suporte@lojia.com.br?subject=${encodeURIComponent(
    "Recuperar senha da Lojia"
  )}&body=${encodeURIComponent(
    `Olá, preciso recuperar o acesso da minha conta Lojia.${email ? `\n\nMeu e-mail: ${email}` : ""}`
  )}`;

  if (autenticado) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  async function enviar(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      await login(email, senha);

      if (lembrar) {
        localStorage.setItem("lojia_login_lembrar", "true");
        localStorage.setItem("lojia_login_email", email);
      } else {
        localStorage.removeItem("lojia_login_lembrar");
        localStorage.removeItem("lojia_login_email");
      }

      toast.success("Login realizado.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] w-full overflow-x-hidden bg-[#FFFDF9] text-[#020C2C] lg:h-[100dvh] lg:overflow-hidden lg:grid-cols-[51%_49%]">
      <section className="relative hidden min-h-[100dvh] overflow-hidden bg-[#E8F4FF] lg:block lg:rounded-r-[34px] lg:shadow-[18px_0_45px_rgba(2,12,44,0.08)]">
        <img
          src="/login-showcase-reference.png"
          alt="Lojia, sistema para lojas de calçados"
          className="h-full min-h-[100dvh] w-full object-cover"
        />
      </section>

      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-7 sm:px-8 lg:px-10 lg:py-4">
        <form
          onSubmit={enviar}
          className="w-full max-w-[632px] rounded-[24px] border border-[#EEF2F6] bg-white px-6 py-8 shadow-[0_28px_90px_rgba(2,12,44,0.09)] sm:px-12 sm:py-10 lg:max-w-[580px] lg:px-10 lg:py-6 xl:px-12"
        >
          <Link to="/institucional" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] lg:h-9 lg:w-9">
              <img src="/lojia-icon.svg" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-[22px] font-black tracking-[-0.02em] text-[#020C2C] lg:text-xl">Lojia</span>
          </Link>

          <div className="mt-10 lg:mt-5">
            <h1 className="text-[38px] font-black leading-none tracking-[-0.03em] text-[#020C2C] sm:text-[42px] lg:text-[34px]">
              Entrar
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-[#7D8798] lg:text-sm">Acesse sua conta para continuar.</p>
          </div>

          <div className="mt-8 space-y-6 lg:mt-5 lg:space-y-3.5">
            <label className="block text-[15px] font-bold text-[#020C2C] lg:text-sm">
              E-mail
              <span className="relative mt-2.5 block">
                <Mail
                  size={20}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7D8798]"
                />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="seu@email.com"
                  required
                />
              </span>
            </label>

            <label className="block text-[15px] font-bold text-[#020C2C] lg:text-sm">
              Senha
              <span className="relative mt-2.5 block">
                <LockKeyhole
                  size={20}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7D8798]"
                />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#7D8798] transition hover:bg-[#F3F6F8] hover:text-[#020C2C]"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>
          </div>

          <div className="mt-[18px] flex flex-col gap-4 text-[15px] sm:flex-row sm:items-center sm:justify-between lg:gap-3 lg:text-sm">
            <label className="inline-flex cursor-pointer select-none items-center gap-3 text-[#7D8798]">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-[4px] border transition ${
                  lembrar ? "border-[#16A36B] bg-[#16A36B] text-white" : "border-[#DDE5EE] bg-white text-transparent"
                }`}
              >
                <Check size={15} strokeWidth={3} />
              </span>
              Lembrar de mim
            </label>

            <a
              href={suporteHref}
              className="text-left font-bold text-[#16A36B] transition hover:text-[#020C2C]"
            >
              Esqueci minha senha
            </a>
          </div>

          <button
            disabled={carregando}
            className="mt-7 inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-[9px] bg-[#16A36B] text-lg font-black text-white shadow-[0_18px_36px_rgba(22,163,107,0.25)] transition hover:bg-[#020C2C] disabled:cursor-not-allowed disabled:opacity-65 lg:mt-5 lg:h-[50px] lg:text-base"
          >
            <LockKeyhole size={19} strokeWidth={2.1} />
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <div className="mt-8 flex items-center gap-6 text-sm font-semibold text-[#8A94A6] lg:mt-5 lg:text-xs">
            <span className="h-px flex-1 bg-[#E4E9F0]" />
            ou
            <span className="h-px flex-1 bg-[#E4E9F0]" />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-[#7D8798] lg:mt-5 lg:text-sm">
            <span>Ainda não tem uma conta?</span>
            <Link to="/cadastro" className="font-bold text-[#16A36B] transition hover:text-[#020C2C]">
              Criar conta
            </Link>
            <span className="hidden text-[#AAB2C0] sm:inline">•</span>
            <span>Precisa de ajuda?</span>
            <a href="/institucional#contato" className="font-bold text-[#16A36B] transition hover:text-[#020C2C]">
              Fale conosco
            </a>
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
