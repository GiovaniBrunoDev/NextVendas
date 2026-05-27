import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowRight, CalendarClock, Mail, Store, UserRound } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const inputClass = "lojia-input px-3 py-2.5 text-sm";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function AceitarConvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { autenticado, aceitarConvite } = useAuth();
  const [convite, setConvite] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get(`/auth/convites/${token}`);
        setConvite(data);
        setEmail(data.email || "");
      } catch (err) {
        toast.error(err.response?.data?.error || "Convite invalido.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [token]);

  if (autenticado) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await aceitarConvite({ token, nome, email, senha });
      toast.success("Loja criada. Bem-vindo!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao aceitar convite.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <main className="lojia-shell grid min-h-screen place-items-center font-bold text-[#181F24]">Carregando convite...</main>;
  }

  if (!convite) {
    return <main className="lojia-shell grid min-h-screen place-items-center font-bold text-[#181F24]">Convite indisponivel.</main>;
  }

  return (
    <main className="lojia-shell grid min-h-screen px-4 py-8 text-[#181F24] lg:grid-cols-[420px_1fr] lg:px-10">
      <aside className="lojia-gradient mb-5 rounded-lg border border-white/10 p-5 text-white shadow-2xl lg:mb-0 lg:self-center">
        <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.96] p-3 shadow-2xl">
          <img src="/lojia-logo.png" alt="Lojia" className="h-20 w-full scale-[1.35] object-contain" />
        </div>
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-[#CFF8E5]">
          <Store size={24} />
        </div>
        <p className="text-xs font-bold uppercase text-[#CFF8E5]">Convite de loja</p>
        <h1 className="mt-2 text-3xl font-black">{convite.nomeLoja}</h1>
        <div className="mt-5 space-y-3 text-sm text-white/[0.72]">
          <p className="flex items-center gap-2">
            <Mail size={16} /> {convite.email || "Email livre para cadastro"}
          </p>
          <p className="flex items-center gap-2">
            <CalendarClock size={16} /> Expira em {formatDate(convite.expiraEm)}
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center">
        <form onSubmit={enviar} className="lojia-card w-full max-w-lg p-6">
          <div className="mb-6">
            <p className="mb-1 text-xs font-bold uppercase text-[#11875A]">Criar acesso</p>
            <h2 className="text-2xl font-black text-[#181F24]">Finalize seu cadastro</h2>
            <p className="mt-1 text-sm text-[#66736D]">Este usuario sera vinculado a loja convidada.</p>
          </div>

          <label className="mb-3 block">
            <span className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-[#66736D]">
              <UserRound size={14} /> Nome
            </span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} required />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#66736D]">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-bold uppercase text-[#66736D]">Senha</span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputClass} required />
          </label>

          <button
            disabled={salvando}
            className="lojia-button-primary w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Criando loja..." : "Aceitar convite"}
            {!salvando && <ArrowRight size={16} />}
          </button>
        </form>
      </section>
    </main>
  );
}
