const { app, BrowserWindow, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const { initialize, enable } = require('@electron/remote/main')
const ElectronStore = require('electron-store');
ElectronStore.initRenderer();

// app.disableHardwareAcceleration()
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })
  initialize()
  enable(win.webContents);

  const urlLocation = isDev ? 'http://localhost:3000' : 'https'
  win.loadURL(urlLocation)
}
app.whenReady().then(() => {
  createWindow()
})