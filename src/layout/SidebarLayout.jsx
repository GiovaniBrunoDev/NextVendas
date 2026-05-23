import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  PackagePlus,
  Search,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const acessoPorPerfil = {
  dashboard: ["admin", "gerente", "vendedor"],
  vendas: ["admin", "gerente", "vendedor"],
  historico: ["admin", "gerente", "vendedor"],
  pedidos: ["admin", "gerente", "vendedor"],
  clientes: ["admin", "gerente", "vendedor"],
  produtos: ["admin", "gerente", "vendedor"],
  estoque: ["admin", "gerente"],
  entradas: ["admin", "gerente"],
  lucro: ["admin", "gerente"],
  metas: ["admin", "gerente"],
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function SidebarLayout({ children, setTela }) {
  const [isMobile, setIsMobile] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState("dashboard");
  const { usuario, lojaAtual, logout } = useAuth();
  const papel = lojaAtual?.papel;
  const assinatura = lojaAtual?.loja?.assinatura;
  const assinaturaAtiva = lojaAtual?.loja?.assinaturaAtiva;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const trocarTela = (tela) => {
    setTela(tela);
    setTelaAtiva(tela);
  };

  const menuItems = useMemo(
    () => [
      { key: "dashboard", label: "Dashboard", group: "Visão geral", icon: LayoutDashboard },
      { key: "vendas", label: "Nova venda", group: "Operação", icon: BadgeDollarSign },
      { key: "pedidos", label: "Pedidos", group: "Operação", icon: PackageCheck },
      { key: "historico", label: "Vendas", group: "Operação", icon: ClipboardList },
      { key: "clientes", label: "Clientes", group: "Operação", icon: UsersRound },
      { key: "estoque", label: "Estoque", group: "Gestão", icon: Boxes },
      { key: "entradas", label: "Entradas", group: "Gestão", icon: PackagePlus },
      { key: "produtos", label: "Consultar", group: "Gestão", icon: Search },
      { key: "lucro", label: "Lucro", group: "Gestão", icon: TrendingUp },
      ...(usuario?.superadmin ? [{ key: "superadmin", label: "Admin", group: "Sistema", icon: ShieldCheck }] : []),
    ],
    [usuario?.superadmin]
  );

  const itensPermitidos = menuItems.filter((item) => {
    if (item.key === "superadmin") return usuario?.superadmin;
    return acessoPorPerfil[item.key]?.includes(papel);
  });

  const telaAtual = itensPermitidos.find((item) => item.key === telaAtiva);

  const itensMobile = ["dashboard", "vendas", "pedidos", "historico", "estoque", "produtos"]
    .map((key) => itensPermitidos.find((item) => item.key === key))
    .filter(Boolean);

  const statusPlano = assinaturaAtiva
    ? {
        label: `${assinatura?.status || "ativa"} ate ${formatDate(assinatura?.venceEm)}`,
        className: "border-white/[0.1] bg-white/[0.055] text-white/[0.82]",
        icon: CheckCircle2,
      }
    : {
        label: "Assinatura vencida",
        className: "border-[#F4A62A]/40 bg-[#F4A62A]/[0.15] text-[#FFE4AA]",
        icon: AlertTriangle,
      };

  const StatusIcon = statusPlano.icon;

  const planoBox = (
    <div className={`mb-3 rounded-lg border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${statusPlano.className}`}>
      <div className="flex items-start gap-2">
        <StatusIcon size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase opacity-70">Plano da loja</p>
          <p className="mt-1 text-sm font-bold">{statusPlano.label}</p>
          {!assinaturaAtiva && (
            <p className="mt-2 text-xs leading-5 opacity-85">
              Consultas liberadas. Vendas, pedidos, estoque e cadastros ficam bloqueados ate renovar.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <nav className="lojia-sidebar-scroll mt-4 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
      {itensPermitidos.map(({ key, label, icon: Icon }) => {
        const ativo = telaAtiva === key;
        const destaque = key === "vendas";

        return (
          <button
            key={key}
            onClick={() => trocarTela(key)}
            className={`group relative flex w-full items-center rounded-lg px-2.5 py-2 text-left transition ${
              ativo
                ? "bg-[#FFFEFA] text-[#181F24] shadow-[0_12px_26px_rgba(0,0,0,0.12)]"
                : destaque
                  ? "border border-[#16A36B]/[0.26] bg-[#16A36B]/[0.13] text-white/[0.92] hover:bg-[#16A36B]/[0.2]"
                  : "text-white/[0.72] hover:bg-white/[0.085] hover:text-white"
            }`}
          >
            <span
              className={`mr-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${
                ativo
                  ? "bg-[#16A36B]/10 text-[#16A36B]"
                  : destaque
                    ? "bg-[#16A36B]/[0.16] text-[#D8F7E8]"
                    : "bg-white/[0.055] text-white/[0.54] group-hover:text-white/[0.86]"
              }`}
            >
              <Icon size={16} />
            </span>
            <span className="block min-w-0 truncate text-[13px] font-semibold">{label}</span>
            {ativo && <span className="ml-auto h-2 w-2 rounded-full bg-[#16A36B]" />}
          </button>
        );
      })}
    </nav>
  );

  const renderBottomNav = () => (
    <>
      <div className="fixed bottom-4 left-0 right-0 z-50 mx-3 flex justify-around rounded-lg border border-white/10 bg-[#181F24] py-1.5 text-white shadow-xl">
        {itensMobile.map(({ key, label, icon: Icon }) => (
            <button
            key={key}
            onClick={() => trocarTela(key)}
            className={`flex min-w-0 flex-1 flex-col items-center px-1.5 text-[10px] transition ${
                telaAtiva === key ? "text-[#71E2A9]" : "text-white/[0.78]"
              }`}
            >
              <Icon size={18} className="mb-0.5" />
              <span className="w-full truncate whitespace-nowrap text-center">{label}</span>
            </button>
          ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 h-5 bg-[#F7F5EF]" />
    </>
  );

  return (
    <div className="lojia-shell flex min-h-screen flex-col pb-20 md:flex-row md:pb-0">
      {!isMobile && (
        <aside className="lojia-gradient flex w-72 shrink-0 flex-col overflow-hidden p-4 text-white shadow-[18px_0_42px_rgba(36,48,43,0.12)] md:sticky md:top-0 md:h-screen">
          <div className="mb-4 shrink-0 px-1">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.96] p-2 shadow-[0_14px_28px_rgba(0,0,0,0.14)]">
              <img
                src="/lojia-brand.png"
                alt="Lojia"
                className="h-14 w-full scale-[1.45] object-contain"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-white/[0.1]" />

          {renderMenu()}

          <div className="mt-4 shrink-0 border-t border-white/[0.08] pt-4">
            {planoBox}
            <div className="mb-3 rounded-lg bg-white/[0.045] px-3 py-2">
              <p className="truncate text-sm font-bold text-white">{usuario?.nome}</p>
              <p className="mt-0.5 text-xs font-semibold capitalize text-white/[0.48]">
                {papel || (usuario?.superadmin ? "superadmin" : "sem perfil")}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-bold text-white/[0.68] transition hover:bg-white/[0.075] hover:text-white"
            >
              <LogOut size={18} className="mr-3" /> Sair
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6">{children}</main>
      {isMobile && renderBottomNav()}
    </div>
  );
}
