import api from "./api";

function converterChavePublica(chave) {
  const padding = "=".repeat((4 - (chave.length % 4)) % 4);
  const base64 = (chave + padding).replace(/-/g, "+").replace(/_/g, "/");
  const dados = window.atob(base64);
  return Uint8Array.from([...dados].map((caractere) => caractere.charCodeAt(0)));
}

function ambienteInstalado() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function dispositivoIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
}

export function suporteNotificacoes() {
  return Boolean(
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function obterRegistro() {
  const existente = await navigator.serviceWorker.getRegistration("/");
  return existente || navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
}

export async function obterStatusNotificacoes() {
  const suportado = suporteNotificacoes();
  const ios = dispositivoIOS();
  const instalado = ambienteInstalado();
  let inscritoNesteDispositivo = false;
  let servidorConfigurado = false;
  let dispositivos = 0;

  if (suportado) {
    const registro = await obterRegistro();
    inscritoNesteDispositivo = Boolean(await registro.pushManager.getSubscription());
  }

  try {
    const { data } = await api.get("/notificacoes/status");
    servidorConfigurado = Boolean(data.configurado);
    dispositivos = Number(data.dispositivos || 0);
  } catch {
    servidorConfigurado = false;
  }

  return {
    suportado,
    ios,
    instalado,
    permissao: suportado ? Notification.permission : "unsupported",
    inscritoNesteDispositivo,
    servidorConfigurado,
    dispositivos,
  };
}

export async function ativarNotificacoes() {
  if (!suporteNotificacoes()) throw new Error("Este dispositivo não oferece suporte a notificações do app.");
  if (dispositivoIOS() && !ambienteInstalado()) {
    throw new Error("No iPhone, adicione a Lojia à Tela de Início antes de ativar as notificações.");
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("A permissão de notificações não foi concedida.");
  }

  const [{ data }, registro] = await Promise.all([
    api.get("/notificacoes/chave-publica"),
    obterRegistro(),
  ]);

  let inscricao = await registro.pushManager.getSubscription();
  if (!inscricao) {
    inscricao = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: converterChavePublica(data.publicKey),
    });
  }

  await api.post("/notificacoes/inscricoes", inscricao.toJSON());
  return obterStatusNotificacoes();
}

export async function desativarNotificacoes() {
  if (!suporteNotificacoes()) return obterStatusNotificacoes();

  const registro = await obterRegistro();
  const inscricao = await registro.pushManager.getSubscription();
  if (inscricao) {
    await api.delete("/notificacoes/inscricoes", { data: { endpoint: inscricao.endpoint } });
    await inscricao.unsubscribe();
  }

  return obterStatusNotificacoes();
}

export async function testarNotificacoes() {
  const { data } = await api.post("/notificacoes/teste");
  return data;
}
