const {
    app,
    BrowserWindow,
    ipcMain,
    shell,
    globalShortcut,
    Tray,
    Menu,
} = require("electron");
const path = require("path");
const { exec, spawn } = require("child_process");
const iconv = require("iconv-lite");
const fs = require("fs");

// Map para gestionar múltiples procesos Python simultáneamente
// La key será el modeId (click, move, passive, o el key específico)
let pythonProcesses = new Map();
let locate = null;
let mainWindow = null;
let tray = null;
let minimizeToTray = false;

// Paths de iconos para estado activo/inactivo
const iconActivePath = path.join(__dirname, "src/assets/icon-active.ico");
const iconInactivePath = path.join(__dirname, "src/assets/icon-inactive.ico");

let iconsValidated = false;
function validateIconFiles() {
    if (iconsValidated) return true;

    try {
        const activeExists = fs.existsSync(iconActivePath);
        const inactiveExists = fs.existsSync(iconInactivePath);

        if (!activeExists) {
            console.error(`ERROR: Icon file not found: ${iconActivePath}`);
        }
        if (!inactiveExists) {
            console.error(`ERROR: Icon file not found: ${iconInactivePath}`);
        }

        iconsValidated = activeExists && inactiveExists;
        return iconsValidated;
    } catch (err) {
        console.error("Error validating icon files:", err);
        return false;
    }
}

const pythonExecutable = path.join("src/python/pythonw.exe");
const getPath = path.join("src/get.py");
const getLocation = path.join("src/locate.py");
const clickPath = path.join("src/click.py");

let ipcHandlersSetup = false;

function updateAppIcon(isActive) {
    if (!validateIconFiles()) {
        console.error("Cannot update app icon: icon files not found");
        return;
    }

    const iconPath = isActive ? iconActivePath : iconInactivePath;

    if (mainWindow && !mainWindow.isDestroyed()) {
        try {
            mainWindow.setIcon(iconPath);
        } catch (err) {
            console.error("Error setting window icon:", err);
        }
    }

    if (tray && !tray.isDestroyed()) {
        try {
            tray.setImage(iconPath);
        } catch (err) {
            console.error("Error setting tray icon:", err);
        }
    }

    if (tray && mainWindow && !mainWindow.isDestroyed()) {
        const webContents = mainWindow.webContents;
        if (
            webContents &&
            !webContents.isDestroyed() &&
            !webContents.isLoading()
        ) {
            webContents.send("update-tray-menu");
        }
    }
}

