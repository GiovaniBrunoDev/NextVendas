import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export const lojaConfiguracoesPadrao = {
  logoUrl: "",
  taxaEntregaPadrao: "",
  mensagemWhatsApp: "Olá! Separei as informações do seu atendimento pela Lojia.",
  rodapeRecibo: "Obrigado pela preferência.",
  alertaEstoque: "2",
  mostrarLogoRecibo: true,
  reciboCompacto: false,
};

export const getLojaConfiguracoesStorageKey = (lojaId = "padrao") =>
  `lojia_configuracoes_loja_${lojaId}`;

export const getLojaConfiguracoesSalvasKey = (lojaId = "padrao") =>
  `lojia_configuracoes_salvas_${lojaId}`;

export function carregarLojaConfiguracoes(lojaId = "padrao") {
  if (typeof window === "undefined") return lojaConfiguracoesPadrao;

  try {
    const salvo = localStorage.getItem(getLojaConfiguracoesStorageKey(lojaId));
    return salvo ? { ...lojaConfiguracoesPadrao, ...JSON.parse(salvo) } : lojaConfiguracoesPadrao;
  } catch {
    return lojaConfiguracoesPadrao;
  }
}

export function salvarLojaConfiguracoes(lojaId = "padrao", configuracoes) {
  localStorage.setItem(
    getLojaConfiguracoesStorageKey(lojaId),
    JSON.stringify({ ...lojaConfiguracoesPadrao, ...configuracoes })
  );
  localStorage.setItem(getLojaConfiguracoesSalvasKey(lojaId), "1");
}

export default function useLojaConfiguracoes() {
  const { lojaAtual } = useAuth();
  const lojaId = lojaAtual?.loja?.id || "padrao";
  const [configuracoes, setConfiguracoes] = useState(() => carregarLojaConfiguracoes(lojaId));

  useEffect(() => {
    setConfiguracoes(carregarLojaConfiguracoes(lojaId));
  }, [lojaId]);

  return { lojaId, configuracoes };
}
