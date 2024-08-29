document.addEventListener('DOMContentLoaded', () => {
    let interval;
    let mode;
    let previous;
    let key;
    let pause;
    let w;
    let selectedWindows;
    let time;
    let status = false;
    let errorMessageTimeout;
    let changes = 0;
    let flag1 = false;
    let flag2 = false;

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
            toolTip: 'Stop'
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
            toolTip: 'Start'
        };

        elements.startButton.title = activeStyle.toolTip;
        elements.startSvg.innerHTML = activeStyle.buttonText;
        elements.startBack.style.background = activeStyle.startBack;
        elements.circle.style.background = activeStyle.circle;
        elements.notice.style.background = activeStyle.notice;
        elements.notice.style.backgroundClip = 'text';
        elements.notice.textContent = activeStyle.noticeText;
    };

    const resetChangeFade = () => {
        flag1 = false;
        flag2 = false;
        changes = 0;
        elements.errorMessage.classList.add('fade-out');
    };

    const displayChangeMessage = () => {
        if (changes === 1) {
            elements.errorMessage.textContent = `A change was made, restart to apply`;
        } else {
            elements.errorMessage.textContent = `${changes} changes was made, restart to apply`;
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

        if (Array.isArray(newValue)) {
            if (value.length === newValue.length && value.every((element, index) => element === newValue[index])) {
                changes--;
                flag1 = false;
                if (changes === 0) {
                    resetChangeFade();
                } else {
                    displayChangeMessage();
                }
            } else {
                if (!flag1) {
                    changes++;
                    flag1 = true;
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
                    if (element.tagName === 'INPUT') {
                        if (!flag2) {
                            changes++;
                            flag2 = true;
                            displayChangeMessage();
                        }
                    } else {
                        changes++;
                        displayChangeMessage();
                    }
                }
            } else {
                if (changes > 0) {
                    changes--;
                }
                if (element.tagName === 'INPUT') {
                    flag2 = false;
                }
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

    const isASCII = (str) => /^[\x00-\x7F]*$/.test(str);

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
        elements.emtpySection.style.display = 'none';
        elements.scrollZone.style.overflowY = 'hidden';
        elements.loadingSection.style.display = 'flex';
        window.electronAPI.getListOfWindows();
        stop();
    };

    const handleClose = () => {
        elements.emtpySection.style.display = 'none';
        elements.searchSection.style.display = 'flex';
        elements.topSection.style.display = 'none';
        elements.loadingSection.style.display = 'none';
        elements.windowList.innerHTML = '';
        elements.scrollZone.style.overflowY = 'hidden';
        stop();
    };

    const handleStartClick = () => {
        let command = [];
        if (!status) {
            interval = elements.interval.value;
            mode = getMode();
            previous = mode;
            key = elements.letter.value;
            pause = elements.pauseButton.classList.contains('active');
            w = elements.wButton.classList.contains('active');
            selectedWindows = [...document.querySelectorAll('#window-list button.selected')].map(button => button.textContent);
            time = elements.time.value;

            if (!status) {
                if ((mode === 'click' && selectedWindows.length === 0 && !w) || (mode === 'move' && selectedWindows.length === 0 && !w)) {
                    displayErrorMessage('Select at least one window or the entire system option');
                    return;
                }

                if (mode === 'passive' && selectedWindows.length === 0) {
                    displayErrorMessage('Select at least one window to use the passive mode');
                    return;
                }

                if (mode === 'passive') {
                    interval = 0.1;
                }

                if (mode === 'key' && !w) {
                    displayErrorMessage('Select the entire system option to use the key mode');
                    return;
                }

                if (mode === 'key' && !key) {
                    displayErrorMessage('Enter a key to use the key mode');
                    return;
                }

                if (mode === 'key' && !isASCII(key)) {
                    displayErrorMessage('Enter a valid key to use the key mode');
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
            command = [(mode === 'key' ? key : mode), pause, interval, time, (w ? '' : windowsList)];
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
                    elements.searchButton.disabled = true;
                    elements.letter.disabled = false;
                } else {
                    elements.searchButton.disabled = false;
                    elements.letter.disabled = true;
                }
            }
        }
    });
    observer2.observe(elements.keyModeButton, { attributes: true });

    const observer3 = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === 'class') {
                if (elements.passiveModeButton.classList.contains('active')) {
                    elements.interval.disabled = true;
                    elements.wButton.disabled = true;
                } else {
                    elements.interval.disabled = false;
                    elements.wButton.disabled = false;
                }
            }
        }
    });
    observer3.observe(elements.passiveModeButton, { attributes: true });

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

    elements.letter.addEventListener('change', () => {
        if (status) {
            handleChange(elements.letter, key);
        }
    });

    elements.time.addEventListener('change', () => {
        if (status) {
            handleChange(elements.time, time);
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