// Registrar handlers IPC una sola vez, fuera de createWindow
function setupIpcHandlers() {
    // Solo registrar si no están ya registrados
    if (ipcHandlersSetup) {
        return;
    }
    ipcHandlersSetup = true;

    ipcMain.handle("get-location", async () => {
        return new Promise((resolve, reject) => {
            if (locate !== null) {
                try {
                    locate.stdout.removeAllListeners();
                    locate.stderr.removeAllListeners();
                    locate.removeAllListeners();
                    locate.kill("SIGTERM");

                    setImmediate(() => {
                        if (locate && !locate.killed) {
                            try {
                                locate.kill("SIGKILL");
                            } catch (killErr) {
                                console.error(
                                    "Error force-killing locate:",
                                    killErr
                                );
                            }
                        }
                    });
                } catch (err) {
                    console.error("Error killing existing locate:", err);
                    // Fallback directo con SIGKILL si SIGTERM falla
                    try {
                        if (locate && !locate.killed) {
                            locate.kill("SIGKILL");
                        }
                    } catch (killErr) {
                        console.error(
                            "Error force-killing locate after SIGTERM failed:",
                            killErr
                        );
                    }
                }
                locate = null;
            }

            locate = spawn(pythonExecutable, [getLocation], {
                encoding: "utf8",
            });

            let output = "";
            let hasErrored = false;
            let hasClosed = false;

            const cleanupLocate = () => {
                if (locate) {
                    // Remover todos los listeners para evitar memory leaks
                    locate.stdout.removeAllListeners();
                    locate.stderr.removeAllListeners();
                    locate.removeAllListeners();

                    // CRÍTICO: Matar el proceso antes de limpiarlo
                    try {
                        if (!locate.killed) {
                            locate.kill("SIGTERM");
                            // Fallback inmediato con SIGKILL
                            setImmediate(() => {
                                if (locate && !locate.killed) {
                                    try {
                                        locate.kill("SIGKILL");
                                    } catch (killErr) {
                                        console.error(
                                            "Error force-killing locate in cleanup:",
                                            killErr
                                        );
                                    }
                                }
                            });
                        }
                    } catch (err) {
                        console.error("Error killing locate in cleanup:", err);
                        // Fallback directo
                        try {
                            if (locate && !locate.killed) {
                                locate.kill("SIGKILL");
                            }
                        } catch (killErr) {
                            console.error(
                                "Error force-killing locate after SIGTERM failed:",
                                killErr
                            );
                        }
                    }

                    locate = null;
                }
            };

            locate.stdout.on("data", (data) => {
                output += data.toString();
            });

            locate.stderr.on("data", (data) => {
                if (!hasErrored) {
                    hasErrored = true;
                    const errorMsg = data.toString();
                    console.error("locate.py error:", errorMsg);
                    cleanupLocate();
                    reject(new Error(errorMsg));
                }
            });

            locate.on("close", (code) => {
                if (!hasClosed) {
                    hasClosed = true;
                    cleanupLocate();
                    if (code === 0 || output) {
                        resolve(output.trim());
                    } else if (!hasErrored) {
                        reject(new Error(`Process exited with code ${code}`));
                    }
                }
            });

            locate.on("error", (err) => {
                if (!hasErrored) {
                    hasErrored = true;
                    console.error("locate.py spawn error:", err);
                    cleanupLocate();
                    reject(err);
                }
            });

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.minimize();
            }
        });
    });

    ipcMain.handle("get-window-list", async () => {
        return new Promise((resolve, reject) => {
            exec(
                `${pythonExecutable} ${getPath}`,
                { encoding: "buffer" },
                (err, stdout, stderr) => {
                    if (err) {
                        reject(err);
                    } else {
                        try {
                            // CRÍTICO: Envolver iconv.decode en try-catch
                            const output = iconv.decode(stdout, "UTF-8").trim();
                            try {
                                // Parsear JSON que contiene títulos e íconos
                                const windowsData = JSON.parse(output);
                                resolve(windowsData);
                            } catch (e) {
                                // Fallback a formato antiguo si no es JSON
                                const windows = output.split("\n");
                                resolve(windows);
                            }
                        } catch (decodeError) {
                            console.error(
                                "Error decoding window list:",
                                decodeError
                            );
                            reject(decodeError);
                        }
                    }
                }
            );
        });
    });

    // ACTUALIZADO: Ahora recibe array de comandos (para múltiples modos)
    ipcMain.handle("start", async (event, commands) => {
        return new Promise((resolve, reject) => {
            // CRÍTICO: Validar que commands sea un array válido
            if (!Array.isArray(commands) || commands.length === 0) {
                reject(new Error("Invalid commands array"));
                return;
            }

            // Validar cada comando
            for (const cmd of commands) {
                if (
                    !cmd ||
                    typeof cmd !== "object" ||
                    !cmd.modeId ||
                    !Array.isArray(cmd.command)
                ) {
                    reject(new Error("Invalid command object structure"));
                    return;
                }
            }

            // Si hay procesos activos, detenerlos todos
            if (pythonProcesses.size > 0) {
                // CRÍTICO: Limpiar todos los procesos existentes
                // Crear backup antes de limpiar para evitar race condition
                const processesToKill = new Map(pythonProcesses);
                pythonProcesses.clear();

                processesToKill.forEach((process, modeId) => {
                    try {
                        process.stdout.removeAllListeners();
                        process.stderr.removeAllListeners();
                        process.removeAllListeners();
                        // Usar SIGTERM para terminación limpia
                        process.kill("SIGTERM");
                        // Fallback inmediato con SIGKILL
                        setImmediate(() => {
                            if (process && !process.killed) {
                                try {
                                    process.kill("SIGKILL");
                                } catch (killErr) {
                                    console.error(
                                        `Error force-killing process ${modeId}:`,
                                        killErr
                                    );
                                }
                            }
                        });
                    } catch (err) {
                        console.error(
                            `Error killing process for ${modeId}:`,
                            err
                        );
                        // Fallback directo con SIGKILL si SIGTERM falla
                        try {
                            if (process && !process.killed) {
                                process.kill("SIGKILL");
                            }
                        } catch (killErr) {
                            console.error(
                                `Error force-killing process ${modeId} after SIGTERM failed:`,
                                killErr
                            );
                        }
                    }
                });

                // Actualizar icono a inactivo cuando se detiene
                updateAppIcon(false);

                resolve("stopped");
            } else {
                // Iniciar un proceso por cada comando
                let startedCount = 0;
                let errorOccurred = false;

                commands.forEach((commandObj) => {
                    const { modeId, command } = commandObj;

                    command.unshift(clickPath);
                    const process = spawn(pythonExecutable, command, {
                        encoding: "utf8",
                    });

                    // CRÍTICO BUG #14: Guardar proceso en el Map INMEDIATAMENTE
                    // ANTES de registrar listeners para evitar race condition
                    // Si la ventana se cierra antes de que se registren los listeners,
                    // el proceso debe estar en el Map para poder ser terminado
                    pythonProcesses.set(modeId, process);

                    let hasErrored = false;
                    let hasClosed = false;

                    const cleanupProcess = () => {
                        if (pythonProcesses.has(modeId)) {
                            const proc = pythonProcesses.get(modeId);
                            // Remover todos los listeners para evitar memory leaks
                            proc.stdout.removeAllListeners();
                            proc.stderr.removeAllListeners();
                            proc.removeAllListeners();
                            // CRÍTICO: Matar el proceso antes de eliminarlo del Map
                            // Usar SIGTERM/SIGKILL para garantizar terminación
                            try {
                                if (!proc.killed) {
                                    proc.kill("SIGTERM");
                                    // Fallback inmediato con SIGKILL si no se puede terminar
                                    setImmediate(() => {
                                        if (proc && !proc.killed) {
                                            try {
                                                proc.kill("SIGKILL");
                                            } catch (killErr) {
                                                console.error(
                                                    `Error force-killing process ${modeId}:`,
                                                    killErr
                                                );
                                            }
                                        }
                                    });
                                }
                            } catch (err) {
                                console.error(
                                    `Error killing process ${modeId} in cleanup:`,
                                    err
                                );
                                // Fallback directo con SIGKILL si SIGTERM falla
                                try {
                                    if (proc && !proc.killed) {
                                        proc.kill("SIGKILL");
                                    }
                                } catch (killErr) {
                                    console.error(
                                        `Error force-killing process ${modeId} after SIGTERM failed:`,
                                        killErr
                                    );
                                }
                            }
                            pythonProcesses.delete(modeId);
                        }
                    };

                    process.stderr.on("data", (data) => {
                        const errorMsg = data.toString();
                        console.error(
                            `click.py error for ${modeId}:`,
                            errorMsg
                        );
                        if (!hasErrored && !hasClosed) {
                            hasErrored = true;
                            errorOccurred = true;
                            cleanupProcess();

                            // CRÍTICO: Limpiar timeout si existe
                            if (pythonProcessCleanupTimeouts.has(modeId)) {
                                clearTimeout(
                                    pythonProcessCleanupTimeouts.get(modeId)
                                );
                                pythonProcessCleanupTimeouts.delete(modeId);
                            }

                            // Actualizar icono si todos los procesos se detuvieron por error
                            if (pythonProcesses.size === 0) {
                                updateAppIcon(false);
                            }

                            if (event.sender && !event.sender.isDestroyed()) {
                                event.sender.send(
                                    "error-message",
                                    Buffer.from(`[${modeId}] ${errorMsg}`)
                                );
                            }
                        }
                    });

                    process.on("close", (code) => {
                        if (!hasClosed) {
                            hasClosed = true;
                            cleanupProcess();

                            // CRÍTICO: Limpiar timeout si existe
                            if (pythonProcessCleanupTimeouts.has(modeId)) {
                                clearTimeout(
                                    pythonProcessCleanupTimeouts.get(modeId)
                                );
                                pythonProcessCleanupTimeouts.delete(modeId);
                            }

                            // Si todos los procesos se cerraron, notificar y actualizar icono
                            if (pythonProcesses.size === 0) {
                                // Actualizar icono a inactivo cuando se cierran todos los procesos
                                updateAppIcon(false);

                                if (!errorOccurred) {
                                    if (
                                        event.sender &&
                                        !event.sender.isDestroyed()
                                    ) {
                                        event.sender.send(
                                            "process-terminated",
                                            code
                                        );
                                    }
                                }
                            }
                        }
                    });

                    process.on("error", (err) => {
                        if (!hasErrored) {
                            hasErrored = true;
                            errorOccurred = true;
                            console.error(
                                `Python process spawn error for ${modeId}:`,
                                err
                            );
                            cleanupProcess();

                            // CRÍTICO: Limpiar timeout si existe
                            if (pythonProcessCleanupTimeouts.has(modeId)) {
                                clearTimeout(
                                    pythonProcessCleanupTimeouts.get(modeId)
                                );
                                pythonProcessCleanupTimeouts.delete(modeId);
                            }

                            // Actualizar icono si todos los procesos se detuvieron por error
                            if (pythonProcesses.size === 0) {
                                updateAppIcon(false);
                            }

                            if (event.sender && !event.sender.isDestroyed()) {
                                event.sender.send(
                                    "error-message",
                                    Buffer.from(`[${modeId}] ${err.message}`)
                                );
                            }
                            reject(err);
                        }
                    });

                    // NOTA: El proceso ya fue guardado en el Map al inicio (línea ~356)
                    // para evitar race condition con el cierre de ventana
                    startedCount++;

                    // Actualizar icono a activo cuando se inicia el primer proceso
                    if (startedCount === 1) {
                        updateAppIcon(true);
                    }
                });

                resolve(`started-${startedCount}`);
            }
        });
    });

    ipcMain.handle("stop", async () => {
        return new Promise((resolve) => {
            if (pythonProcesses.size > 0) {
                try {
                    // ACTUALIZADO: Detener todos los procesos
                    // Crear backup antes de limpiar para evitar race condition
                    const processesToStop = new Map(pythonProcesses);
                    pythonProcesses.clear();

                    processesToStop.forEach((process, modeId) => {
                        try {
                            // Remover listeners antes de matar el proceso
                            process.stdout.removeAllListeners();
                            process.stderr.removeAllListeners();
                            process.removeAllListeners();
                            // Usar SIGTERM para terminación limpia
                            process.kill("SIGTERM");
                            // Fallback inmediato con SIGKILL
                            setImmediate(() => {
                                if (process && !process.killed) {
                                    try {
                                        process.kill("SIGKILL");
                                    } catch (killErr) {
                                        console.error(
                                            `Error force-killing process ${modeId}:`,
                                            killErr
                                        );
                                    }
                                }
                            });
                        } catch (err) {
                            console.error(
                                `Error stopping process ${modeId}:`,
                                err
                            );
                            // Fallback directo con SIGKILL si SIGTERM falla
                            try {
                                if (process && !process.killed) {
                                    process.kill("SIGKILL");
                                }
                            } catch (killErr) {
                                console.error(
                                    `Error force-killing process ${modeId} after SIGTERM failed:`,
                                    killErr
                                );
                            }
                        }
                    });

                    // Actualizar icono a inactivo cuando se detiene
                    updateAppIcon(false);

                    resolve("stopped");
                } catch (err) {
                    console.error("Error stopping pythonProcesses:", err);
                    pythonProcesses.clear();

                    // Actualizar icono a inactivo incluso si hay error
                    updateAppIcon(false);

                    resolve("stopped");
                }
            } else {
                resolve("already-stopped");
            }
        });
    });

    ipcMain.handle("is-running", async () => {
        // ACTUALIZADO: Retorna true si hay al menos un proceso activo
        return pythonProcesses.size > 0;
    });

    ipcMain.on("minimize-window", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.minimize();
        }
    });

    ipcMain.on("restore-window", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            // Si está oculta, mostrarla
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            // Si está minimizada, restaurarla
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            // Traer al frente y enfocar
            mainWindow.focus();
        }
    });

    ipcMain.on("open-external", (event, url) => {
        // CRÍTICO: Validar que la URL sea segura antes de abrirla
        if (
            typeof url === "string" &&
            (url.startsWith("https://") || url.startsWith("http://"))
        ) {
            shell.openExternal(url);
        } else {
            console.error("Invalid URL attempted to open:", url);
        }
    });

    // Manejar registro dinámico de múltiples shortcuts de toggle
    ipcMain.on("register-toggle-keys", (event, keysString) => {
        registerToggleShortcuts(keysString);
    });

    // Manejar configuración de minimize to tray
    ipcMain.on("set-minimize-to-tray", (event, enabled) => {
        minimizeToTray = enabled;

        if (!enabled) {
            destroyTray();

            // Si la ventana está oculta, mostrarla
            if (
                mainWindow &&
                !mainWindow.isDestroyed() &&
                !mainWindow.isVisible()
            ) {
                mainWindow.show();
                mainWindow.restore();
            }
        }
    });

    // Manejar obtención del estado de minimize to tray
    ipcMain.handle("get-minimize-to-tray", async () => {
        return minimizeToTray;
    });
}

