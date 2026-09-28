import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Image,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  ReceiptText,
  Phone,
  Plus,
  Power,
  Save,
  Settings,
  ShieldCheck,
  Store,
  Truck,
  UserCog,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  carregarLojaConfiguracoes,
  lojaConfiguracoesPadrao,
  salvarLojaConfiguracoes,
} from "../hooks/useLojaConfiguracoes";

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
  const [configuracoes, setConfiguracoes] = useState(lojaConfiguracoesPadrao);
  const [senha, setSenha] = useState({ atual: "", nova: "" });
  const [salvando, setSalvando] = useState(false);

  const papel = lojaAtual?.papel;
  const loja = lojaAtual?.loja;
  const assinatura = loja?.assinatura;
  const plano = assinatura?.plano;
  const assinaturaAtiva = Boolean(loja?.assinaturaAtiva);
  const podeEditarLoja = usuario?.superadmin || papel === "admin";
  const acessoRestritoVendas = Boolean(lojaAtual?.vendasPropriasApenas);
  const papelExibido = acessoRestritoVendas
    ? "Gerente de vendas"
    : papel || (usuario?.superadmin ? "superadmin" : "sem perfil");
  const fotoPerfil = usuario?.fotoUrl || usuario?.avatarUrl || usuario?.imagemUrl;
  const lojaConfigId = loja?.id || "padrao";

  const abas = useMemo(
    () => {
      if (acessoRestritoVendas) {
        return [
          { key: "perfil", label: "Meu perfil", icon: UserRound },
          { key: "seguranca", label: "Segurança", icon: Lock },
        ];
      }

      const itens = [
        { key: "perfil", label: "Perfil", icon: UserRound },
        { key: "loja", label: "Loja", icon: Store },
        { key: "plano", label: "Plano", icon: CreditCard },
        { key: "configuracoes", label: "Configurações", icon: Settings },
        { key: "seguranca", label: "Segurança", icon: Lock },
      ];

      if (podeEditarLoja) itens.splice(2, 0, { key: "equipe", label: "Equipe", icon: UsersRound });
      return itens;
    },
    [acessoRestritoVendas, podeEditarLoja]
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

  useEffect(() => {
    setConfiguracoes(carregarLojaConfiguracoes(lojaConfigId));
  }, [lojaConfigId]);

  function setUsuarioCampo(campo, valor) {
    setDadosUsuario((prev) => ({ ...prev, [campo]: valor }));
  }

  function setLojaCampo(campo, valor) {
    setDadosLoja((prev) => ({ ...prev, [campo]: valor }));
  }

  function setConfiguracaoCampo(campo, valor) {
    setConfiguracoes((prev) => ({ ...prev, [campo]: valor }));
  }

  function salvarConfiguracoes() {
    try {
      salvarLojaConfiguracoes(lojaConfigId, configuracoes);
      toast.success("Configurações da loja salvas.");
    } catch {
      toast.error("Não foi possível salvar as configurações.");
    }
  }

  async function salvar(e) {
    e.preventDefault();

    if (abaAtiva === "configuracoes") {
      salvarConfiguracoes();
      return;
    }

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
            {acessoRestritoVendas
              ? "Atualize seus dados pessoais e a segurança do seu acesso."
              : "Organize seus dados, loja, plano e segurança em um só lugar."}
          </p>
        </div>
        {!['plano', 'configuracoes', 'equipe'].includes(abaAtiva) && (
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
                  {papelExibido}
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
                  <Info label="Perfil" value={papelExibido} />
                  <Info label="Loja" value={loja?.nome || "-"} />
                  <Info
                    label={acessoRestritoVendas ? "Visibilidade" : "Identificador"}
                    value={acessoRestritoVendas ? "Somente minhas vendas" : loja?.slug || "-"}
                  />
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

          {abaAtiva === "equipe" && podeEditarLoja && (
            <EquipeLoja lojaId={loja?.id} usuarioAtualId={usuario?.id} />
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

          {abaAtiva === "configuracoes" && (
            <div className="space-y-5">
              <Section title="Operação da loja" icon={Settings}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Taxa de entrega padrão" icon={Truck}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={configuracoes.taxaEntregaPadrao}
                      onChange={(e) => setConfiguracaoCampo("taxaEntregaPadrao", e.target.value)}
                      className={inputClass}
                      placeholder="0,00"
                    />
                  </Field>
                  <Field label="Alerta de estoque" icon={Store}>
                    <input
                      type="number"
                      min="0"
                      value={configuracoes.alertaEstoque}
                      onChange={(e) => setConfiguracaoCampo("alertaEstoque", e.target.value)}
                      className={inputClass}
                      placeholder="2"
                    />
                  </Field>
                  <Field label="Mensagem rápida do WhatsApp" icon={MessageCircle} wide>
                    <textarea
                      value={configuracoes.mensagemWhatsApp}
                      onChange={(e) => setConfiguracaoCampo("mensagemWhatsApp", e.target.value)}
                      className="min-h-[104px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 pr-9 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16A34A] focus:ring-3 focus:ring-[#16A34A]/10 sm:text-sm"
                      placeholder="Mensagem padrão para atendimento"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Recibo e impressão" icon={ReceiptText}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Logo do recibo" icon={Image}>
                    <input
                      value={configuracoes.logoUrl}
                      onChange={(e) => setConfiguracaoCampo("logoUrl", e.target.value)}
                      className={inputClass}
                      placeholder="Link da imagem"
                    />
                  </Field>
                  <Field label="Rodapé do recibo" icon={ReceiptText}>
                    <input
                      value={configuracoes.rodapeRecibo}
                      onChange={(e) => setConfiguracaoCampo("rodapeRecibo", e.target.value)}
                      className={inputClass}
                      placeholder="Mensagem final"
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ToggleRow
                    titulo="Mostrar logo no recibo"
                    descricao="Usa a logo informada quando houver imagem válida."
                    checked={configuracoes.mostrarLogoRecibo}
                    onChange={(checked) => setConfiguracaoCampo("mostrarLogoRecibo", checked)}
                  />
                  <ToggleRow
                    titulo="Recibo mais compacto"
                    descricao="Reduz espaçamentos para impressão em bobina ou papel menor."
                    checked={configuracoes.reciboCompacto}
                    onChange={(checked) => setConfiguracaoCampo("reciboCompacto", checked)}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Essas preferências ficam salvas para esta loja neste dispositivo.
                  </p>
                  <button
                    type="button"
                    onClick={salvarConfiguracoes}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-[#15803D]"
                  >
                    <Save size={16} />
                    Salvar configurações
                  </button>
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

function EquipeLoja({ lojaId, usuarioAtualId }) {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [alterandoId, setAlterandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  async function carregarEquipe() {
    try {
      setCarregando(true);
      const { data } = await api.get("/equipe");
      setMembros(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível carregar a equipe.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (lojaId) carregarEquipe();
  }, [lojaId]);

  async function atualizarMembro(membro, mudanca) {
    try {
      setAlterandoId(membro.id);
      const { data } = await api.put(`/equipe/${membro.id}`, mudanca);
      setMembros((atuais) => atuais.map((item) => (item.id === data.id ? data : item)));
      toast.success(mudanca.ativo === false ? "Acesso pausado." : "Acesso atualizado.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível atualizar o acesso.");
    } finally {
      setAlterandoId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="lojia-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1115] text-white">
                <UsersRound size={17} />
              </span>
              <h2 className="text-base font-semibold text-slate-950">Equipe da loja</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Crie acessos individuais e escolha o que cada pessoa pode fazer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-[#15803D]"
          >
            <UserPlus size={17} />
            Adicionar usuária
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <PerfilResumo
            titulo="Vendedor"
            descricao="Vendas, pedidos, clientes e caixa. Sem alterações de estoque ou administração."
          />
          <PerfilResumo
            titulo="Gerente"
            descricao="Operação completa, incluindo produtos e estoque. Sem acesso à equipe e ao plano."
          />
        </div>
      </section>

      <section className="lojia-surface overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-950">Pessoas com acesso</p>
          <p className="mt-1 text-xs text-slate-500">{membros.length} {membros.length === 1 ? "usuário" : "usuários"} nesta loja</p>
        </div>

        {carregando ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Carregando equipe...</div>
        ) : membros.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <UsersRound className="mx-auto text-slate-300" size={28} />
            <p className="mt-3 text-sm font-semibold text-slate-800">Nenhum acesso encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {membros.map((membro) => {
              const proprioAcesso = membro.usuario.id === Number(usuarioAtualId);
              const protegido = proprioAcesso || membro.papel === "admin";
              const acessoAtivo = membro.ativo && membro.usuario.ativo;

              return (
                <div key={membro.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ProfileAvatar nome={membro.usuario.nome} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-950">{membro.usuario.nome}</p>
                        {proprioAcesso && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Você</span>
                        )}
                        {!acessoAtivo && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Pausado</span>
                        )}
                        {membro.vendasPropriasApenas && (
                          <span className="rounded-full bg-[#16A34A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#15803D]">Somente próprias vendas</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{membro.usuario.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {membro.papel === "admin" ? (
                      <span className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                        Administrador
                      </span>
                    ) : (
                      <select
                        value={membro.papel}
                        disabled={alterandoId === membro.id || protegido}
                        onChange={(event) => atualizarMembro(membro, { papel: event.target.value })}
                        className="h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#16A34A] disabled:cursor-not-allowed disabled:bg-slate-50"
                      >
                        <option value="vendedor">Vendedor</option>
                        <option value="gerente">Gerente</option>
                      </select>
                    )}

                    {!protegido && (
                      <button
                        type="button"
                        disabled={alterandoId === membro.id}
                        onClick={() => atualizarMembro(membro, { ativo: !membro.ativo })}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 ${
                          acessoAtivo
                            ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                            : "border-[#16A34A]/25 bg-[#16A34A]/5 text-[#15803D] hover:bg-[#16A34A]/10"
                        }`}
                      >
                        <Power size={15} />
                        {acessoAtivo ? "Pausar" : "Reativar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modalAberto && (
        <NovoAcessoModal
          onClose={() => setModalAberto(false)}
          onCreated={(membro) => setMembros((atuais) => [...atuais, membro])}
        />
      )}
    </div>
  );
}

function PerfilResumo({ titulo, descricao }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
      <p className="text-sm font-semibold text-slate-900">{titulo}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{descricao}</p>
    </div>
  );
}

function gerarSenhaInicial() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const valores = new Uint32Array(10);
  window.crypto.getRandomValues(valores);
  return Array.from(valores, (valor) => caracteres[valor % caracteres.length]).join("");
}

function NovoAcessoModal({ onClose, onCreated }) {
  const [dados, setDados] = useState({ nome: "", email: "", telefone: "", senha: gerarSenhaInicial(), papel: "vendedor", vendasPropriasApenas: false });
  const [salvando, setSalvando] = useState(false);
  const [credencial, setCredencial] = useState(null);
  const valido = dados.nome.trim() && /^\S+@\S+\.\S+$/.test(dados.email.trim()) && dados.senha.length >= 6;

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function cadastrar(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!valido || salvando) return;

    try {
      setSalvando(true);
      const { data } = await api.post("/equipe", dados);
      onCreated(data.membro);
      setCredencial({
        nome: data.membro.usuario.nome,
        email: data.membro.usuario.email,
        senha: data.usuarioExistente ? null : dados.senha,
        usuarioExistente: data.usuarioExistente,
      });
      toast.success(data.mensagem || "Acesso criado com sucesso.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Não foi possível criar o acesso.");
    } finally {
      setSalvando(false);
    }
  }

  async function copiarAcesso() {
    const texto = credencial.usuarioExistente
      ? `Acesso à loja Lojia\nE-mail: ${credencial.email}\nUse a senha que você já possui.`
      : `Acesso à loja Lojia\nE-mail: ${credencial.email}\nSenha inicial: ${credencial.senha}`;
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Dados de acesso copiados.");
    } catch {
      toast.error("Não foi possível copiar os dados.");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#020C2C]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={cadastrar}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{credencial ? "Acesso criado" : "Adicionar usuária"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {credencial ? "Compartilhe estes dados de forma segura." : "Crie um acesso separado para trabalhar na sua loja."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        {credencial ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-[#16A34A]/20 bg-[#16A34A]/5 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#16A34A] text-white">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <p className="font-semibold text-slate-950">{credencial.nome}</p>
                  <p className="text-sm text-slate-500">já pode acessar a loja</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 rounded-lg bg-white p-4">
                <Info label="E-mail" value={credencial.email} />
                <Info
                  label={credencial.usuarioExistente ? "Senha" : "Senha inicial"}
                  value={credencial.usuarioExistente ? "A senha que ela já utiliza" : credencial.senha}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Concluir
              </button>
              <button type="button" onClick={copiarAcesso} className="h-11 rounded-lg bg-[#16A34A] px-4 text-sm font-semibold text-white hover:bg-[#15803D]">
                Copiar dados de acesso
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className={labelClass}>Nome</span>
                <input value={dados.nome} onChange={(e) => alterar("nome", e.target.value)} className={inputClass} autoFocus required />
              </label>
              <label>
                <span className={labelClass}>E-mail</span>
                <input type="email" value={dados.email} onChange={(e) => alterar("email", e.target.value)} className={inputClass} required />
              </label>
              <label>
                <span className={labelClass}>Telefone <span className="normal-case text-slate-400">(opcional)</span></span>
                <input value={dados.telefone} onChange={(e) => alterar("telefone", e.target.value)} className={inputClass} placeholder="(00) 00000-0000" />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>Senha inicial</span>
                <div className="flex gap-2">
                  <input value={dados.senha} onChange={(e) => alterar("senha", e.target.value)} className={inputClass} minLength={6} required />
                  <button type="button" onClick={() => alterar("senha", gerarSenhaInicial())} className="shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Gerar
                  </button>
                </div>
              </label>
            </div>

            <div>
              <p className={labelClass}>Nível de acesso</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <PerfilOption
                  ativo={dados.papel === "vendedor"}
                  titulo="Vendedor"
                  descricao="Vendas, pedidos, clientes e caixa."
                  onClick={() => alterar("papel", "vendedor")}
                />
                <PerfilOption
                  ativo={dados.papel === "gerente"}
                  titulo="Gerente"
                  descricao="Também gerencia produtos e estoque."
                  onClick={() => alterar("papel", "gerente")}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <span>
                <span className="block text-sm font-semibold text-slate-950">Mostrar somente as próprias vendas</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Exibe apenas Dashboard, Nova venda e o histórico realizado por esta pessoa.
                </span>
              </span>
              <input
                type="checkbox"
                checked={dados.vendasPropriasApenas}
                onChange={(event) => alterar("vendasPropriasApenas", event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
              />
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!valido || salvando}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-5 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Plus size={16} />
                {salvando ? "Criando acesso..." : "Criar acesso"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>,
    document.body
  );
}

function PerfilOption({ ativo, titulo, descricao, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        ativo ? "border-[#16A34A] bg-[#16A34A]/5 ring-2 ring-[#16A34A]/10" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-950">{titulo}</span>
        <span className={`h-4 w-4 rounded-full border-4 ${ativo ? "border-[#16A34A]" : "border-slate-300"}`} />
      </span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{descricao}</span>
    </button>
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

function ToggleRow({ titulo, descricao, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-950">{titulo}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{descricao}</span>
      </span>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 rounded border-slate-300 text-[#16A34A] focus:ring-[#16A34A]"
      />
    </label>
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
