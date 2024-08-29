const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const iconv = require('iconv-lite');

let pythonProcess = null;

const pythonExecutable = path.join('src/python/pythonw.exe');
const getPath = path.join('src/get.py');
const clickPath = path.join('src/click.py');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 660,
        minWidth: 800,
        minHeight: 660,
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

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Made with 💗 by Hyper Light