// Variable para trackear shortcuts registrados actualmente
let currentToggleKeys = [];

// Mapeo de nombres de teclas a formato de Electron accelerator
function normalizeKeyForAccelerator(key) {
    // CRÍTICO: Validar entrada
    if (typeof key !== "string" || key.length === 0 || key.length > 50) {
        console.warn(`Invalid key for accelerator: ${key}`);
        return null;
    }

    const keyMap = {
        // Teclas de función
        f1: "F1",
        f2: "F2",
        f3: "F3",
        f4: "F4",
        f5: "F5",
        f6: "F6",
        f7: "F7",
        f8: "F8",
        f9: "F9",
        f10: "F10",
        f11: "F11",
        f12: "F12",
        // Teclas especiales que pueden usarse solas sin bloquear el sistema
        space: "Space",
        tab: "Tab",
        enter: "Enter",
        escape: "Escape",
        backspace: "Backspace",
        delete: "Delete",
        insert: "Insert",
        home: "Home",
        end: "End",
        pageup: "PageUp",
        pagedown: "PageDown",
        up: "Up",
        down: "Down",
        left: "Left",
        right: "Right",
        // Teclas del numpad
        num0: "num0",
        num1: "num1",
        num2: "num2",
        num3: "num3",
        num4: "num4",
        num5: "num5",
        num6: "num6",
        num7: "num7",
        num8: "num8",
        num9: "num9",
    };

    const lowerKey = key.toLowerCase();

    // Si está en el mapa, usar el valor mapeado
    if (keyMap[lowerKey]) {
        return keyMap[lowerKey];
    }

    // Para letras individuales (a-z) o números (0-9), agregar Ctrl+ para evitar bloqueo global
    if (/^[a-z0-9]$/.test(lowerKey)) {
        return `CommandOrControl+${lowerKey.toUpperCase()}`;
    }

    // Si no es reconocida, retornar con Ctrl+ por seguridad
    return `CommandOrControl+${key}`;
}

