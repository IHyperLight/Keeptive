document.addEventListener('DOMContentLoaded', () => {
    let interval;
    let mode;
    let previous;
    let key;
    let pause;
    let pick;
    let ongoing;
    let w;
    let location = '';
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let selectedWindows;
    let time;
    let status = false;
    let errorMessageTimeout;
    let changes = 0;
    let flag = false;
    const flags = new Map();
    let index = 0;
    const values = ["L-click", "R-click", "M-click"];
    let click;
    let tooltipTimeout;
    let tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'tooltip';
    document.body.appendChild(tooltipDiv);

    const elements = {
        errorMessage: document.getElementById('error-message'),
        searchButton: document.getElementById('search-button'),
        refreshButton: document.getElementById('refresh-button'),
        closeButton: document.getElementById('close-button'),
        startButton: document.getElementById('start'),
        startSvg: document.getElementById('start-svg'),
        searchSection: document.getElementById('search-section'),
        emtpySection: document.getElementById('empty-section'),
        loadingSection: document.getElementById('loading-section'),
        windowList: document.getElementById('window-list'),
        scrollZone: document.getElementById('scroll-zone'),
        topSection: document.getElementById('top-section'),
        interval: document.getElementById('interval'),
        letter: document.getElementById('letter'),
        circle: document.getElementById('circle'),
        startBack: document.getElementById('start-back'),
        notice: document.getElementById('notice'),
        pauseButton: document.getElementById('pause-mode'),
        wButton: document.getElementById('w-button'),
        time: document.getElementById('time'),
        modeButtons: document.querySelectorAll('.mode-button'),
        clickModeButton: document.getElementById('click-mode'),
        moveModeButton: document.getElementById('move-mode'),
        passiveModeButton: document.getElementById('passive-mode'),
        keyModeButton: document.getElementById('key-mode'),
        locationButton: document.getElementById('location-button'),
        windowsLabel: document.getElementById('windows-label'),
        clicks: document.getElementById('click'),
        tooltipElements: document.querySelectorAll('[data-tooltip]'),
        externalButton: document.getElementById('external-button'),
    };

    elements.externalButton.onclick = function () {
        window.location.href = "https://github.com/IHyperLight/Keeptive#%EF%B8%8F-valid-keys-for-key-press-mode";
    };

    const updateButtonState = (status) => {
        const activeStyle = status ? {
            buttonText: `<rect width="400" height="400" rx="40" fill="url(#a)"/>
                        <defs>
                            <linearGradient id="a" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FF0000" />
                                <stop offset="1" stop-color="#FF9900" />
                            </linearGradient>
                        </defs>`,
            startBack: 'linear-gradient(120deg, #FF0000, #FF9900)',
            circle: 'linear-gradient(120deg, #00FF0A, #00FFC2)',
            notice: 'linear-gradient(90deg, #00FF0A, #00FF0A, #00FFC2)',
            noticeText: 'Active',
            toolTip: 'Press F6 or click to stop'
        } : {
            buttonText: `<path
                            d="M383.592 226.744c21.877-11.119 21.877-42.37 0-53.488L43.592.453A32 32 0 0 0 42.664 0H17.33C7.358 4.67 0 14.706 0 27.197v345.606C0 385.294 7.358 395.331 17.33 400h25.333q.465-.217.93-.453z"
                            fill="url(#a)" />
                        <defs>
                            <linearGradient id="a" x1="0" y1="0" x2="350" y2="200" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#00FF0A" />
                                <stop offset="1" stop-color="#00FFC2" />
                            </linearGradient>
                        </defs>`,
            startBack: 'linear-gradient(120deg, #00FF0A, #00FFC2)',
            circle: 'linear-gradient(120deg, #FF0000, #FF9900)',
            notice: 'linear-gradient(90deg, #FF0000, #FF0000, #FF9900)',
            noticeText: 'Inactive',
            toolTip: 'Press F6 or click to start'
        };

        elements.startButton.setAttribute('data-tooltip', activeStyle.toolTip);
        elements.startSvg.innerHTML = activeStyle.buttonText;
        elements.startBack.style.background = activeStyle.startBack;
        elements.circle.style.background = activeStyle.circle;
        elements.notice.style.background = activeStyle.notice;
        elements.notice.style.backgroundClip = 'text';
        elements.notice.textContent = activeStyle.noticeText;
    };

    elements.tooltipElements.forEach(element => {
        const showTooltip = () => {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = setTimeout(() => {
                if (tooltipDiv.style.visibility === 'visible') return;

                const tooltipText = element.getAttribute('data-tooltip');
                tooltipDiv.innerHTML = '';

                tooltipText.split('\\n').forEach(line => {
                    const lineDiv = document.createElement('div');
                    lineDiv.textContent = line;
                    tooltipDiv.appendChild(lineDiv);
                });

                const rect = element.getBoundingClientRect();
                tooltipDiv.style.top = `${rect.bottom + 10}px`;
                tooltipDiv.style.left = `${rect.left + (element.offsetWidth / 2) - (tooltipDiv.offsetWidth / 2)}px`;

                tooltipDiv.style.visibility = 'visible';
                tooltipDiv.style.opacity = '1';
            }, 1000);
        };

        const hideTooltip = () => {
            clearTimeout(tooltipTimeout);
            tooltipDiv.style.visibility = 'hidden';
            tooltipDiv.style.opacity = '0';
        };

        const resetTooltip = () => {
            showTooltip();
            element.removeEventListener('mousemove', resetTooltip);
        };

        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('wheel', hideTooltip);
        element.addEventListener('click', () => {
            hideTooltip();
            element.addEventListener('mousemove', resetTooltip);
        });
    });

    const resetChangeFade = () => {
        flag = false;
        flags.clear();
        changes = 0;
        elements.errorMessage.classList.add('fade-out');
    };

    const displayChangeMessage = () => {
        if (changes === 1) {
            elements.errorMessage.textContent = `A change has been made. Please stop and start again to apply it`;
        } else {
            elements.errorMessage.textContent = `${changes} changes have been made. Please stop and start again to apply them`;
        }
        elements.errorMessage.style.color = '#FF9900';
        elements.errorMessage.classList.remove('fade-out');
    };

    const handleChange = (element, value, wildcard = null) => {
        let newValue;

        if (element.tagName === 'INPUT') {
            newValue = element.value;
        } else if (element.tagName === 'BUTTON') {
            newValue = element.classList.contains('active');
        } else {
            newValue = element;
        }

        const access = element.id;
        let restriction = flags.get(access) || false;

        if (Array.isArray(newValue)) {
            if (value.length === newValue.length && value.every((element, index) => element === newValue[index])) {
                changes--;
                flag = false;
                if (changes === 0) {
                    resetChangeFade();
                } else {
                    displayChangeMessage();
                }
            } else {
                if (!flag) {
                    changes++;
                    flag = true;
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
                if (changes > 0) {
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
        window.electronAPI.isRunning().then(isRunning => {
            if (isRunning) {
                window.electronAPI.stop().then(response => {
                    if (response === 'stopped') {
                        status = false;
                        resetChangeFade();
                        updateButtonState(status);
                    }
                });
            }
        });
    };

    const getMode = () => {
        const active = document.querySelector('.mode-button.active');

        switch (active.id) {
            case 'move-mode':
                return 'move';
            case 'click-mode':
                return 'click';
            case 'passive-mode':
                return 'passive';
            default:
                return 'key';
        }
    };

    const triggerErrorFade = () => {
        errorMessageTimeout = setTimeout(() => {
            elements.errorMessage.classList.add('fade-out');
        }, 6000);
    };

    const displayErrorMessage = (message) => {
        elements.errorMessage.textContent = message;
        clearTimeout(errorMessageTimeout);
        elements.errorMessage.style.color = '#FF0000';
        elements.errorMessage.classList.remove('fade-out');
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
        elements.windowList.innerHTML = '';
        elements.windowsLabel.style.display = 'none';
        elements.emtpySection.style.display = 'none';
        elements.scrollZone.style.overflowY = 'hidden';
        elements.loadingSection.style.display = 'flex';
        window.electronAPI.getListOfWindows();
        stop();
    };

    const handleClose = () => {
        elements.windowsLabel.style.display = 'none';
        elements.emtpySection.style.display = 'none';
        elements.searchSection.style.display = 'flex';
        elements.topSection.style.display = 'none';
        elements.loadingSection.style.display = 'none';
        elements.windowList.innerHTML = '';
        elements.scrollZone.style.overflowY = 'hidden';
        stop();
    };

    const trackCursor = async () => {
        location = await window.electronAPI.getLocation();
        window.electronAPI.restoreWindow();
    };

    const handleStartClick = () => {
        let command = [];
        if (!status) {
            interval = elements.interval.value;
            mode = getMode();
            previous = mode;
            key = elements.letter.value;
            pause = elements.pauseButton.classList.contains('active');
            pick = elements.locationButton.classList.contains('active');
            ongoing = elements.locationButton.classList.contains('stand');
            w = elements.wButton.classList.contains('active');
            selectedWindows = [...document.querySelectorAll('#window-list button.selected')].map(button => button.textContent);
            time = elements.time.value;
            click = elements.clicks.value;

            if (!status) {
                if (ongoing) {
                    displayErrorMessage('Pick a location or deselect the option before starting');
                    return;
                }

                if (mode === 'key' && !key) {
                    displayErrorMessage('Enter a key to use the key mode');
                    return;
                }

                if ((mode === 'click' && selectedWindows.length === 0 && !w) || (mode === 'move' && selectedWindows.length === 0 && !w) || (mode === 'key' && selectedWindows.length === 0 && !w)) {
                    displayErrorMessage('Select at least one window or the entire system option');
                    return;
                }

                if (mode === 'passive' && selectedWindows.length === 0) {
                    displayErrorMessage('Select at least one window to use the passive mode');
                    return;
                }

                if (!interval) {
                    displayErrorMessage('Enter an interval value in seconds');
                    return;
                }

                if (interval <= 0) {
                    displayErrorMessage('Enter an interval greater than zero');
                    return;
                }

                if (time && time <= 0) {
                    displayErrorMessage('Enter a time value greater than zero');
                    return;
                }
            }

            const windowsList = selectedWindows.map(window => window.replace(/\r$/, '')).join(', ');
            command = [(mode === 'key' ? key : mode), pause, interval, time, (location ? location : ''), click, (w ? '' : windowsList)];
        }

        window.electronAPI.isRunning().then(isRunning => {
            if (isRunning) {
                window.electronAPI.startClicking(command).then(response => {
                    if (response === 'stopped') {
                        status = false;
                        resetChangeFade();
                        updateButtonState(status);
                    }
                });
            } else {
                window.electronAPI.startClicking(command).then(response => {
                    if (response === 'started') {
                        status = true;
                        resetChangeFade();
                        updateButtonState(status);
                    }
                }).catch(error => {
                });
            }
        });
    };

    window.electronAPI.activateKey(() => {
        window.electronAPI.restoreWindow();
        handleStartClick();
    });

    const observer1 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === 'class' || mutation.attributeName === 'disabled') {
                if (elements.wButton.classList.contains('active')) {
                    if (elements.wButton.disabled) {
                        elements.pauseButton.disabled = false;
                    } else {
                        elements.pauseButton.disabled = true;
                    }
                } else {
                    elements.pauseButton.disabled = false;
                }
            }
        }
    });
    observer1.observe(elements.wButton, { attributes: true });

    const observer2 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === 'class') {
                if (elements.keyModeButton.classList.contains('active')) {
                    elements.letter.disabled = false;
                    elements.externalButton.disabled = false;
                    elements.locationButton.disabled = true;
                } else {
                    elements.letter.disabled = true;
                    elements.externalButton.disabled = true;
                    if (!elements.locationButton.classList.contains('active')) {
                        elements.locationButton.disabled = false;
                    }
                }
            }
        }
    });
    observer2.observe(elements.keyModeButton, { attributes: true });

    const observer3 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === 'class') {
                if (elements.passiveModeButton.classList.contains('active')) {
                    elements.wButton.disabled = true;
                    elements.locationButton.disabled = true;
                } else {
                    elements.wButton.disabled = false;
                    if (!elements.keyModeButton.classList.contains('active')) {
                        elements.locationButton.disabled = false;
                    }
                }
            }
        }
    });
    observer3.observe(elements.passiveModeButton, { attributes: true });

    const observer4 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === 'class') {
                if (elements.clickModeButton.classList.contains('active')) {
                    elements.clicks.disabled = false;
                } else {
                    elements.clicks.disabled = true;
                }
            }
        }
    });
    observer4.observe(elements.clickModeButton, { attributes: true });

    elements.clickModeButton.addEventListener('click', () => {
        selectMode('click-mode');
    });

    elements.moveModeButton.addEventListener('click', () => {
        selectMode('move-mode');
    });

    elements.passiveModeButton.addEventListener('click', () => {
        selectMode('passive-mode');
    });

    elements.keyModeButton.addEventListener('click', () => {
        selectMode('key-mode');
    });

    elements.interval.addEventListener('change', () => {
        if (status) {
            handleChange(elements.interval, interval);
        }
    });

    elements.interval.addEventListener('input', () => {
        if (elements.interval.value === '') {
            elements.interval.value = '';
        }

        let value = elements.interval.value;
        const parts = value.split('.');

        if (parts.length > 2) {
            elements.interval.value = value.slice(0, -1);
            return;
        }

        if (parts[0].length > 6) {
            elements.interval.value = parts[0].slice(0, 6) + (parts[1] ? '.' + parts[1] : '');
            return;
        }

        if (parts[1] && parts[1].length > 3) {
            elements.interval.value = parts[0] + '.' + parts[1].slice(0, 3);
        }
    });

    elements.interval.addEventListener('wheel', function (event) {
        event.preventDefault();

        let step = 1;
        let currentValue = parseFloat(this.value) || 0;

        function getDecimalCount(value) {
            if (Math.floor(value) === value) return 0;
            return value.toString().split(".")[1]?.length || 0;
        }

        let decimalCount = getDecimalCount(currentValue);
        let maxLimit = 999999;

        if (event.deltaY < 0) {
            let newValue = currentValue + step;
            if (newValue > maxLimit) {
                this.value = maxLimit.toFixed(0);
            } else {
                this.value = newValue.toFixed(decimalCount);
            }
        } else {
            if (currentValue > 0) {
                let newValue = currentValue - step;
                if (newValue <= 0) {
                    this.value = '';
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            }
        }
    });

    elements.interval.addEventListener('keydown', function (event) {
        let step = 1;
        let currentValue = parseFloat(this.value) || 0;

        function getDecimalCount(value) {
            if (Math.floor(value) === value) return 0;
            return value.toString().split(".")[1]?.length || 0;
        }

        let decimalCount = getDecimalCount(currentValue);
        let maxLimit = 999999;

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            let newValue = currentValue + step;
            if (newValue > maxLimit) {
                this.value = maxLimit.toFixed(0);
            } else {
                this.value = newValue.toFixed(decimalCount);
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentValue > 0) {
                let newValue = currentValue - step;
                if (newValue <= 0) {
                    this.value = '';
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            }
        }
    });

    elements.letter.addEventListener('change', () => {
        if (status) {
            handleChange(elements.letter, key);
        }
    });

    elements.letter.addEventListener('input', () => {
        elements.letter.value = elements.letter.value.replace(/\s+/g, '');
    });

    elements.time.addEventListener('change', () => {
        if (status) {
            handleChange(elements.time, time);
        }
    });

    elements.time.addEventListener('input', () => {
        if (elements.time.value === '') {
            elements.time.value = '';
        }

        let value = elements.time.value;
        const parts = value.split('.');

        if (parts.length > 2) {
            elements.time.value = value.slice(0, -1);
            return;
        }

        if (parts[0].length > 6) {
            elements.time.value = parts[0].slice(0, 6) + (parts[1] ? '.' + parts[1] : '');
            return;
        }

        if (parts[1] && parts[1].length > 3) {
            elements.time.value = parts[0] + '.' + parts[1].slice(0, 3);
        }
    });

    elements.time.addEventListener('wheel', function (event) {
        event.preventDefault();

        let step = 1;
        let currentValue = parseFloat(this.value) || 0;

        function getDecimalCount(value) {
            if (Math.floor(value) === value) return 0;
            return value.toString().split(".")[1]?.length || 0;
        }

        let decimalCount = getDecimalCount(currentValue);
        let maxLimit = 999999;

        if (event.deltaY < 0) {
            let newValue = currentValue + step;
            if (newValue > maxLimit) {
                this.value = maxLimit.toFixed(0);
            } else {
                this.value = newValue.toFixed(decimalCount);
            }
        } else {
            if (currentValue > 0) {
                let newValue = currentValue - step;
                if (newValue <= 0) {
                    this.value = '';
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            }
        }
    });

    elements.time.addEventListener('keydown', function (event) {
        let step = 1;
        let currentValue = parseFloat(this.value) || 0;

        function getDecimalCount(value) {
            if (Math.floor(value) === value) return 0;
            return value.toString().split(".")[1]?.length || 0;
        }

        let decimalCount = getDecimalCount(currentValue);
        let maxLimit = 999999;

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            let newValue = currentValue + step;
            if (newValue > maxLimit) {
                this.value = maxLimit.toFixed(0);
            } else {
                this.value = newValue.toFixed(decimalCount);
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentValue > 0) {
                let newValue = currentValue - step;
                if (newValue <= 0) {
                    this.value = '';
                } else {
                    this.value = newValue.toFixed(decimalCount);
                }
            }
        }
    });

    elements.modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (status) {
                current = getMode();
                handleChange(current, mode, previous);
                previous = current;
            }
        });
    });

    elements.windowList.addEventListener('click', function (event) {
        if (event.target.tagName === 'BUTTON') {
            if (status) {
                handleChange([...document.querySelectorAll('#window-list button.selected')].map(button => button.textContent), selectedWindows);
            }
        }
    });

    elements.pauseButton.addEventListener('click', () => {
        selectPause();
        if (status) {
            handleChange(elements.pauseButton, pause);
        }
    });

    elements.wButton.addEventListener('click', () => {
        selectW();
        if (status) {
            handleChange(elements.wButton, w);
        }
    });

    elements.searchButton.addEventListener('click', () => {
        elements.searchSection.style.display = 'none';
        elements.loadingSection.style.display = 'flex';
        elements.wButton.classList.remove('active');
        window.electronAPI.getListOfWindows();
        stop();
    });

    elements.refreshButton.addEventListener('click', handleListRefresh);

    elements.closeButton.addEventListener('click', handleClose);

    elements.startButton.addEventListener('click', handleStartClick);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'F1') {
            event.preventDefault();
            handleStartClick();
        }
    });

    elements.locationButton.addEventListener('click', async () => {
        if (!elements.locationButton.classList.contains('active')) {
            if (!elements.locationButton.classList.contains('stand')) {
                elements.locationButton.classList.add('stand');
                elements.locationButton.title = `Waiting for your\nlocation pick...`;
                await trackCursor();
                [px, py] = location.split(',').map(Number);
                if (!status) {
                    [tx, ty] = [px, py];
                }
                elements.locationButton.title = `Picked location\nX : ${px}, Y : ${py}`;
                elements.locationButton.classList.remove('stand');
                elements.locationButton.classList.add('active');
            }
        } else {
            location = '';
            [px, py] = [0, 0];
            elements.locationButton.classList.remove('active');
            elements.locationButton.title = "Select to pick a specific location for some activation\nmodes. Deselect to use the center of the window";
        }
        if (status) {
            if ((pick) && (pick === elements.locationButton.classList.contains('active')) && !(px === tx && py === ty)) {
                handleChange(elements.locationButton, !pick);
            } else {
                handleChange(elements.locationButton, pick);
            }
        }
    });

    elements.clicks.addEventListener('click', () => {
        index = (index + 1) % values.length;
        elements.clicks.value = values[index];
        if (status) {
            handleChange(elements.clicks, click);
        }
    });

    elements.clicks.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    window.electronAPI.on('error-message', handleError);

    window.electronAPI.on('process-terminated', () => {
        status = false;
        updateButtonState(status);
    });
});

