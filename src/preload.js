const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    // CORREGIDO: Retornar promesa en lugar de manipular DOM directamente
    // La manipulación del DOM debe hacerse en renderer.js
    getListOfWindows: () => {
        return ipcRenderer.invoke("get-window-list");
    },
    startClicking: (command) => {
        return ipcRenderer
            .invoke("start", command)
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.error("Error starting click process:", error);
                throw error;
            });
    },
    getLocation: (command) => {
        return ipcRenderer
            .invoke("get-location", command)
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.error("Error getting location:", error);
                return "";
            });
    },
    // CORREGIDO: API mejorada para permitir remover listeners
    activateKey: (callback) => {
        ipcRenderer.on("activate-key", callback);
        // Retornar función para remover el listener
        return () => ipcRenderer.removeListener("activate-key", callback);
    },
    minimizeWindow: () => ipcRenderer.send("minimize-window"),
    restoreWindow: () => ipcRenderer.send("restore-window"),
    openExternal: (url) => ipcRenderer.send("open-external", url),
    registerToggleKeys: (keysString) =>
        ipcRenderer.send("register-toggle-keys", keysString),
    isRunning: () => {
        return ipcRenderer
            .invoke("is-running")
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.error("Error checking if running:", error);
                return false;
            });
    },
    stop: () => {
        return ipcRenderer
            .invoke("stop")
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.error("Error stopping process:", error);
                return "error";
            });
    },
    stopClicking: () => {
        return ipcRenderer
            .invoke("stop")
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.error("Error stopping process:", error);
                return "error";
            });
    },
    on: (channel, listener) => {
        ipcRenderer.on(channel, listener);
        // CRÍTICO: Retornar función para remover el listener
        return () => ipcRenderer.removeListener(channel, listener);
    },
    setMinimizeToTray: (enabled) =>
        ipcRenderer.send("set-minimize-to-tray", enabled),
    getMinimizeToTray: () => ipcRenderer.invoke("get-minimize-to-tray"),
    updateTrayMenu: () => ipcRenderer.send("update-tray-menu"),
});
