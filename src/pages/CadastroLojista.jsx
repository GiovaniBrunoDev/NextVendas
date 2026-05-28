import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Store,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-[#111827] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#16A36B] focus:bg-white focus:ring-4 focus:ring-[#16A36B]/10";

const etapas = [
  {
    key: "usuario",
    titulo: "Seu acesso",
    descricao: "Informe seus dados para criar o acesso principal da conta.",
  },
  {
    key: "loja",
    titulo: "Sua loja",
    descricao: "Defina o nome da loja que será exibido no sistema.",
  },
  {
    key: "senha",
    titulo: "Proteção",
    descricao: "Crie uma senha segura para acessar sua conta.",
  },
];

const inicial = {
  nome: "",
  email: "",
  lojaNome: "",
  senha: "",
  confirmarSenha: "",
};

export default function CadastroLojista() {
  const { autenticado, cadastrarLojista } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(inicial);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [salvando, setSalvando] = useState(false);

  const etapa = etapas[etapaAtual];
  const progresso = ((etapaAtual + 1) / etapas.length) * 100;
  const resumoPronto = useMemo(
    () => form.nome.trim() && form.email.trim() && form.lojaNome.trim() && form.senha,
    [form]
  );

  if (autenticado) return <Navigate to="/" replace />;

  function setCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function validarEtapa() {
    if (etapa.key === "usuario") {
      if (!form.nome.trim() || !form.email.trim()) {
        toast.error("Informe seu nome e e-mail.");
        return false;
      }
    }

    if (etapa.key === "loja" && !form.lojaNome.trim()) {
      toast.error("Informe o nome da sua loja.");
      return false;
    }

    if (etapa.key === "senha") {
      if (form.senha.length < 6) {
        toast.error("A senha precisa ter ao menos 6 caracteres.");
        return false;
      }

      if (form.senha !== form.confirmarSenha) {
        toast.error("As senhas não conferem.");
        return false;
      }
    }

    return true;
  }

  function avancar() {
    if (!validarEtapa()) return;
    setEtapaAtual((valor) => Math.min(valor + 1, etapas.length - 1));
  }

  function voltar() {
    setEtapaAtual((valor) => Math.max(valor - 1, 0));
  }

  async function enviar(e) {
    e.preventDefault();
    if (!validarEtapa() || !resumoPronto) return;

    try {
      setSalvando(true);
      await cadastrarLojista({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        lojaNome: form.lojaNome,
        lojaEmail: form.email,
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
  <main className="min-h-[100dvh] bg-[#F6F7F8] text-[#020C2C]">
    <section className="mx-auto grid min-h-[100dvh] w-full max-w-6xl items-center gap-10 px-4 py-6 lg:grid-cols-[0.9fr_1fr] lg:px-8">
      
      <aside className="hidden lg:block">
        <Link
          to="/login"
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#020C2C]"
        >
          <ArrowLeft size={16} />
          Voltar para login
        </Link>

        <div className="max-w-md">
          <img
            src="/lojia-logo.png"
            alt="Lojia"
            className="mb-10 h-16 w-44 object-contain"
          />

          <span className="inline-flex rounded-full border border-[#16A36B]/20 bg-[#16A36B]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#020C2C]">
            Cadastro rápido
          </span>

          <h1 className="mt-5 text-5xl font-semibold leading-[1.04] tracking-tight text-[#020C2C]">
            Comece sua gestão de forma simples.
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-600">
            Crie sua conta em poucos passos e organize vendas, produtos,
            pedidos e estoque em um sistema pensado para lojas de calçados.
          </p>

          <div className="mt-8 grid gap-3">
            {["Conta criada na hora", "Acesso admin automático", "Pronto para cadastrar produtos"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <CheckCircle2 size={18} className="text-[#16A36B]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <form
        onSubmit={enviar}
        className="mx-auto w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
      >
        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pt-8">
          
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#16A36B]">
                Nova conta
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#020C2C]">
                Configure sua loja
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Passo {etapaAtual + 1} de {etapas.length}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#020C2C]">
              {etapa.key === "usuario" && <UserRound size={21} />}
              {etapa.key === "loja" && <Store size={21} />}
              {etapa.key === "senha" && <Lock size={21} />}
            </div>
          </div>

          <div className="mb-8 flex gap-2">
            {etapas.map((item, index) => (
              <div
                key={item.key}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  index <= etapaAtual ? "bg-[#16A36B]" : "bg-slate-100"
                }`}
              />
            ))}
          </div>

          <div className="mb-7">
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
              {etapa.titulo}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {etapa.descricao}
            </p>
          </div>

          {etapa.key === "usuario" && (
            <div className="space-y-4">
              <Campo label="Seu nome" icon={UserRound}>
                <input
                  autoFocus
                  value={form.nome}
                  onChange={(e) => setCampo("nome", e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="Ex: Giovani Bruno"
                  required
                />
              </Campo>

              <Campo label="E-mail" icon={Mail}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setCampo("email", e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="voce@sualoja.com"
                  required
                />
              </Campo>
            </div>
          )}

          {etapa.key === "loja" && (
            <div className="space-y-4">
              <Campo label="Nome da loja" icon={Store}>
                <input
                  autoFocus
                  value={form.lojaNome}
                  onChange={(e) => setCampo("lojaNome", e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="Ex: Calçados Silva"
                  required
                />
              </Campo>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Você poderá completar telefone, endereço e outros dados depois
                em Minha conta.
              </div>
            </div>
          )}

          {etapa.key === "senha" && (
            <div className="space-y-4">
              <Campo label="Senha" icon={Lock}>
                <input
                  autoFocus
                  type="password"
                  value={form.senha}
                  onChange={(e) => setCampo("senha", e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </Campo>

              <Campo label="Confirmar senha" icon={Lock}>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(e) => setCampo("confirmarSenha", e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="Repita a senha"
                  required
                />
              </Campo>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Resumo
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {form.nome || "Seu nome"}
                </p>

                <p className="text-sm text-slate-500">
                  {form.email || "seu@email.com"}
                </p>

                <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {form.lojaNome || "Nome da loja"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {etapaAtual === 0 ? (
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Já tenho conta
            </Link>
          ) : (
            <button
              type="button"
              onClick={voltar}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          )}

          {etapaAtual < etapas.length - 1 ? (
            <button
              type="button"
              onClick={avancar}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#020C2C] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(24,31,36,0.14)] transition hover:bg-[#081743]"
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              disabled={salvando}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#16A36B] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(22,163,107,0.20)] transition hover:bg-[#020C2C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Criando conta..." : "Criar minha loja"}
              {!salvando && <ArrowRight size={16} />}
            </button>
          )}
          
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
  Seus dados são protegidos e usados apenas para criar sua conta.
</p>    
        
      </form>
    </section>
  </main>
);
}

function Campo({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <span className="relative block">
        {children}
        <Icon
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </span>
    </label>
  );
}
