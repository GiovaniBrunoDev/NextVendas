const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const http = require("http");
const path = require("path");

const isDev = !app.isPackaged;
let staticServer = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(baseDir, requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0]);
  const normalizedPath = path.normalize(decodedPath).replace(/^[/\\]+/, "");
  const resolvedBaseDir = path.resolve(baseDir);
  const filePath = path.resolve(resolvedBaseDir, normalizedPath);

  if (!filePath.startsWith(`${resolvedBaseDir}${path.sep}`) && filePath !== resolvedBaseDir) {
    return path.join(resolvedBaseDir, "index.html");
  }

  return filePath;
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
  });
  fs.createReadStream(filePath).pipe(res);
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const buildDir = path.join(__dirname, "..", "build");
    const indexPath = path.join(buildDir, "index.html");

    if (!fs.existsSync(indexPath)) {
      reject(new Error("Build React nao encontrado. Rode npm run build antes de empacotar."));
      return;
    }

    staticServer = http.createServer((req, res) => {
      const urlPath = new URL(req.url, "http://localhost").pathname;
      const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
      const filePath = safeJoin(buildDir, requestedPath);

      fs.stat(filePath, (statError, stat) => {
        if (!statError && stat.isFile()) {
          serveFile(res, filePath);
          return;
        }

        serveFile(res, indexPath);
      });
    });

    staticServer.once("error", reject);
    staticServer.listen(0, "127.0.0.1", () => {
      const { port } = staticServer.address();
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

async function getAppUrl() {
  if (isDev) {
    return process.env.ELECTRON_START_URL || "http://localhost:3000";
  }

  return startStaticServer();
}

async function createWindow() {
  Menu.setApplicationMenu(null);

  const mainWindow = new BrowserWindow({
    title: "Lojia",
    width: 1280,
    height: 820,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f7f5ef",
    show: false,
    icon: path.join(__dirname, "..", "build-resources", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    let targetUrl;

    try {
      targetUrl = new URL(url);
    } catch {
      event.preventDefault();
      return;
    }

    const allowedHosts = ["localhost", "127.0.0.1"];
    if (!allowedHosts.includes(targetUrl.hostname)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  const appUrl = await getAppUrl();
  await mainWindow.loadURL(appUrl);
}

function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = true;

  autoUpdater.on("update-downloaded", async () => {
    const result = await dialog.showMessageBox({
      type: "info",
      buttons: ["Reiniciar agora", "Depois"],
      defaultId: 0,
      cancelId: 1,
      title: "Atualizacao disponivel",
      message: "Uma nova versao da Lojia foi baixada.",
      detail: "Reinicie o aplicativo para instalar a atualizacao.",
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on("error", (error) => {
    console.warn("Erro ao verificar atualizacoes:", error.message);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.warn("Nao foi possivel verificar atualizacoes:", error.message);
    });
  }, 4000);
}

app.whenReady().then(async () => {
  await createWindow();
  setupAutoUpdater();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (staticServer) {
    staticServer.close();
  }
});