// Función para registrar múltiples shortcuts de toggle (separados por espacio)
function registerToggleShortcuts(keysString) {
    // Desregistrar todos los shortcuts previos
    currentToggleKeys.forEach((key) => {
        try {
            if (globalShortcut.isRegistered(key)) {
                globalShortcut.unregister(key);
            }
        } catch (error) {
            console.error(`Error desregistrando shortcut ${key}:`, error);
        }
    });

    currentToggleKeys = [];

    if (!keysString || keysString.trim() === "") {
        return;
    }

    // Limpiar y dividir el string de keys por espacios
    const keys = keysString
        .split(" ")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

    // Registrar cada key con el mismo callback
    keys.forEach((key) => {
        try {
            const accelerator = normalizeKeyForAccelerator(key);

            // CRÍTICO: Validar que normalizeKeyForAccelerator retornó un valor válido
            if (!accelerator) {
                console.warn(`[ERROR] Key inválida ignorada: ${key}`);
                return;
            }

            const registered = globalShortcut.register(accelerator, () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("activate-key");
                }
            });

            if (registered) {
                currentToggleKeys.push(accelerator);
            }
        } catch (error) {
            console.error(`Error registrando shortcut ${key}:`, error);
        }
    });
}

// Variable para trackear el listener de update-tray-menu
let trayMenuUpdateListener = null;

