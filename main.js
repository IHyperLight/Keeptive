const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const iconv = require('iconv-lite');

let pythonProcess = null;
let locate = null;

const pythonExecutable = path.join('src/python/pythonw.exe');
const getPath = path.join('src/get.py');
const getLocation = path.join('src/locate.py');
const clickPath = path.join('src/click.py');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 928,
        height: 679,
        minWidth: 928,
        minHeight: 679,
        icon: path.join(__dirname, 'src/assets/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.setMenu(null);

    mainWindow.loadURL('file://' + path.join(__dirname, 'src/index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    globalShortcut.register('F6', () => {
        mainWindow.webContents.send('activate-key');
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url !== mainWindow.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('restore-window', () => {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
    });

    ipcMain.handle('get-location', async () => {
        return new Promise((resolve, reject) => {
            locate = spawn(pythonExecutable, [getLocation], { encoding: 'utf8' });

            let output = '';

            locate.stdout.on('data', (data) => {
                output = data.toString();
            });

            locate.stderr.on('data', (data) => {
                locate = null;
            });

            locate.on('close', (code) => {
                locate = null;
                resolve(output);
            });

            mainWindow.minimize();
        });
    });

    ipcMain.handle('get-window-list', async () => {
        return new Promise((resolve, reject) => {
            exec(`${pythonExecutable} ${getPath}`, { encoding: 'buffer' }, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    const windows = iconv.decode(stdout, 'UTF-8').trim().split('\n');
                    resolve(windows);
                }
            });
        });
    });

    ipcMain.handle('start', async (event, command) => {
        return new Promise((resolve, reject) => {
            if (pythonProcess) {
                pythonProcess.kill('SIGINT');
                pythonProcess = null;
                resolve('stopped');
            } else {
                command.unshift(clickPath);
                pythonProcess = spawn(pythonExecutable, command, { encoding: 'utf8' });

                pythonProcess.stderr.on('data', (data) => {
                    pythonProcess = null;
                    event.sender.send('error-message', data);
                });

                pythonProcess.on('close', (code) => {
                    pythonProcess = null;
                    event.sender.send('process-terminated');
                });

                resolve('started');
            }
        });
    });

    ipcMain.handle('stop', async () => {
        return new Promise((resolve, reject) => {
            if (pythonProcess) {
                pythonProcess.kill('SIGINT');
                pythonProcess = null;
                resolve('stopped');
            }
        });
    });

    ipcMain.handle('is-running', async () => {
        return pythonProcess !== null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Made with 💗 by Hyper Light