import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Search,
  ShieldCheck,
  Wallet,
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
  inventario: ["admin", "gerente"],
  etiquetas: ["admin", "gerente"],
  caixa: ["admin", "gerente", "vendedor"],
  financeiro: ["admin", "gerente"],
  relatorios: ["admin", "gerente"],
  "minha-conta": ["admin", "gerente", "vendedor"],
  metas: ["admin", "gerente"],
};

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

export default function SidebarLayout({ children, setTela }) {
  const [isMobile, setIsMobile] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    const telaSalva = localStorage.getItem("lojia_tela_ativa") || "dashboard";
    return ["entradas", "inventario", "etiquetas"].includes(telaSalva) ? "estoque" : telaSalva;
  });
  const { usuario, lojaAtual, logout } = useAuth();
  const papel = lojaAtual?.papel;
  const fotoPerfil = usuario?.fotoUrl || usuario?.avatarUrl || usuario?.imagemUrl;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const trocarTela = (tela) => {
    localStorage.setItem("lojia_tela_ativa", tela);
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
      { key: "produtos", label: "Consultar", group: "Gestão", icon: Search },
      { key: "financeiro", label: "Financeiro", group: "Gestão", icon: Wallet },
      { key: "relatorios", label: "Relatórios", group: "Gestão", icon: BarChart3 },
      ...(usuario?.superadmin ? [{ key: "superadmin", label: "Admin", group: "Sistema", icon: ShieldCheck }] : []),
    ],
    [usuario?.superadmin]
  );

  const itensPermitidos = menuItems.filter((item) => {
    if (item.key === "superadmin") return usuario?.superadmin;
    return acessoPorPerfil[item.key]?.includes(papel);
  });

  const contaAtiva = telaAtiva === "minha-conta";

  const itensMobile = ["dashboard", "vendas", "pedidos", "historico", "estoque", "produtos"]
    .map((key) => itensPermitidos.find((item) => item.key === key))
    .filter(Boolean);

  const renderMenu = () => (
    <nav className="lojia-sidebar-scroll mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
      {itensPermitidos.map(({ key, label, icon: Icon }) => {
        const ativo = telaAtiva === key;

        return (
          <button
            key={key}
            onClick={() => trocarTela(key)}
            className={`group relative flex w-full items-center rounded-[14px] px-3.5 py-3 text-left transition-all duration-200 ${ativo
                ? "bg-[#16A34A] text-white shadow-[0_10px_22px_rgba(0,0,0,0.18)]"
                : "text-[#8F989E] hover:bg-white/[0.045] hover:text-white"
              }`}
          >
            <span
              className={`mr-3 flex h-6 w-6 shrink-0 items-center justify-center transition ${ativo
                  ? "text-white"
                  : "text-[#79838A] group-hover:text-white/[0.86]"
                }`}
            >
              <Icon size={17} strokeWidth={1.8} />
            </span>
            <span className="block min-w-0 truncate text-[13px] font-semibold">{label}</span>
          </button>
        );
      })}
    </nav>
  );

  const renderBottomNav = () => (
    <>
      <div className="lojia-mobile-nav fixed inset-x-3 bottom-4 z-50 flex max-w-[calc(100vw-1.5rem)] justify-around rounded-2xl border border-white/[0.08] bg-[#0B1115] px-1 py-1.5 text-white shadow-[0_18px_42px_rgba(5,8,10,0.34)]">
        {itensMobile.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => trocarTela(key)}
            className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-1.5 py-1 text-[10px] transition ${telaAtiva === key ? "bg-[#16A34A] text-white" : "text-[#9AA2A7]"
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
    <div className="lojia-shell flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden pb-20 md:h-screen md:min-h-0 md:overflow-hidden md:pb-0 md:flex-row">
      {!isMobile && (
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden rounded-r-[28px] border-r border-white/[0.07] bg-[#0B1115] p-5 text-white shadow-[18px_0_42px_rgba(5,8,10,0.22)] md:sticky md:top-0 md:h-screen">
          <div className="mb-4 shrink-0 px-1">
            <img
              src="/lojia-logo.png"
              alt="Lojia"
              className="h-16
               w-full scale-[0.8] object-contain"
            />
          </div>

          <div className="shrink-0 border-t border-white/[0.07]" />

          {renderMenu()}

          <div className="mt-4 shrink-0 border-t border-white/[0.07] pt-4">
            <button
              type="button"
              onClick={() => trocarTela("minha-conta")}
              aria-current={contaAtiva ? "page" : undefined}
              className={`mb-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                contaAtiva
                  ? "bg-[#16A34A] text-white shadow-[0_10px_22px_rgba(0,0,0,0.18)]"
                  : "bg-white/[0.035] text-white hover:bg-white/[0.06]"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
                contaAtiva ? "border-white/40 bg-white/15" : "border-white/[0.08] bg-white/[0.06]"
              }`}>
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{getInitials(usuario?.nome)}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white">{usuario?.nome}</span>
                <span className={`mt-0.5 block text-xs font-semibold capitalize ${contaAtiva ? "text-white/80" : "text-white/[0.48]"}`}>
                  {papel || (usuario?.superadmin ? "superadmin" : "sem perfil")}
                </span>
              </span>
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold text-white/[0.58] transition hover:bg-white/[0.055] hover:text-white"
            >
              <LogOut size={18} className="mr-3" /> Sair
            </button>
          </div>
        </aside>
      )}

      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-3 sm:p-4 md:h-screen md:min-h-0 md:p-6">{children}</main>
      {isMobile && renderBottomNav()}
    </div>
  );
}
