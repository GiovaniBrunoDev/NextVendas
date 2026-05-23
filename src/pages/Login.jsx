import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck, Store } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const inputClass = "lojia-input px-3 py-2.5 text-sm";

export default function Login() {
  const { autenticado, login, bootstrapSuperadmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modoBootstrap, setModoBootstrap] = useState(false);
  const [nome, setNome] = useState("Super Admin");
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
      if (modoBootstrap) {
        await bootstrapSuperadmin({ nome, email, senha });
        toast.success("Superadmin criado.");
      } else {
        await login(email, senha);
        toast.success("Login realizado.");
      }
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Nao foi possivel entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="lojia-shell grid min-h-screen text-[#181F24] lg:grid-cols-[1fr_520px]">
      <section className="lojia-gradient hidden flex-col justify-between p-10 text-white lg:flex">
        <div className="inline-flex w-max items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase text-[#CFF8E5]">
          <Store size={14} /> Lojia Multi-lojas
        </div>

        <div className="max-w-xl">
          <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.96] p-3 shadow-2xl">
            <img src="/lojia-brand.png" alt="Lojia" className="h-28 w-full scale-[1.35] object-contain" />
          </div>
          <h1 className="text-4xl font-black leading-tight">PDV, estoque e pedidos em uma rotina simples.</h1>
          <p className="mt-4 text-base leading-7 text-white/[0.72]">
            Acesse sua loja, acompanhe assinatura, venda, estoque, pedidos e clientes com dados isolados por operacao.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/[0.72]">
            {["Dados separados por loja", "Perfis para equipe", "Convites para novas unidades"].map((item) => (
              <p key={item} className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#6FE1A7]" /> {item}
              </p>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/[0.42]">Pratico. Completo. Feito para o dia a dia da sua loja.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-8">
        <form onSubmit={enviar} className="lojia-card w-full max-w-md p-6">
          <div className="mb-6">
            <div className="mb-5 overflow-hidden rounded-lg border border-[#E5DED2] bg-white p-2">
              <img src="/lojia-brand.png" alt="Lojia" className="h-16 w-full scale-[1.35] object-contain" />
            </div>
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#16A36B]/10 text-[#11875A]">
              <ShieldCheck size={24} />
            </div>
            <p className="mb-1 text-xs font-bold uppercase text-[#11875A]">
              {modoBootstrap ? "Primeiro acesso" : "Acesso seguro"}
            </p>
            <h2 className="text-2xl font-black text-[#181F24]">
              {modoBootstrap ? "Criar superadmin" : "Entrar na Lojia"}
            </h2>
            <p className="mt-1 text-sm text-[#66736D]">
              {modoBootstrap
                ? "Crie o primeiro usuario para assumir a Loja Principal."
                : "Informe seu email e senha para abrir sua loja."}
            </p>
          </div>

          {modoBootstrap && (
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-bold uppercase text-[#66736D]">Nome</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
            </label>
          )}

          <label className="mb-3 block">
            <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-[#66736D]">
              <Mail size={14} /> Email
            </span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-[#66736D]">
              <Lock size={14} /> Senha
            </span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputClass} required />
          </label>

          {modoBootstrap && (
            <div className="mb-4 rounded-md border border-[#F4A62A]/30 bg-[#F4A62A]/[0.15] px-3 py-2 text-xs leading-5 text-[#8A5400]">
              Use esta opcao somente quando ainda nao existir superadmin cadastrado.
            </div>
          )}

          <button
            disabled={carregando}
            className="lojia-button-primary w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Processando..." : modoBootstrap ? "Criar e entrar" : "Entrar"}
            {!carregando && <ArrowRight size={16} />}
          </button>

          <button
            type="button"
            onClick={() => setModoBootstrap((valor) => !valor)}
            className="mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold text-[#66736D] transition hover:bg-[#16A36B]/10 hover:text-[#181F24]"
          >
            {modoBootstrap ? "Voltar para login" : "Primeiro acesso? criar superadmin"}
          </button>
        </form>
      </section>
    </main>
  );
}
