const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const DiscordRPC = require('discord-rpc');
const cors = require("cors");

let mainWindow;
let tray;
let rpc;
let currentClientId = '';
const httpServer = express();
const HTTP_PORT = 51789;

httpServer.use(bodyParser.json());

httpServer.use(cors()); // for cors

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: true,
    autoHideMenuBar: true // This hides the menu bar that appears on default (i hate it)
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', function (event) {
    if (!app.isQuitting) {
      event.preventDefault();
      dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Minimize to Tray', 'Close'],
        title: 'Close',
        message: 'Do you want to close the app or minimize it to tray?'
      }).then(result => {
        if (result.response === 0) {
          mainWindow.hide();
        } else {
          app.isQuitting = true;
          app.quit();
        }
      });
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'app.ico'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: function () {
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: function () {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Discord RPC | MubiLop');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
  });
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  
  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error', error.message);
  });

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Do you want to download it?`,
      buttons: ['Yes', 'No']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Install and restart now?',
      buttons: ['Yes', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });
}

async function initDiscordRPC(clientId) {
  if (rpc) {
    await rpc.destroy();
  }

  rpc = new DiscordRPC.Client({ transport: 'ipc' });
  currentClientId = clientId;
  
  rpc.on('ready', () => {
    mainWindow.webContents.send('discord-connected', clientId);
  });

  try {
    await rpc.login({ clientId });
    return true;
  } catch (error) {
    mainWindow.webContents.send('discord-error', error.message);
    return false;
  }
}

httpServer.post('/set-client-id', async (req, res) => {
  const { clientId } = req.body;
  if (!clientId) {
    return res.status(400).json({ error: 'Client ID is required' });
  }

  const success = await initDiscordRPC(clientId);
  if (success) {
    res.json({ success: true, clientId });
    mainWindow.webContents.send('client-id-updated', clientId);
  } else {
    res.status(500).json({ error: 'Failed to connect to Discord' });
  }
});

httpServer.post('/update-presence', async (req, res) => {
  if (!rpc) {
    return res.status(400).json({ error: 'Discord RPC not initialized. Set client ID first.' });
  }

  try {
    await rpc.setActivity(req.body);
    res.json({ success: true, presence: req.body });
    mainWindow.webContents.send('presence-updated', req.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ipcMain.on('set-client-id', async (event, clientId) => {
  const success = await initDiscordRPC(clientId);
  if (!success) {
    event.reply('client-id-error', 'Failed to connect to Discord');
  }
});

ipcMain.on('update-presence', async (event, presenceData) => {
  try {
    await rpc.setActivity(presenceData);
    event.reply('presence-updated', presenceData);
  } catch (error) {
    event.reply('presence-error', error.message);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupAutoUpdater();
  autoUpdater.checkForUpdates();
  
  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 4 * 60 * 60 * 1000);
  
  httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP server running at http://localhost:${HTTP_PORT}`);
  });
});

// Modify the window-all-closed event
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (app.isQuitting) {
      app.quit();
    }
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});