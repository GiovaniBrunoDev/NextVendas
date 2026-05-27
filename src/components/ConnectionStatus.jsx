import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function ConnectionStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);

    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    atualizar();

    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[20000] mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-[0_18px_40px_rgba(24,31,36,0.18)] sm:top-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <WifiOff size={17} />
        </span>
        <div>
          <p className="font-semibold">Sem conexão com a internet</p>
          <p className="mt-0.5 text-amber-800">
            Verifique sua rede. O sistema volta a carregar normalmente quando a conexão retornar.
          </p>
        </div>
      </div>
    </div>
  );
}