function selectMode(modeId) {
    const moveModeButton = document.getElementById('move-mode');
    const clickModeButton = document.getElementById('click-mode');
    const keyModeButton = document.getElementById('key-mode');
    const passiveModeButton = document.getElementById('passive-mode');

    if (modeId === 'move-mode') {
        moveModeButton.classList.add('active');
        clickModeButton.classList.remove('active');
        passiveModeButton.classList.remove('active');
        keyModeButton.classList.remove('active');
    } else if (modeId === 'click-mode') {
        moveModeButton.classList.remove('active');
        clickModeButton.classList.add('active');
        passiveModeButton.classList.remove('active');
        keyModeButton.classList.remove('active');
    } else if (modeId === 'passive-mode') {
        moveModeButton.classList.remove('active');
        clickModeButton.classList.remove('active');
        passiveModeButton.classList.add('active');
        keyModeButton.classList.remove('active');
    } else {
        moveModeButton.classList.remove('active');
        clickModeButton.classList.remove('active');
        passiveModeButton.classList.remove('active');
        keyModeButton.classList.add('active');
    }
}

function selectPause() {
    const pauseButton = document.getElementById('pause-mode');

    if (pauseButton.classList.contains('active')) {
        pauseButton.classList.remove('active');
    } else {
        pauseButton.classList.add('active');
    }
}

function selectW() {
    const wButton = document.getElementById('w-button');

    if (wButton.classList.contains('active')) {
        wButton.classList.remove('active');
    } else {
        wButton.classList.add('active');
    }
}