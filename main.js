const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const isDev = require('electron-is-dev')
const { initialize, enable } = require('@electron/remote/main')
const ElectronStore = require('electron-store');
ElectronStore.initRenderer();
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const path = require('path')
let mainWindow, settingsWindow

// app.disableHardwareAcceleration()
const createWindow = () => {
  const urlLocation = isDev ? 'http://localhost:3000' : 'https'
  const mainWindowConfig = {
    width: 1024,
    height: 768,
  }
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  ipcMain.on('open-setting-window', () => {
    const settingWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    }
    const settingFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
    settingsWindow = new AppWindow(settingWindowConfig, settingFileLocation)
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
    enable(settingsWindow.webContents);
  })

  initialize()
  enable(mainWindow.webContents);
  
}
app.whenReady().then(() => {
  createWindow()
})