// Función para crear el system tray
function createTray() {
    // CORRECCIÓN LEAK #2: Validar más rigurosamente para evitar duplicación
    if (tray) {
        // Si existe pero está destruido, limpiar primero
        if (tray.isDestroyed()) {
            tray = null;
        } else {
            return; // Ya existe y está funcional
        }
    }

    // MEJORA #1: Validar que los archivos de iconos existen antes de crear tray
    if (!validateIconFiles()) {
        console.error("Cannot create tray: icon files not found");
        return;
    }

    // Usar el icono apropiado según si hay procesos activos
    const iconPath =
        pythonProcesses.size > 0 ? iconActivePath : iconInactivePath;

    try {
        tray = new Tray(iconPath);
    } catch (err) {
        console.error("Error creating tray:", err);
        tray = null;
        return;
    }

    const updateTrayMenu = () => {
        const isRunning = pythonProcesses.size > 0;
        const contextMenu = Menu.buildFromTemplate([
            {
                label: "Open",
                click: () => {
                    // CORRECCIÓN BUG #1 y #4: Recrear ventana si no existe
                    if (!mainWindow || mainWindow.isDestroyed()) {
                        createWindow();
                    } else {
                        mainWindow.show();
                        mainWindow.restore();
                        mainWindow.focus();
                    }
                },
            },
            {
                label: isRunning ? "Deactivate" : "Activate",
                click: () => {
                    // CORRECCIÓN BUG #4: Validar webContents antes de enviar
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        const webContents = mainWindow.webContents;
                        if (webContents && !webContents.isDestroyed()) {
                            webContents.send("activate-key");
                        }
                    }
                },
            },
            { type: "separator" },
            {
                label: "Exit",
                click: () => {
                    // Forzar el cierre
                    app.isQuitting = true;
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.destroy();
                    }
                    app.quit();
                },
            },
        ]);

        // CORRECCIÓN BUG #4: Validar que tray sigue existiendo antes de setear menú
        if (tray && !tray.isDestroyed()) {
            tray.setContextMenu(contextMenu);
        }
    };

    updateTrayMenu();

    // CORRECCIÓN: Validar que tray sigue válido antes de configurar
    if (!tray || tray.isDestroyed()) {
        console.error("Tray was destroyed during initialization");
        tray = null;
        return;
    }

    tray.setToolTip("Keeptive");

    // Click izquierdo para restaurar/abrir
    tray.on("click", () => {
        // CORRECCIÓN BUG #3: Validar completamente antes de usar mainWindow
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.restore();
                mainWindow.focus();
            }
        }
    });

    // CORRECCIÓN BUG #2 y LEAK #1: Protección robusta contra listeners duplicados
    if (trayMenuUpdateListener) {
        try {
            ipcMain.removeListener("update-tray-menu", trayMenuUpdateListener);
        } catch (err) {
            console.error("Error removing tray menu listener:", err);
        }
        trayMenuUpdateListener = null;
    }

    // Actualizar el menú cuando cambie el estado de los procesos
    trayMenuUpdateListener = () => {
        // CORRECCIÓN BUG #6: Ignorar silenciosamente si no hay tray
        if (tray && !tray.isDestroyed()) {
            updateTrayMenu();
        }
    };

    ipcMain.on("update-tray-menu", trayMenuUpdateListener);
}

