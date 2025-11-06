document.addEventListener("DOMContentLoaded", () => {
    let interval;
    let mode;
    let previous;
    let initialModes; // NUEVO: Estado inicial de modos al hacer Start
    let key;
    let pause;
    let pick;
    let ongoing;
    let w;
    let location = "";
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let selectedWindows;
    let time;
    let holdTime;
    let status = false;
    let errorMessageTimeout;
    let changes = 0;
    let flag = false;
    const flags = new Map();
    let index = 0;
    const values = ["L-click", "R-click", "M-click"];
    let click;
    let tooltipTimeout;
    let tooltipDiv = document.createElement("div");
    tooltipDiv.className = "tooltip";
    document.body.appendChild(tooltipDiv);

    const elements = {
        errorMessage: document.getElementById("error-message"),
        searchButton: document.getElementById("search-button"),
        refreshButton: document.getElementById("refresh-button"),
        closeButton: document.getElementById("close-button"),
        startButton: document.getElementById("start"),
        startLabel: document.getElementById("start-label"),
        startSvg: document.getElementById("start-svg"),
        searchSection: document.getElementById("search-section"),
        emptySection: document.getElementById("empty-section"),
        loadingSection: document.getElementById("loading-section"),
        windowList: document.getElementById("window-list"),
        scrollZone: document.getElementById("scroll-zone"),
        topSection: document.getElementById("top-section"),
        interval: document.getElementById("interval"),
        letter: document.getElementById("letter"),
        circle: document.getElementById("circle"),
        startBack: document.getElementById("start-back"),
        notice: document.getElementById("notice"),
        pauseButton: document.getElementById("pause-mode"),
        wButton: document.getElementById("w-button"),
        time: document.getElementById("time"),
        holdTime: document.getElementById("hold-time"),
        modeButtons: document.querySelectorAll(".mode-button"),
        clickModeButton: document.getElementById("click-mode"),
        moveModeButton: document.getElementById("move-mode"),
        passiveModeButton: document.getElementById("passive-mode"),
        keyModeButton: document.getElementById("key-mode"),
        locationButton: document.getElementById("location-button"),
        windowsLabel: document.getElementById("windows-label"),
        clicks: document.getElementById("click"),
        tooltipElements: document.querySelectorAll("[data-tooltip]"),
        externalButton: document.getElementById("external-button"),
        toggleKey: document.getElementById("toggle-key"),
        toggleExternalButton: document.getElementById("toggle-external-button"),
        trayToggle: document.getElementById("tray-toggle"),
    };

    // CRÍTICO: Función helper para limpiar lista de ventanas y sus listeners
    const clearWindowList = () => {
        // SEGURIDAD: Validar que windowList existe antes de limpiar
        if (!elements.windowList) {
            console.warn("windowList element not found");
            return;
        }
        // Limpiar completamente el contenedor
        // El garbage collector limpiará los event listeners cuando no haya referencias
        elements.windowList.innerHTML = "";
    };

    // CORREGIDO: Función helper para manejar la obtención y renderizado de ventanas
    // Movido desde preload.js para mantener separación de responsabilidades
    const fetchAndRenderWindowList = () => {
        window.electronAPI
            .getListOfWindows()
            .then((windows) => {
                // CRÍTICO: Validar que windows sea válido
                if (!windows || typeof windows !== "object") {
                    console.error("Invalid windows data received");
                    elements.loadingSection.style.display = "none";
                    elements.topSection.style.display = "block";
                    elements.emptySection.style.display = "flex";
                    elements.closeButton.disabled = false;
                    elements.refreshButton.disabled = false;
                    return;
                }

                // CRÍTICO: Usar función helper para limpiar listeners
                clearWindowList();

                // Manejar tanto el formato nuevo (objeto) como el antiguo (array)
                let windowsArray = [];
                if (typeof windows === "object" && !Array.isArray(windows)) {
                    // Formato nuevo: objeto con títulos e íconos
                    windowsArray = Object.entries(windows).filter(
                        ([title]) => title && typeof title === "string"
                    );
                } else if (Array.isArray(windows)) {
                    // Formato antiguo: array de títulos
                    windowsArray = windows
                        .filter(
                            (window) => window && typeof window === "string"
                        )
                        .map((title) => [title, null]);
                } else {
                    windowsArray = [];
                }

                if (windowsArray.length === 0) {
                    elements.loadingSection.style.display = "none";
                    elements.topSection.style.display = "block";
                    elements.emptySection.style.display = "flex";
                } else {
                    elements.windowsLabel.style.display = "block";
                    windowsArray.forEach(([title, iconBase64]) => {
                        const button = document.createElement("button");

                        // CRÍTICO: Validar que title sea string antes de usar
                        if (typeof title !== "string") {
                            return;
                        }

                        // Si hay ícono, crear estructura con ícono + texto
                        if (iconBase64 && typeof iconBase64 === "string") {
                            const icon = document.createElement("img");
                            icon.src = `data:image/png;base64,${iconBase64}`;
                            icon.className = "window-icon";
                            button.appendChild(icon);

                            const span = document.createElement("span");
                            span.textContent = title;
                            button.appendChild(span);
                        } else {
                            button.textContent = title;
                        }

                        button.addEventListener("click", () => {
                            button.classList.toggle("selected");
                        });
                        elements.windowList.appendChild(button);
                    });
                    elements.emptySection.style.display = "none";
                    elements.loadingSection.style.display = "none";
                    elements.topSection.style.display = "block";
                    elements.scrollZone.style.overflowY = "auto";
                }
                elements.closeButton.disabled = false;
                elements.refreshButton.disabled = false;
            })
            .catch((error) => {
                console.error("Error getting window list:", error);
                elements.loadingSection.style.display = "none";
                elements.topSection.style.display = "block";
                elements.emptySection.style.display = "flex";
                elements.closeButton.disabled = false;
                elements.refreshButton.disabled = false;
            });
    };

    elements.externalButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.electronAPI.openExternal(
            "https://github.com/IHyperLight/Keeptive#%EF%B8%8F-valid-keys-for-key-press-mode"
        );
    });

    elements.toggleExternalButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.electronAPI.openExternal(
            "https://github.com/IHyperLight/Keeptive#%EF%B8%8F-valid-keys-for-key-press-mode"
        );
    });

    const updateButtonState = (status) => {
        const activeStyle = status
            ? {
                  buttonText: `<rect width="400" height="400" rx="40" fill="url(#a)"/>
                        <defs>
                            <linearGradient id="a" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FF0000" />
                                <stop offset="1" stop-color="#FF9900" />
                            </linearGradient>
                        </defs>`,
                  startBack: "linear-gradient(120deg, #FF0000, #FF9900)",
                  circle: "linear-gradient(120deg, #00FF0A, #00FFC2)",
                  notice: "linear-gradient(90deg, #00FF0A, #00FF0A, #00FFC2)",
                  noticeText: "ON",
                  labelText: "Deactivate",
                  toolTip:
                      "Click here or press your toggle key to stop activation",
              }
            : {
                  buttonText: `<path
                            d="M383.592 226.744c21.877-11.119 21.877-42.37 0-53.488L43.592.453A32 32 0 0 0 42.664 0H17.33C7.358 4.67 0 14.706 0 27.197v345.606C0 385.294 7.358 395.331 17.33 400h25.333q.465-.217.93-.453z"
                            fill="url(#a)" />
                        <defs>
                            <linearGradient id="a" x1="0" y1="0" x2="350" y2="200" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#00FF0A" />
                                <stop offset="1" stop-color="#00FFC2" />
                            </linearGradient>
                        </defs>`,
                  startBack: "linear-gradient(120deg, #00FF0A, #00FFC2)",
                  circle: "linear-gradient(120deg, #FF0000, #FF9900)",
                  notice: "linear-gradient(90deg, #FF0000, #FF0000, #FF9900)",
                  noticeText: "OFF",
                  labelText: "Activate",
                  toolTip:
                      "Click here or press your toggle key to start activation",
              };

        elements.startButton.setAttribute("data-tooltip", activeStyle.toolTip);
        elements.startSvg.innerHTML = activeStyle.buttonText;
        elements.startBack.style.background = activeStyle.startBack;
        elements.circle.style.background = activeStyle.circle;
        elements.notice.style.background = activeStyle.notice;
        elements.notice.style.backgroundClip = "text";
        elements.notice.textContent = activeStyle.noticeText;
        elements.startLabel.textContent = activeStyle.labelText;

        // Actualizar el menú del tray
        window.electronAPI.updateTrayMenu();
    };

    elements.tooltipElements.forEach((element) => {
        const showTooltip = () => {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = setTimeout(() => {
                if (tooltipDiv.style.visibility === "visible") return;

                const tooltipText = element.getAttribute("data-tooltip");
                tooltipDiv.innerHTML = "";

                tooltipText.split("\\n").forEach((line) => {
                    const lineDiv = document.createElement("div");
                    lineDiv.textContent = line;
                    tooltipDiv.appendChild(lineDiv);
                });

                const rect = element.getBoundingClientRect();
                const tooltipTop = rect.bottom + 10;

                // CORRECCIÓN: Para el botón tray en modo desktop, alinear a la derecha
                let tooltipLeft;
                const isMobileView = window.innerWidth < 800;

                if (element.id === "tray-toggle" && !isMobileView) {
                    // Modo desktop: Alinear tooltip a la derecha del botón
                    tooltipLeft = rect.right;
                    tooltipDiv.style.transform = "translateX(-100%)";
                } else {
                    // Modo móvil o cualquier otro botón: Centrar tooltip normalmente
                    tooltipLeft = rect.left + rect.width / 2;
                    tooltipDiv.style.transform = "translateX(-50%)";
                }

                // Asegurar que el tooltip no salga de la pantalla
                tooltipDiv.style.top = `${tooltipTop}px`;
                tooltipDiv.style.left = `${tooltipLeft}px`;

                tooltipDiv.style.visibility = "visible";
                tooltipDiv.style.opacity = "1";
            }, 1000);
        };

        const hideTooltip = () => {
            clearTimeout(tooltipTimeout);
            tooltipDiv.style.visibility = "hidden";
            tooltipDiv.style.opacity = "0";
        };

        const resetTooltip = () => {
            hideTooltip();
            showTooltip();
        };

        element.addEventListener("mouseenter", showTooltip);
        element.addEventListener("mouseleave", hideTooltip);
        element.addEventListener("wheel", hideTooltip, { passive: true });
        element.addEventListener("click", () => {
            hideTooltip();
            element.addEventListener("mousemove", resetTooltip, { once: true });
        });
    });

    const resetChangeFade = () => {
        flag = false;
        flags.clear();
        changes = 0;
        // NOTA: NO limpiar initialModes aquí, se limpia solo cuando se detiene el proceso

        // SEGURIDAD: Validar que el elemento existe
        if (elements.errorMessage) {
            elements.errorMessage.classList.add("fade-out");
        }
    };

    const displayChangeMessage = () => {
        // SEGURIDAD: Validar que el elemento existe
        if (!elements.errorMessage) {
            console.error("Error message element not found");
            return;
        }

        if (changes === 1) {
            elements.errorMessage.textContent = `Configuration changed. Stop and restart to apply changes`;
        } else {
            elements.errorMessage.textContent = `${changes} configuration changes detected. Stop and restart to apply`;
        }
        elements.errorMessage.style.color = "#FF9900";
        elements.errorMessage.classList.remove("fade-out");
    };

    const handleChange = (
        element,
        value,
        wildcard = null,
        initialValue = null,
        isModesArray = false
    ) => {
        let newValue;

        if (element.tagName === "INPUT") {
            newValue = element.value;
        } else if (element.tagName === "BUTTON") {
            newValue = element.classList.contains("active");
        } else {
            newValue = element;
        }

        // CORREGIDO: Crear identificador único para arrays
        let access;
        if (Array.isArray(newValue)) {
            // Para arrays, usar el flag explícito para identificar el tipo
            if (isModesArray) {
                access = "array-modes"; // Array de modos de activación
            } else {
                access = "array-windows"; // Array de ventanas seleccionadas
            }
        } else {
            access = element.id;
        }

        let restriction = flags.get(access) || false;

        if (Array.isArray(newValue)) {
            // NUEVO: Comparar con el estado INICIAL (el que había al hacer Start)
            // en lugar de con el estado previo inmediato
            const compareValue = initialValue !== null ? initialValue : value;

            // CORREGIDO: Comparar arrays ignorando el orden (comparar contenido)
            const arraysAreEqual = (() => {
                if (!Array.isArray(compareValue)) return false;
                if (compareValue.length !== newValue.length) return false;

                // Crear copias ordenadas para comparar sin importar el orden
                const sortedCompare = [...compareValue]
                    .map((v) => v.trim())
                    .sort();
                const sortedNew = [...newValue].map((v) => v.trim()).sort();

                return sortedCompare.every(
                    (elem, index) => elem === sortedNew[index]
                );
            })();

            if (arraysAreEqual) {
                // Arrays son iguales al estado inicial, revertir cambio si había uno
                if (restriction) {
                    changes--;
                    restriction = false;
                    flags.set(access, restriction);
                    if (changes === 0) {
                        resetChangeFade();
                    } else {
                        displayChangeMessage();
                    }
                }
            } else {
                // Arrays son diferentes del estado inicial, registrar cambio
                if (!restriction) {
                    changes++;
                    restriction = true;
                    flags.set(access, restriction);
                    displayChangeMessage();
                }
            }
        } else {
            if (newValue !== value) {
                if (wildcard !== null) {
                    if (value === wildcard) {
                        changes++;
                        displayChangeMessage();
                    }
                } else {
                    if (!restriction) {
                        changes++;
                        restriction = true;
                        flags.set(access, restriction);
                        displayChangeMessage();
                    }
                }
            } else {
                if (changes > 0 && restriction) {
                    changes--;
                }
                restriction = false;
                flags.set(access, restriction);
                if (changes === 0) {
                    resetChangeFade();
                } else {
                    displayChangeMessage();
                }
            }
        }
    };

    const stop = () => {
        return window.electronAPI
            .isRunning()
            .then((isRunning) => {
                if (isRunning) {
                    return window.electronAPI
                        .stop()
                        .then((response) => {
                            if (response === "stopped") {
                                status = false;
                                resetChangeFade();
                                updateButtonState(status);
                                // NUEVO: Limpiar estado inicial al detener
                                initialModes = undefined;
                            }
                            return response;
                        })
                        .catch((error) => {
                            console.error("Error stopping process:", error);
                            return "error";
                        });
                }
                return "already-stopped";
            })
            .catch((error) => {
                console.error("Error checking if running:", error);
                return "error";
            });
    };

    const getMode = () => {
        // NUEVO: Retorna array de todos los modos activos
        const activeButtons = document.querySelectorAll(".mode-button.active");
        const modes = [];

        activeButtons.forEach((button) => {
            switch (button.id) {
                case "move-mode":
                    modes.push("move");
                    break;
                case "click-mode":
                    modes.push("click");
                    break;
                case "passive-mode":
                    modes.push("passive");
                    break;
                case "key-mode":
                    // CRÍTICO: Usar trim() para evitar keys vacías o solo espacios
                    const keyValue = elements.letter.value.trim();
                    if (keyValue) {
                        modes.push(keyValue);
                    }
                    break;
            }
        });

        // CORREGIDO: Retornar una copia para prevenir modificaciones externas
        return [...modes];
    };

    const triggerErrorFade = () => {
        // SEGURIDAD: Validar que el elemento existe antes de crear timeout
        if (!elements.errorMessage) {
            return;
        }

        errorMessageTimeout = setTimeout(() => {
            // SEGURIDAD: Validar de nuevo al ejecutar el timeout (podría haberse eliminado)
            if (elements.errorMessage) {
                elements.errorMessage.classList.add("fade-out");
            }
        }, 6000);
    };

    const displayErrorMessage = (message) => {
        // SEGURIDAD: Validar que el elemento existe
        if (!elements.errorMessage) {
            console.error("Error message element not found");
            return;
        }

        // Truncar mensaje si es muy largo para evitar desbordamiento visual
        const maxLength = 200;
        const displayMessage =
            message.length > maxLength
                ? message.substring(0, maxLength) + "..."
                : message;

        elements.errorMessage.textContent = displayMessage;
        clearTimeout(errorMessageTimeout);
        elements.errorMessage.style.color = "#FF0000";
        elements.errorMessage.classList.remove("fade-out");
        triggerErrorFade();
    };

    const handleError = (event, message) => {
        const error = new TextDecoder().decode(message);
        displayErrorMessage(error);
        status = false;
        updateButtonState(status);
    };

    const handleListRefresh = () => {
        elements.refreshButton.disabled = true;
        elements.closeButton.disabled = true;
        clearWindowList(); // CRÍTICO: Limpiar listeners antes de renderizar
        elements.windowsLabel.style.display = "none";
        elements.emptySection.style.display = "none";
        elements.scrollZone.style.overflowY = "hidden";
        elements.loadingSection.style.display = "flex";
        fetchAndRenderWindowList(); // CORREGIDO: Usar función helper
        stop();
    };

    const handleClose = () => {
        elements.windowsLabel.style.display = "none";
        elements.emptySection.style.display = "none";
        elements.searchSection.style.display = "flex";
        elements.topSection.style.display = "none";
        elements.loadingSection.style.display = "none";
        clearWindowList(); // CRÍTICO: Limpiar listeners antes de cerrar
        elements.scrollZone.style.overflowY = "hidden";
        stop();
    };

    const trackCursor = async () => {
        try {
            location = await window.electronAPI.getLocation();

            // CRÍTICO: Validar que location tenga formato válido "x,y"
            if (typeof location !== "string" || !location.includes(",")) {
                throw new Error("Invalid location format received");
            }

            // Validar que sean coordenadas numéricas válidas
            const coords = location.split(",").map(Number);
            if (coords.length !== 2 || coords.some(isNaN)) {
                throw new Error("Invalid coordinates in location");
            }

            window.electronAPI.restoreWindow();
        } catch (error) {
            console.error("Error tracking cursor:", error);
            location = "";
            window.electronAPI.restoreWindow();
            elements.locationButton.classList.remove("stand");
            displayErrorMessage("Failed to get location. Please try again.");
        }
    };

    // PROTECCIÓN: Variable para prevenir detención accidental inmediata
    let startProtectionActive = false;
    let startProtectionTimeout = null;

    // Función auxiliar para mostrar error y abrir ventana si viene del tray
    const showErrorAndOpenWindow = (errorMessage, fromExternalTrigger) => {
        displayErrorMessage(errorMessage);

        // Si viene del tray/shortcut, abrir y enfocar la ventana
        if (fromExternalTrigger) {
            // CRÍTICO: Usar setTimeout para asegurar que el mensaje de error se renderiza primero
            setTimeout(() => {
                window.electronAPI.restoreWindow();
            }, 50);
        }
    };

    const handleStartClick = (fromExternalTrigger = false) => {
        let commands = []; // ACTUALIZADO: Array de comandos para múltiples modos
        if (!status) {
            interval = elements.interval.value;
            const modes = getMode(); // ACTUALIZADO: Ahora retorna array
            previous = [...modes]; // CORREGIDO: Crear copia del array para evitar reference leak
            initialModes = [...modes]; // NUEVO: Guardar estado inicial para comparaciones
            key = elements.letter.value;
            pause = elements.pauseButton.classList.contains("active");
            pick = elements.locationButton.classList.contains("active");
            ongoing = elements.locationButton.classList.contains("stand");
            w = elements.wButton.classList.contains("active");
            selectedWindows = [
                ...document.querySelectorAll("#window-list button.selected"),
            ].map((button) => button.textContent.trim());
            time = elements.time.value;
            holdTime = elements.holdTime.value;
            click = elements.clicks.value;

            if (!status) {
                // NUEVO: Validar que haya al menos un modo seleccionado
                if (modes.length === 0) {
                    showErrorAndOpenWindow(
                        "Select at least one activation mode to start",
                        fromExternalTrigger
                    );
                    return;
                }

                if (ongoing) {
                    showErrorAndOpenWindow(
                        "Pick a location or deselect the option before starting",
                        fromExternalTrigger
                    );
                    return;
                }

                // ACTUALIZADO: Validar cada modo individualmente
                const hasKeyMode = modes.some(
                    (m) => !["click", "move", "passive"].includes(m)
                );
                const hasClickMode = modes.includes("click");
                const hasMoveMode = modes.includes("move");
                const hasPassiveMode = modes.includes("passive");

                if (hasKeyMode && (!key || key.trim() === "")) {
                    showErrorAndOpenWindow(
                        "Enter a key to use the key mode",
                        fromExternalTrigger
                    );
                    return;
                }

                // Validar que modos que requieren ventanas/sistema tengan selección
                const needsWindowSelection =
                    hasClickMode || hasMoveMode || hasKeyMode;
                if (
                    needsWindowSelection &&
                    selectedWindows.length === 0 &&
                    !w
                ) {
                    showErrorAndOpenWindow(
                        "Select at least one window or the entire system option",
                        fromExternalTrigger
                    );
                    return;
                }

                if (hasPassiveMode && selectedWindows.length === 0) {
                    showErrorAndOpenWindow(
                        "Select at least one window to use the passive mode",
                        fromExternalTrigger
                    );
                    return;
                }

                if (!interval || interval === "") {
                    showErrorAndOpenWindow(
                        "Enter an interval value in seconds",
                        fromExternalTrigger
                    );
                    return;
                }

                const intervalNum = parseFloat(interval);
                if (
                    isNaN(intervalNum) ||
                    !isFinite(intervalNum) ||
                    intervalNum <= 0
                ) {
                    showErrorAndOpenWindow(
                        "Enter a valid interval greater than zero",
                        fromExternalTrigger
                    );
                    return;
                }

                if (time && time !== "") {
                    const timeNum = parseFloat(time);
                    if (isNaN(timeNum) || !isFinite(timeNum) || timeNum <= 0) {
                        showErrorAndOpenWindow(
                            "Enter a valid time value greater than zero",
                            fromExternalTrigger
                        );
                        return;
                    }
                }

                if (w && hasClickMode && (holdTime === "" || !holdTime)) {
                    showErrorAndOpenWindow(
                        "Enter a hold time value in milliseconds for system mode",
                        fromExternalTrigger
                    );
                    return;
                }

                // CRÍTICO: Validar holdTime siempre que tenga valor, no solo en modo sistema
                if (holdTime && holdTime !== "") {
                    const holdTimeNum = parseFloat(holdTime);
                    if (
                        isNaN(holdTimeNum) ||
                        !isFinite(holdTimeNum) ||
                        holdTimeNum <= 0
                    ) {
                        showErrorAndOpenWindow(
                            "Enter a valid hold time greater than zero",
                            fromExternalTrigger
                        );
                        return;
                    }
                }
            }

            const windowsList = selectedWindows
                .map((window) => window.replace(/\r$/, ""))
                .join(", ");

            // ACTUALIZADO: Generar un comando por cada modo activo
            modes.forEach((modeValue) => {
                const command = [
                    modeValue, // Puede ser "click", "move", "passive", o la key específica
                    pause,
                    interval,
                    time,
                    location ? location : "",
                    click,
                    holdTime ? holdTime : "1",
                    w ? "" : windowsList,
                ];

                // Identificar el modo para el modeId
                let modeId;
                if (["click", "move", "passive"].includes(modeValue)) {
                    modeId = modeValue;
                } else {
                    // Es key mode, usar como modeId "key"
                    modeId = "key";
                }

                commands.push({ modeId, command });
            });
        }

        window.electronAPI
            .isRunning()
            .then((isRunning) => {
                if (isRunning) {
                    if (startProtectionActive) {
                        return;
                    }

                    // Detener: Usar el método stop dedicado
                    window.electronAPI
                        .stopClicking()
                        .then((response) => {
                            if (response === "stopped") {
                                status = false;
                                resetChangeFade();
                                updateButtonState(status);
                            }
                        })
                        .catch((error) => {
                            console.error("Error stopping process:", error);
                        });
                } else {
                    // Iniciar: Pasar array de comandos
                    window.electronAPI
                        .startClicking(commands)
                        .then((response) => {
                            if (response.startsWith("started")) {
                                status = true;
                                resetChangeFade();
                                updateButtonState(status);

                                // PROTECCIÓN: Activar protección temporal de 800ms
                                startProtectionActive = true;
                                elements.startButton.classList.add(
                                    "start-protected"
                                );

                                // Limpiar timeout anterior si existe
                                if (startProtectionTimeout) {
                                    clearTimeout(startProtectionTimeout);
                                }

                                // Desactivar protección después de 800ms
                                startProtectionTimeout = setTimeout(() => {
                                    startProtectionActive = false;
                                    elements.startButton.classList.remove(
                                        "start-protected"
                                    );
                                    startProtectionTimeout = null;
                                }, 800);
                            }
                        })
                        .catch((error) => {
                            console.error("Error starting process:", error);
                            // Mostrar error y abrir ventana si viene del tray
                            showErrorAndOpenWindow(
                                "Failed to start process. Please check the configuration.",
                                fromExternalTrigger
                            );
                        });
                }
            })
            .catch((error) => {
                console.error("Error checking if running:", error);
                // Mostrar error y abrir ventana si viene del tray
                showErrorAndOpenWindow(
                    "Failed to check process status. Please try again.",
                    fromExternalTrigger
                );
            });
    };

    // CRÍTICO: Guardar función de cleanup del listener activateKey
    const removeActivateKeyListener = window.electronAPI.activateKey(() => {
        // Llamar con flag indicando que viene del tray/shortcut
        handleStartClick(true);
    });

    // Función para actualizar el estado del holdTime
    const updateHoldTimeState = () => {
        const isWActive = elements.wButton.classList.contains("active");
        const isClickModeActive =
            elements.clickModeButton.classList.contains("active");
        const isWDisabled = elements.wButton.disabled;

        // Hold time solo disponible cuando w-button está activo Y click-mode está activo
        if (isWActive && isClickModeActive && !isWDisabled) {
            elements.holdTime.disabled = false;
        } else {
            elements.holdTime.disabled = true;
        }
    };

    // NUEVO: Función para actualizar estado de location-button basado en modos activos
    const updateLocationButtonState = () => {
        const isKeyActive = elements.keyModeButton.classList.contains("active");
        const isPassiveActive =
            elements.passiveModeButton.classList.contains("active");

        // Location se deshabilita si passive o key están activos
        if (isPassiveActive || isKeyActive) {
            elements.locationButton.disabled = true;
        } else {
            // Solo habilitar si no está ya en uso (active)
            if (!elements.locationButton.classList.contains("active")) {
                elements.locationButton.disabled = false;
            }
        }
    };

    // NUEVO: Función para actualizar estado de w-button basado en modos activos
    const updateWButtonState = () => {
        const isPassiveActive =
            elements.passiveModeButton.classList.contains("active");

        // W-button se deshabilita si passive está activo
        if (isPassiveActive) {
            elements.wButton.disabled = true;
        } else {
            elements.wButton.disabled = false;
        }
    };

    // NUEVO: Función para actualizar el contador de modos activos
    const updateActiveModeCounter = () => {
        const activeCount = document.querySelectorAll(
            ".mode-button.active"
        ).length;
        const counter = document.getElementById("active-modes-counter");
        if (counter) {
            counter.textContent = `${activeCount} active`;
            // Cambiar color a rojo si no hay modos activos
            if (activeCount === 0) {
                counter.style.color = "#FF0000";
                counter.style.textShadow = "0px 0px 15px rgba(255, 0, 0, 0.5)";
            } else {
                counter.style.color = "#00FFC2";
                counter.style.textShadow =
                    "0px 0px 15px rgba(0, 255, 194, 0.5)";
            }
        }
    };

    const observer1 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (
                mutation.attributeName === "class" ||
                mutation.attributeName === "disabled"
            ) {
                if (elements.wButton.classList.contains("active")) {
                    if (elements.wButton.disabled) {
                        elements.pauseButton.disabled = false;
                    } else {
                        elements.pauseButton.disabled = true;
                    }
                } else {
                    elements.pauseButton.disabled = false;
                }
                updateHoldTimeState();
            }
        }
    });
    observer1.observe(elements.wButton, { attributes: true });

    const observer2 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === "class") {
                // ACTUALIZADO: Habilitar/deshabilitar inputs de key-mode
                const isKeyActive =
                    elements.keyModeButton.classList.contains("active");
                elements.letter.disabled = !isKeyActive;
                elements.externalButton.disabled = !isKeyActive;

                // Actualizar estado de location-button
                updateLocationButtonState();

                // Actualizar contador
                updateActiveModeCounter();
            }
        }
    });
    observer2.observe(elements.keyModeButton, { attributes: true });

    const observer3 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === "class") {
                // ACTUALIZADO: Usar funciones centralizadas
                updateWButtonState();
                updateLocationButtonState();

                // Actualizar contador
                updateActiveModeCounter();
            }
        }
    });
    observer3.observe(elements.passiveModeButton, { attributes: true });

    const observer4 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === "class") {
                // ACTUALIZADO: El selector de clicks se habilita cuando click-mode está activo
                const isClickActive =
                    elements.clickModeButton.classList.contains("active");
                elements.clicks.disabled = !isClickActive;
                updateHoldTimeState();

                // Actualizar contador
                updateActiveModeCounter();
            }
        }
    });
    observer4.observe(elements.clickModeButton, { attributes: true });

    // NUEVO: Observer para move-mode para actualizar contador
    const observer5 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === "class") {
                // Actualizar contador
                updateActiveModeCounter();
            }
        }
    });
    observer5.observe(elements.moveModeButton, { attributes: true });

    // CORREGIDO: Consolidar listeners de modeButtons en un solo lugar
    elements.clickModeButton.addEventListener("click", () => {
        selectMode("click-mode");
        // Si está corriendo, detectar cambio
        if (status) {
            const current = getMode();
            // CORREGIDO: Pasar initialModes para comparar con estado inicial
            handleChange(current, previous, null, initialModes, true);
            previous = [...current];
        }
    });

    elements.moveModeButton.addEventListener("click", () => {
        selectMode("move-mode");
        // Si está corriendo, detectar cambio
        if (status) {
            const current = getMode();
            // CORREGIDO: Pasar initialModes para comparar con estado inicial
            handleChange(current, previous, null, initialModes, true);
            previous = [...current];
        }
    });

    elements.passiveModeButton.addEventListener("click", () => {
        selectMode("passive-mode");
        // Si está corriendo, detectar cambio
        if (status) {
            const current = getMode();
            // CORREGIDO: Pasar initialModes para comparar con estado inicial
            handleChange(current, previous, null, initialModes, true);
            previous = [...current];
        }
    });

    elements.keyModeButton.addEventListener("click", () => {
        selectMode("key-mode");
        // Si está corriendo, detectar cambio
        if (status) {
            const current = getMode();
            // CORREGIDO: Pasar initialModes para comparar con estado inicial
            handleChange(current, previous, null, initialModes, true);
            previous = [...current];
        }
    });

    elements.interval.addEventListener("change", () => {
        if (status) {
            handleChange(elements.interval, interval);
        }
    });

    elements.interval.addEventListener("input", function () {
        const originalValue = this.value;
        const cursorPosition = this.selectionStart;
        let value = originalValue;

        // Solo permitir dígitos (0-9) y punto decimal
        value = value.replace(/[^\d.]/g, "");

        // Prevenir múltiples puntos - solo el primero es válido
        const firstDot = value.indexOf(".");
        if (firstDot !== -1) {
            value =
                value.substring(0, firstDot + 1) +
                value.substring(firstDot + 1).replace(/\./g, "");
        }

        // Limitar a 6 dígitos enteros y 3 decimales (formato: 999999.999)
        const parts = value.split(".");
        if (parts[0].length > 6) {
            value =
                parts[0].slice(0, 6) +
                (parts[1] !== undefined ? "." + parts[1] : "");
        }
        if (parts[1] && parts[1].length > 3) {
            value = parts[0] + "." + parts[1].slice(0, 3);
        }

        // Solo actualizar si el valor cambió
        if (value !== originalValue) {
            this.value = value;
            // Ajustar posición del cursor basándose en caracteres eliminados
            const removedChars = originalValue.length - value.length;
            const newCursorPosition = Math.max(
                0,
                cursorPosition - removedChars
            );
            this.setSelectionRange(newCursorPosition, newCursorPosition);
        }
    });

    elements.interval.addEventListener("wheel", function (event) {
        event.preventDefault();

        const step = 1;
        const currentValue = parseFloat(this.value);
        const isValidNumber = !isNaN(currentValue) && isFinite(currentValue);

        function getDecimalCount(value) {
            if (Math.floor(value) === value) return 0;
            return value.toString().split(".")[1]?.length || 0;
        }

        const decimalCount = isValidNumber ? getDecimalCount(currentValue) : 0;
        const maxLimit = 999999;

        if (event.deltaY < 0) {
            const baseValue = isValidNumber ? currentValue : 0;
            const newValue = baseValue + step;
            if (newValue > maxLimit) {
                this.value = maxLimit.toFixed(0);
            } else {
                this.value = newValue.toFixed(decimalCount);
            }
        } else {
            if (isValidNumber && currentValue > 0) {
                const newValue = currentValue - step;
                if (newValue <= 0) {
                    this.value = "";
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            }
        }
    });

    elements.interval.addEventListener("keydown", function (event) {
        // Permitir: Backspace, Delete, Tab, Escape, Enter, flechas, Home, End
        const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
        ];

        // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        if (event.ctrlKey || event.metaKey) {
            if (["a", "c", "v", "x", "z"].includes(event.key.toLowerCase())) {
                return; // Permitir shortcuts
            }
        }

        // Si es una tecla permitida, continuar con la lógica original
        if (allowedKeys.includes(event.key)) {
            const step = 1;
            const currentValue = parseFloat(this.value);
            const isValidNumber =
                !isNaN(currentValue) && isFinite(currentValue);

            function getDecimalCount(value) {
                if (Math.floor(value) === value) return 0;
                return value.toString().split(".")[1]?.length || 0;
            }

            const decimalCount = isValidNumber
                ? getDecimalCount(currentValue)
                : 0;
            const maxLimit = 999999;

            if (event.key === "ArrowUp") {
                event.preventDefault();
                const baseValue = isValidNumber ? currentValue : 0;
                const newValue = baseValue + step;
                if (newValue > maxLimit) {
                    this.value = maxLimit.toFixed(0);
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (isValidNumber && currentValue > 0) {
                    const newValue = currentValue - step;
                    if (newValue <= 0) {
                        this.value = "";
                    } else {
                        this.value = newValue.toFixed(decimalCount);
                    }
                }
            }
            return; // Salir para las teclas permitidas
        }

        // Solo permitir dígitos (0-9) y punto decimal
        const isDigit = /^\d$/.test(event.key);
        const isDot = event.key === ".";

        // Si no es dígito ni punto, bloquear
        if (!isDigit && !isDot) {
            event.preventDefault();
            return;
        }

        // Si es punto, verificar que no haya otro punto ya
        if (isDot && this.value.includes(".")) {
            event.preventDefault();
            return;
        }
    });

    elements.letter.addEventListener("change", () => {
        if (status) {
            handleChange(elements.letter, key);
        }
    });

    elements.letter.addEventListener("input", () => {
        // Permitir múltiples keys separadas por espacio
        // Normalizar múltiples espacios a uno solo
        elements.letter.value = elements.letter.value.replace(/\s+/g, " ");
    });

    elements.toggleKey.addEventListener("input", () => {
        // Permitir múltiples keys separadas por espacio
        // Normalizar múltiples espacios a uno solo
        elements.toggleKey.value = elements.toggleKey.value.replace(
            /\s+/g,
            " "
        );

        // SIEMPRE registrar los shortcuts, incluso si está vacío (para limpiar)
        const keysValue = elements.toggleKey.value.trim();
        window.electronAPI.registerToggleKeys(keysValue);
    });

    elements.time.addEventListener("change", () => {
        if (status) {
            handleChange(elements.time, time);
        }
    });

    elements.time.addEventListener("input", function () {
        const originalValue = this.value;
        const cursorPosition = this.selectionStart;
        let value = originalValue;

        // Solo permitir dígitos (0-9) y punto decimal
        value = value.replace(/[^\d.]/g, "");

        // Prevenir múltiples puntos - solo el primero es válido
        const firstDot = value.indexOf(".");
        if (firstDot !== -1) {
            value =
                value.substring(0, firstDot + 1) +
                value.substring(firstDot + 1).replace(/\./g, "");
        }

        // Limitar a 6 dígitos enteros y 3 decimales (formato: 999999.999)
        const parts = value.split(".");
        if (parts[0].length > 6) {
            value =
                parts[0].slice(0, 6) +
                (parts[1] !== undefined ? "." + parts[1] : "");
        }
        if (parts[1] && parts[1].length > 3) {
            value = parts[0] + "." + parts[1].slice(0, 3);
        }

        // Solo actualizar si el valor cambió
        if (value !== originalValue) {
            this.value = value;
            // Ajustar posición del cursor basándose en caracteres eliminados
            const removedChars = originalValue.length - value.length;
            const newCursorPosition = Math.max(
                0,
                cursorPosition - removedChars
            );
            this.setSelectionRange(newCursorPosition, newCursorPosition);
        }
    });

    elements.time.addEventListener("wheel", function (event) {
        event.preventDefault();

        const step = 1;
        const currentValue = parseFloat(this.value);
        const isValidNumber = !isNaN(currentValue) && isFinite(currentValue);

        function getDecimalCount(value) {
            if (Math.floor(value) === value) return 0;
            return value.toString().split(".")[1]?.length || 0;
        }

        const decimalCount = isValidNumber ? getDecimalCount(currentValue) : 0;
        const maxLimit = 999999;

        if (event.deltaY < 0) {
            const baseValue = isValidNumber ? currentValue : 0;
            const newValue = baseValue + step;
            if (newValue > maxLimit) {
                this.value = maxLimit.toFixed(0);
            } else {
                this.value = newValue.toFixed(decimalCount);
            }
        } else {
            if (isValidNumber && currentValue > 0) {
                const newValue = currentValue - step;
                if (newValue <= 0) {
                    this.value = "";
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            }
        }
    });

    elements.time.addEventListener("keydown", function (event) {
        // Permitir: Backspace, Delete, Tab, Escape, Enter, flechas, Home, End
        const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
        ];

        // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        if (event.ctrlKey || event.metaKey) {
            if (["a", "c", "v", "x", "z"].includes(event.key.toLowerCase())) {
                return; // Permitir shortcuts
            }
        }

        // Si es una tecla permitida, continuar con la lógica original
        if (allowedKeys.includes(event.key)) {
            const step = 1;
            const currentValue = parseFloat(this.value);
            const isValidNumber =
                !isNaN(currentValue) && isFinite(currentValue);

            function getDecimalCount(value) {
                if (Math.floor(value) === value) return 0;
                return value.toString().split(".")[1]?.length || 0;
            }

            const decimalCount = isValidNumber
                ? getDecimalCount(currentValue)
                : 0;
            const maxLimit = 999999;

            if (event.key === "ArrowUp") {
                event.preventDefault();
                const baseValue = isValidNumber ? currentValue : 0;
                const newValue = baseValue + step;
                if (newValue > maxLimit) {
                    this.value = maxLimit.toFixed(0);
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (isValidNumber && currentValue > 0) {
                    const newValue = currentValue - step;
                    if (newValue <= 0) {
                        this.value = "";
                    } else {
                        this.value = newValue.toFixed(decimalCount);
                    }
                }
            }
            return; // Salir para las teclas permitidas
        }

        // Solo permitir dígitos (0-9) y punto decimal
        const isDigit = /^\d$/.test(event.key);
        const isDot = event.key === ".";

        // Si no es dígito ni punto, bloquear
        if (!isDigit && !isDot) {
            event.preventDefault();
            return;
        }

        // Si es punto, verificar que no haya otro punto ya
        if (isDot && this.value.includes(".")) {
            event.preventDefault();
            return;
        }
    });

    elements.holdTime.addEventListener("change", () => {
        if (status) {
            handleChange(elements.holdTime, holdTime);
        }
    });

    elements.holdTime.addEventListener("input", function () {
        const originalValue = this.value;
        const cursorPosition = this.selectionStart;
        let value = originalValue;

        // Solo permitir dígitos (0-9) y punto decimal
        value = value.replace(/[^\d.]/g, "");

        // Prevenir múltiples puntos - solo el primero es válido
        const firstDot = value.indexOf(".");
        if (firstDot !== -1) {
            value =
                value.substring(0, firstDot + 1) +
                value.substring(firstDot + 1).replace(/\./g, "");
        }

        // Limitar a 6 dígitos enteros y 3 decimales (formato: 999999.999)
        const parts = value.split(".");
        if (parts[0].length > 6) {
            value =
                parts[0].slice(0, 6) +
                (parts[1] !== undefined ? "." + parts[1] : "");
        }
        if (parts[1] && parts[1].length > 3) {
            value = parts[0] + "." + parts[1].slice(0, 3);
        }

        // Solo actualizar si el valor cambió
        if (value !== originalValue) {
            this.value = value;
            // Ajustar posición del cursor basándose en caracteres eliminados
            const removedChars = originalValue.length - value.length;
            const newCursorPosition = Math.max(
                0,
                cursorPosition - removedChars
            );
            this.setSelectionRange(newCursorPosition, newCursorPosition);
        }
    });

    elements.holdTime.addEventListener("wheel", function (event) {
        // No permitir cambios con scroll si el input está deshabilitado
        if (this.disabled) {
            return;
        }

        event.preventDefault();

        const step = 1;
        const currentValue = parseFloat(this.value);
        const isValidNumber = !isNaN(currentValue) && isFinite(currentValue);

        function getDecimalCount(value) {
            if (Math.floor(value) === value) return 0;
            return value.toString().split(".")[1]?.length || 0;
        }

        const decimalCount = isValidNumber ? getDecimalCount(currentValue) : 0;
        const maxLimit = 999999;

        if (event.deltaY < 0) {
            const baseValue = isValidNumber ? currentValue : 0;
            const newValue = baseValue + step;
            if (newValue > maxLimit) {
                this.value = maxLimit.toFixed(0);
            } else {
                this.value = newValue.toFixed(decimalCount);
            }
        } else {
            if (isValidNumber && currentValue > 0) {
                const newValue = currentValue - step;
                if (newValue <= 0) {
                    this.value = "";
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            }
        }
    });

    elements.holdTime.addEventListener("keydown", function (event) {
        // Permitir: Backspace, Delete, Tab, Escape, Enter, flechas, Home, End
        const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
        ];

        // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        if (event.ctrlKey || event.metaKey) {
            if (["a", "c", "v", "x", "z"].includes(event.key.toLowerCase())) {
                return; // Permitir shortcuts
            }
        }

        // Si es una tecla permitida, continuar con la lógica original
        if (allowedKeys.includes(event.key)) {
            const step = 1;
            const currentValue = parseFloat(this.value);
            const isValidNumber =
                !isNaN(currentValue) && isFinite(currentValue);

            function getDecimalCount(value) {
                if (Math.floor(value) === value) return 0;
                return value.toString().split(".")[1]?.length || 0;
            }

            const decimalCount = isValidNumber
                ? getDecimalCount(currentValue)
                : 0;
            const maxLimit = 999999;

            if (event.key === "ArrowUp") {
                event.preventDefault();
                const baseValue = isValidNumber ? currentValue : 0;
                const newValue = baseValue + step;
                if (newValue > maxLimit) {
                    this.value = maxLimit.toFixed(0);
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (isValidNumber && currentValue > 0) {
                    const newValue = currentValue - step;
                    if (newValue <= 0) {
                        this.value = "";
                    } else {
                        this.value = newValue.toFixed(decimalCount);
                    }
                }
            }
            return; // Salir para las teclas permitidas
        }

        // Solo permitir dígitos (0-9) y punto decimal
        const isDigit = /^\d$/.test(event.key);
        const isDot = event.key === ".";

        // Si no es dígito ni punto, bloquear
        if (!isDigit && !isDot) {
            event.preventDefault();
            return;
        }

        // Si es punto, verificar que no haya otro punto ya
        if (isDot && this.value.includes(".")) {
            event.preventDefault();
            return;
        }
    });

    // ELIMINADO: forEach de modeButtons (consolidado arriba en listeners individuales)

    elements.windowList.addEventListener("click", function (event) {
        if (event.target.tagName === "BUTTON") {
            if (status) {
                const currentSelection = [
                    ...document.querySelectorAll(
                        "#window-list button.selected"
                    ),
                ].map((button) => button.textContent.trim());
                handleChange(currentSelection, selectedWindows);
            }
        }
    });

    elements.pauseButton.addEventListener("click", () => {
        selectPause();
        if (status) {
            handleChange(elements.pauseButton, pause);
        }
    });

    elements.wButton.addEventListener("click", () => {
        selectW();
        if (status) {
            handleChange(elements.wButton, w);
        }
    });

    elements.searchButton.addEventListener("click", () => {
        elements.searchSection.style.display = "none";
        elements.loadingSection.style.display = "flex";
        elements.wButton.classList.remove("active");
        fetchAndRenderWindowList(); // CORREGIDO: Usar función helper
        stop();
    });

    elements.refreshButton.addEventListener("click", handleListRefresh);

    elements.closeButton.addEventListener("click", handleClose);

    elements.startButton.addEventListener("click", handleStartClick);

    // Guardar referencia para poder remover el listener después
    const f1KeyHandler = function (event) {
        if (event.key === "F1") {
            event.preventDefault();
            // F1 es una tecla de UI, no del tray, así que no abrir ventana en errores
            handleStartClick();
        }
    };
    document.addEventListener("keydown", f1KeyHandler);

    elements.locationButton.addEventListener("click", async () => {
        if (!elements.locationButton.classList.contains("active")) {
            if (!elements.locationButton.classList.contains("stand")) {
                elements.locationButton.classList.add("stand");
                elements.locationButton.setAttribute(
                    "data-tooltip",
                    `Waiting for your location pick . . .`
                );
                await trackCursor();

                // Verificar que obtuvimos coordenadas válidas
                if (location && location.includes(",")) {
                    const coords = location.split(",").map(Number);
                    if (
                        coords.length === 2 &&
                        !isNaN(coords[0]) &&
                        !isNaN(coords[1])
                    ) {
                        [px, py] = coords;
                        if (!status) {
                            [tx, ty] = [px, py];
                        }
                        elements.locationButton.setAttribute(
                            "data-tooltip",
                            `Picked location\\nX : ${px}, Y : ${py}`
                        );
                        elements.locationButton.classList.remove("stand");
                        elements.locationButton.classList.add("active");
                    } else {
                        // Coordenadas inválidas
                        location = "";
                        elements.locationButton.classList.remove("stand");
                        elements.locationButton.setAttribute(
                            "data-tooltip",
                            `Select to pick a specific location for mouse clicks mode and mouse movement mode.\\nDeselect to use the default location : the center of the window, or the current cursor position only if the entire system mode is selected`
                        );
                    }
                } else {
                    // No se obtuvieron coordenadas
                    elements.locationButton.classList.remove("stand");
                    elements.locationButton.setAttribute(
                        "data-tooltip",
                        `Select to pick a specific location for mouse clicks mode and mouse movement mode.\\nDeselect to use the default location : the center of the window, or the current cursor position only if the entire system mode is selected`
                    );
                }
            }
        } else {
            location = "";
            [px, py] = [0, 0];
            elements.locationButton.classList.remove("active");
            elements.locationButton.setAttribute(
                "data-tooltip",
                `Select to pick a specific location for mouse clicks mode and mouse movement mode.\\nDeselect to use the default location : the center of the window, or the current cursor position only if the entire system mode is selected`
            );
        }
        if (status) {
            if (
                pick &&
                pick === elements.locationButton.classList.contains("active") &&
                !(px === tx && py === ty)
            ) {
                handleChange(elements.locationButton, !pick);
            } else {
                handleChange(elements.locationButton, pick);
            }
        }
    });

    elements.clicks.addEventListener("click", () => {
        index = (index + 1) % values.length;
        elements.clicks.value = values[index];
        if (status) {
            handleChange(elements.clicks, click);
        }
    });

    elements.clicks.addEventListener("mousedown", (e) => {
        e.preventDefault();
    });

    // Guardar referencias a handlers para poder removerlos después
    const errorMessageHandler = handleError;
    const processTerminatedHandler = () => {
        status = false;
        updateButtonState(status);
        // NUEVO: Limpiar estado inicial cuando el proceso termina
        initialModes = undefined;
    };

    // CRÍTICO: Guardar funciones de cleanup de IPC listeners
    const removeErrorMessageListener = window.electronAPI.on(
        "error-message",
        errorMessageHandler
    );
    const removeProcessTerminatedListener = window.electronAPI.on(
        "process-terminated",
        processTerminatedHandler
    );

    // Cleanup al cerrar la ventana
    window.addEventListener("beforeunload", () => {
        // Desconectar observers inmediatamente
        observer1.disconnect();
        observer2.disconnect();
        observer3.disconnect();
        observer4.disconnect();
        observer5.disconnect(); // NUEVO: Desconectar observer5

        // Limpiar timeouts
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        if (errorMessageTimeout) {
            clearTimeout(errorMessageTimeout);
            errorMessageTimeout = null;
        }
        // PROTECCIÓN: Limpiar timeout de protección de inicio
        if (startProtectionTimeout) {
            clearTimeout(startProtectionTimeout);
            startProtectionTimeout = null;
        }
        startProtectionActive = false;
        if (elements.startButton) {
            elements.startButton.classList.remove("start-protected");
        }

        // Remover tooltip del DOM
        if (tooltipDiv && tooltipDiv.parentNode) {
            tooltipDiv.parentNode.removeChild(tooltipDiv);
            tooltipDiv = null;
        }

        // Remover el listener de F1
        document.removeEventListener("keydown", f1KeyHandler);

        // CRÍTICO: Remover listener de activateKey
        if (typeof removeActivateKeyListener === "function") {
            removeActivateKeyListener();
        }

        // CRÍTICO: Remover IPC listeners
        if (typeof removeErrorMessageListener === "function") {
            removeErrorMessageListener();
        }
        if (typeof removeProcessTerminatedListener === "function") {
            removeProcessTerminatedListener();
        }
    });
});

