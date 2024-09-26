const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getListOfWindows: () => {
        ipcRenderer.invoke('get-window-list')
            .then(windows => {
                const windowList = document.getElementById('window-list');
                windowList.innerHTML = '';
                const validWindows = windows.filter(window => window);

                if (validWindows.length === 0) {
                    document.getElementById('loading-section').style.display = 'none';
                    document.getElementById('top-section').style.display = 'block';
                    document.getElementById('empty-section').style.display = 'flex';
                } else {
                    document.getElementById('windows-label').style.display = 'block';
                    validWindows.forEach(window => {
                        const button = document.createElement('button');
                        button.textContent = window;
                        button.addEventListener('click', () => {
                            button.classList.toggle('selected');
                        });
                        windowList.appendChild(button);
                    });
                    document.getElementById('empty-section').style.display = 'none';
                    document.getElementById('loading-section').style.display = 'none';
                    document.getElementById('top-section').style.display = 'block';
                    document.getElementById('scroll-zone').style.overflowY = 'auto';
                }
                document.getElementById('close-button').disabled = false;
                document.getElementById('refresh-button').disabled = false;
            })
            .catch(error => {
            });
    },
    startClicking: (command) => {
        return ipcRenderer.invoke('start', command)
            .then(response => {
                return response;
            })
            .catch(error => {
            });
    },
    getLocation: (command) => {
        return ipcRenderer.invoke('get-location', command)
            .then(response => {
                return response;
            })
            .catch(error => {
            });
    },
    activateKey: (callback) => ipcRenderer.on('activate-key', callback),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    restoreWindow: () => ipcRenderer.send('restore-window'),
    isRunning: () => {
        return ipcRenderer.invoke('is-running')
            .then(response => {
                return response;
            })
            .catch(error => {
            });
    },
    stop: () => {
        return ipcRenderer.invoke('stop')
            .then(response => {
                return response;
            })
            .catch(error => {
            });
    },
    on: (channel, listener) => {
        ipcRenderer.on(channel, listener);
    }
});