// Función para destruir el tray y limpiar recursos
function destroyTray() {
    if (tray) {
        // CORRECCIÓN LEAK #2: Validar que no esté ya destruido antes de limpiar
        if (!tray.isDestroyed()) {
            try {
                // CRÍTICO: Remover TODOS los listeners antes de destruir
                // Esto previene memory leaks de listeners acumulados
                tray.removeAllListeners();
                tray.destroy();
            } catch (err) {
                console.error("Error destroying tray:", err);
            }
        }
        tray = null;
    }

    // CRÍTICO: Remover el listener IPC cuando se destruye el tray
    if (trayMenuUpdateListener) {
        try {
            ipcMain.removeListener("update-tray-menu", trayMenuUpdateListener);
        } catch (err) {
            console.error("Error removing tray menu listener:", err);
        }
        trayMenuUpdateListener = null;
    }
}

function createWindow() {
    // MEJORA #1: Validar iconos al crear ventana
    validateIconFiles();

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 732,
        minWidth: 500,
        minHeight: 400,
        show: false,
        icon: iconInactivePath, // Iniciar con icono inactivo
        webPreferences: {
            preload: path.join(__dirname, "src/preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.setMenu(null);

    mainWindow.loadFile("src/index.html");

    mainWindow.once("ready-to-show", () => {
        mainWindow.center();
        mainWindow.show();
    });

    // Registrar shortcuts por defecto
    registerToggleShortcuts("F6");

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    mainWindow.webContents.on("will-navigate", (event, url) => {
        if (url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // Manejar el evento minimize
    mainWindow.on("minimize", (event) => {
        if (minimizeToTray) {
            event.preventDefault();
            mainWindow.hide();

            // CORRECCIÓN BUG #5: Simplificar lógica y solo verificar una vez
            if (!tray) {
                createTray();
            }
        }
    });

    mainWindow.on("close", (event) => {
        if (!app.isQuitting) {
            app.isQuitting = true;
        }

        cleanupPythonProcesses(true);

        currentToggleKeys.forEach((key) => {
            try {
                if (globalShortcut.isRegistered(key)) {
                    globalShortcut.unregister(key);
                }
            } catch (error) {
                console.error(
                    `Error unregistering shortcut ${key} on close:`,
                    error
                );
            }
        });
        currentToggleKeys = [];

        destroyTray();
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// Solicitar el lock de instancia única antes de inicializar
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // Ya existe otra instancia ejecutándose
    app.quit();
} else {
    // Esta es la primera instancia, configurar el manejador para instancias secundarias
    app.on("second-instance", (event, commandLine, workingDirectory) => {
        // Enfocar la ventana existente si existe
        if (mainWindow) {
            // Si está minimizada, restaurarla
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            // Si está oculta (minimizada a la bandeja), mostrarla
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }

            // Enfocar la ventana
            mainWindow.focus();
        }
    });

    // Inicializar la aplicación normalmente
    app.whenReady().then(() => {
        setupIpcHandlers();
        createWindow();

        app.on("activate", function () {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

// Variables para timeouts de cleanup (ahora es un Map para múltiples procesos)
let pythonProcessCleanupTimeouts = new Map();
let locateCleanupTimeout = null;

// Función para limpiar todos los procesos Python
function cleanupPythonProcesses(
    forceImmediate = false,
    emergencyShutdown = false
) {
    // Limpiar todos los timeouts previos si existen
    pythonProcessCleanupTimeouts.forEach((timeout, modeId) => {
        clearTimeout(timeout);
    });
    pythonProcessCleanupTimeouts.clear();

    if (pythonProcesses.size > 0) {
        const processesToKill = new Map(pythonProcesses);
        pythonProcesses.clear();

        processesToKill.forEach((process, modeId) => {
            try {
                process.stdout.removeAllListeners();
                process.stderr.removeAllListeners();
                process.removeAllListeners();

                if (forceImmediate || emergencyShutdown) {
                    if (emergencyShutdown) {
                        try {
                            process.kill("SIGKILL");
                        } catch (err) {
                            console.error(
                                `Error emergency-killing process ${modeId}:`,
                                err
                            );
                        }
                    } else {
                        try {
                            process.kill("SIGTERM");

                            setImmediate(() => {
                                try {
                                    if (process && !process.killed) {
                                        process.kill("SIGKILL");
                                    }
                                } catch (err) {}
                            });
                        } catch (err) {
                            console.error(
                                `Error force-killing process ${modeId}:`,
                                err
                            );
                            try {
                                process.kill("SIGKILL");
                            } catch (e) {}
                        }
                    }
                } else {
                    process.kill("SIGTERM");

                    const timeoutId = setTimeout(() => {
                        try {
                            if (process && !process.killed) {
                                process.kill("SIGKILL");
                            }
                        } catch (err) {
                            console.error(
                                `Error force-killing process ${modeId}:`,
                                err
                            );
                        }
                        pythonProcessCleanupTimeouts.delete(modeId);
                    }, 1000);

                    pythonProcessCleanupTimeouts.set(modeId, timeoutId);
                }
            } catch (err) {
                console.error(`Error killing process ${modeId}:`, err);
            }
        });
    }

    // Limpiar timeout previo de locate si existe
    if (locateCleanupTimeout) {
        clearTimeout(locateCleanupTimeout);
        locateCleanupTimeout = null;
    }

    if (locate) {
        try {
            // Remover listeners primero
            locate.stdout.removeAllListeners();
            locate.stderr.removeAllListeners();
            locate.removeAllListeners();

            // Guardar referencia local ANTES de null
            const processToKill = locate;
            locate = null; // Limpiar la global inmediatamente

            if (emergencyShutdown) {
                try {
                    processToKill.kill("SIGKILL");
                } catch (err) {
                    console.error("Error emergency-killing locate:", err);
                }
            } else if (forceImmediate) {
                try {
                    processToKill.kill("SIGTERM");

                    setImmediate(() => {
                        try {
                            if (processToKill && !processToKill.killed) {
                                processToKill.kill("SIGKILL");
                            }
                        } catch (err) {}
                    });
                } catch (err) {
                    console.error("Error force-killing locate:", err);
                    try {
                        processToKill.kill("SIGKILL");
                    } catch (e) {}
                }
            } else {
                // Comportamiento normal: SIGTERM con timeout de 1s para SIGKILL
                processToKill.kill("SIGTERM");

                locateCleanupTimeout = setTimeout(() => {
                    try {
                        // Verificar si el proceso aún existe antes de SIGKILL
                        if (processToKill && !processToKill.killed) {
                            processToKill.kill("SIGKILL");
                        }
                    } catch (err) {
                        console.error("Error force-killing locate:", err);
                    }
                    locateCleanupTimeout = null;
                }, 1000);
            }
        } catch (err) {
            console.error("Error killing locate:", err);
            locate = null;
        }
    }
}

// Variable para asegurar que la limpieza solo se haga una vez
let isCleaningUp = false;

/**
 * Función centralizada de limpieza final
 * @param {boolean} emergency - Si true, usa modo de emergencia (SIGKILL directo sin setImmediate)
 */
function performFinalCleanup(emergency = false) {
    if (isCleaningUp) {
        return;
    }
    isCleaningUp = true;

    if (
        pythonProcessCleanupTimeouts &&
        pythonProcessCleanupTimeouts instanceof Map
    ) {
        pythonProcessCleanupTimeouts.forEach((timeout, modeId) => {
            clearTimeout(timeout);
        });
        pythonProcessCleanupTimeouts.clear();
    }

    if (locateCleanupTimeout) {
        clearTimeout(locateCleanupTimeout);
        locateCleanupTimeout = null;
    }

    destroyTray();

    try {
        globalShortcut.unregisterAll();
    } catch (err) {
        console.error("Error unregistering shortcuts:", err);
    }

    cleanupPythonProcesses(true, emergency);
}

app.on("before-quit", () => {
    app.isQuitting = true;
});

app.on("will-quit", () => {
    performFinalCleanup();
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        if (!tray) {
            performFinalCleanup();
            app.quit();
        } else {
            if (mainWindow) {
                mainWindow = null;
            }
        }
    }
});

const signals = ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"];

signals.forEach((signal) => {
    process.on(signal, () => {
        app.isQuitting = true;
        performFinalCleanup(true);
        process.exit(0);
    });
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);

    try {
        performFinalCleanup(true);
    } catch (cleanupError) {
        console.error("Error during emergency cleanup:", cleanupError);
    }

    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection at:", promise, "reason:", reason);
});

// Made with 💗 by Hyper Light