function selectMode(modeId) {
    const moveModeButton = document.getElementById("move-mode");
    const clickModeButton = document.getElementById("click-mode");
    const keyModeButton = document.getElementById("key-mode");
    const passiveModeButton = document.getElementById("passive-mode");

    // NUEVO: Sistema de toggle individual que permite múltiples modos activos
    const button = document.getElementById(modeId);

    if (button.classList.contains("active")) {
        // Si ya está activo, desactivar (permite 0 modos activos)
        button.classList.remove("active");
    } else {
        // Si no está activo, activar
        button.classList.add("active");
    }
}

function selectPause() {
    const pauseButton = document.getElementById("pause-mode");

    if (pauseButton.classList.contains("active")) {
        pauseButton.classList.remove("active");
    } else {
        pauseButton.classList.add("active");
    }
}

function selectW() {
    const wButton = document.getElementById("w-button");

    if (wButton.classList.contains("active")) {
        wButton.classList.remove("active");
    } else {
        wButton.classList.add("active");
    }
}

// Funcionalidad de Minimize to Tray
// CRÍTICO: Usar variable para evitar inicialización duplicada
let trayToggleInitialized = false;

document.addEventListener("DOMContentLoaded", () => {
    // Prevenir inicialización duplicada
    if (trayToggleInitialized) {
        return;
    }
    trayToggleInitialized = true;

    const trayToggle = document.getElementById("tray-toggle");

    if (!trayToggle) {
        console.error("Tray toggle element not found");
        return;
    }

    // CRÍTICO: Cargar el estado desde localStorage para persistencia
    const savedState = localStorage.getItem("minimizeToTray");
    const enabled = savedState === "true";

    // Aplicar el estado guardado al UI
    if (enabled) {
        trayToggle.classList.add("active");
        trayToggle.value = "ON";
        // Sincronizar con el proceso principal
        window.electronAPI.setMinimizeToTray(true);
    } else {
        trayToggle.classList.remove("active");
        trayToggle.value = "OFF";
        // Asegurar que el proceso principal también esté en OFF
        window.electronAPI.setMinimizeToTray(false);
    }

    // Manejar click en el toggle
    const handleTrayToggleClick = () => {
        const isActive = trayToggle.classList.contains("active");

        if (isActive) {
            // Desactivar
            trayToggle.classList.remove("active");
            trayToggle.value = "OFF";
            window.electronAPI.setMinimizeToTray(false);
            // CRÍTICO: Guardar estado en localStorage
            localStorage.setItem("minimizeToTray", "false");
        } else {
            // Activar
            trayToggle.classList.add("active");
            trayToggle.value = "ON";
            window.electronAPI.setMinimizeToTray(true);
            // CRÍTICO: Guardar estado en localStorage
            localStorage.setItem("minimizeToTray", "true");
        }
    };

    trayToggle.addEventListener("click", handleTrayToggleClick);

    // Prevenir selección de texto
    const handleMouseDown = (e) => {
        e.preventDefault();
    };

    trayToggle.addEventListener("mousedown", handleMouseDown);

    // CRÍTICO: Limpiar listeners al cerrar
    window.addEventListener("beforeunload", () => {
        if (trayToggle) {
            trayToggle.removeEventListener("click", handleTrayToggleClick);
            trayToggle.removeEventListener("mousedown", handleMouseDown);
        }
        trayToggleInitialized = false;
    });
});
