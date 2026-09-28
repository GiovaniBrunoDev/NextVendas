self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Lojia", body: event.data?.text() || "Você recebeu uma nova atualização." };
  }

  const title = payload.title || "Lojia";
  const options = {
    body: payload.body || "Você recebeu uma nova atualização.",
    icon: payload.icon || "/lojia-icon.svg",
    badge: payload.badge || "/lojia-icon.svg",
    tag: payload.tag || "lojia-notificacao",
    renotify: true,
    data: {
      url: payload.url || "/",
      tela: payload.tela || "dashboard",
      pedidoId: payload.pedidoId || null,
    },
  };

  const tarefas = [self.registration.showNotification(title, options)];
  if (self.navigator && typeof self.navigator.setAppBadge === "function") {
    tarefas.push(self.navigator.setAppBadge(Number(payload.badgeCount || 1)));
  }

  event.waitUntil(Promise.all(tarefas));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil((async () => {
    if (self.navigator && typeof self.navigator.clearAppBadge === "function") {
      await self.navigator.clearAppBadge();
    }

    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const janela = janelas.find((client) => new URL(client.url).origin === self.location.origin);

    if (janela) {
      await janela.navigate(destino);
      return janela.focus();
    }

    return self.clients.openWindow(destino);
  })());
});
