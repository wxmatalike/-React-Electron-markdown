const { app, BrowserWindow, ipcMain } = require('electron')
const isDev = require('electron-is-dev')

app.disableHardwareAcceleration()
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
  require('@electron/remote/main').initialize()
  require("@electron/remote/main").enable(win.webContents)

  // win.webContents.openDevTools()

  const urlLocation = isDev ?'http://localhost:3000':'https'
  win.loadURL(urlLocation)

}
app.whenReady().then(() => {
  createWindow()
})