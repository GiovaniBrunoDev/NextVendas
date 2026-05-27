import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowRight, Eye, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const inputClass =
  "mt-2 h-10 w-full rounded-[4px] border border-[#A9B2AE] bg-white px-3 text-sm text-[#181F24] outline-none transition focus:border-[#16A36B] focus:ring-2 focus:ring-[#16A36B]/10";

export default function Login() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  if (autenticado) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  async function enviar(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      await login(email, senha);
      toast.success("Login realizado.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#DFF1FA] text-[#181F24]">
      <div className="absolute bottom-[-30rem] right-[-28rem] h-[50rem] w-[50rem] rounded-full border border-[#181F24] bg-[#5AB8E8] sm:right-[-10rem] sm:h-[58rem] sm:w-[58rem]" />
      <div className="absolute bottom-[-18rem] left-[32%] hidden h-[34rem] w-[28rem] rotate-[-14deg] rounded-[46%] border border-[#181F24] bg-white lg:block" />
      <div className="absolute bottom-[-20rem] left-[43%] hidden h-[30rem] w-[28rem] rotate-[8deg] rounded-[46%] border border-[#181F24] bg-white lg:block" />

      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <Link
          to="/institucional"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#181F24]/10 bg-white/70 px-4 text-sm font-semibold text-[#181F24] shadow-sm backdrop-blur transition hover:bg-white"
        >
          Conheça a Lojia
        </Link>
      </div>

      <section className="relative z-10 grid min-h-[100dvh] w-full min-w-0 items-center gap-10 px-3 py-20 sm:px-4 sm:py-20 lg:grid-cols-[488px_minmax(360px,1fr)] lg:gap-12 lg:px-8 xl:px-[12vw]">
        <form
          onSubmit={enviar}
          className="mx-auto w-full max-w-[488px] rounded-[18px] bg-white px-5 py-7 shadow-[0_18px_34px_rgba(24,31,36,0.10)] sm:rounded-[22px] sm:px-14 sm:py-14"
        >
          <div className="mb-9 flex flex-col items-start justify-between gap-5 sm:mb-12 sm:flex-row sm:gap-6">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[14px] border border-[#C9D1CD] bg-white sm:h-[60px] sm:w-[60px]">
              <img src="/lojia-icon.svg" alt="Lojia" className="h-full w-full object-cover" />
            </div>
            <div className="sm:text-right">
              <h1 className="text-[30px] font-medium leading-none text-[#181F24] sm:text-[34px]">Login</h1>
              <p className="mt-3 text-sm text-[#181F24]">
                Sem conta?{" "}
                <Link to="/cadastro" className="font-semibold text-[#16A36B] hover:underline">
                  Criar uma agora
                </Link>
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block text-sm text-[#555F5A]">
              E-mail
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} pr-9`}
                  required
                />
                <Mail size={15} className="absolute right-3 top-1/2 mt-1 text-[#7C8782]" />
              </div>
            </label>

            <label className="block text-sm text-[#555F5A]">
              Senha
              <div className="relative">
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`${inputClass} pr-9`}
                  required
                />
                <Eye size={15} className="absolute right-3 top-1/2 mt-1 text-[#181F24]" />
              </div>
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <button type="button" className="text-left text-sm font-semibold text-[#16A36B] hover:underline">
              Esqueci a senha
            </button>

            <button
              disabled={carregando}
              className="inline-flex w-full min-w-[128px] items-center justify-center gap-2 rounded-[4px] bg-[#16A36B] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11875A] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {carregando ? "Entrando..." : "Entrar"}
              {!carregando && <ArrowRight size={15} />}
            </button>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 text-xs text-[#181F24] sm:mt-14">
            <span>Idioma: Português</span>
            <span>Termos de uso</span>
          </div>
        </form>

        <aside className="hidden text-center lg:block">
          <h2 className="text-[50px] font-semibold leading-none text-[#181F24]">Sua loja no controle.</h2>
          <p className="mx-auto mt-6 max-w-sm text-base leading-6 text-[#181F24]">
            Organize vendas, pedidos e estoque em uma rotina mais simples.
          </p>

          <div className="relative mx-auto mt-10 w-full max-w-[620px]">
            <img
              src="/login-stock-hero.png"
              alt="Mulher organizando estoque de calçados com computador exibindo sistema"
              className="relative z-10 h-auto w-full rounded-[28px] border border-white/70 object-cover shadow-[0_24px_50px_rgba(24,31,36,0.16)]"
            />
            <div className="absolute -bottom-5 left-8 right-8 h-12 rounded-full bg-[#181F24]/10 blur-2xl" />
          </div>
        </aside>
      </section>
    </main>
  );
}
