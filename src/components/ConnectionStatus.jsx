import { useEffect, useRef, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

export default function ConnectionStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [recarregando, setRecarregando] = useState(false);
  const ficouOffline = useRef(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const offline = () => {
      ficouOffline.current = true;
      setRecarregando(false);
      setOnline(false);
    };

    const onlineNovamente = () => {
      setOnline(true);

      if (!ficouOffline.current) return;

      setRecarregando(true);
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    };

    window.addEventListener("online", onlineNovamente);
    window.addEventListener("offline", offline);

    if (navigator.onLine) onlineNovamente();
    else offline();

    return () => {
      window.removeEventListener("online", onlineNovamente);
      window.removeEventListener("offline", offline);
    };
  }, []);

  if (online && !recarregando) return null;

  const Icon = recarregando ? RefreshCw : WifiOff;

  return (
    <div className="fixed inset-0 z-[20000] grid place-items-center bg-[#0B1115]/42 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[24px] border border-white/70 bg-[#FFFEFA]/95 p-6 text-center shadow-[0_28px_90px_rgba(11,17,21,0.28)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16A34A]/10 text-[#0B1115]">
          <Icon size={24} className={recarregando ? "animate-spin" : ""} />
        </span>

        <p className="mt-5 text-lg font-semibold text-slate-950">
          {recarregando ? "Conexao restabelecida" : "Sem conexao com a internet"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {recarregando
            ? "Estamos atualizando esta tela para sincronizar as informacoes."
            : "Verifique sua rede. Assim que a conexao voltar, esta pagina sera atualizada automaticamente."}
        </p>
      </div>
    </div>
  );
}
