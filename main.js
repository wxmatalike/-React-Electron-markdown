const { app, ipcMain, Menu, dialog } = require('electron')
const isDev = require('electron-is-dev')
const { initialize, enable } = require('@electron/remote/main')
const ElectronStore = require('electron-store');
ElectronStore.initRenderer();
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const path = require('path')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const QiniuManager = require('./src/utils/QiniuManager')

const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucket = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucket)
}

console.log(app.getPath('userData'));

let mainWindow, settingsWindow

// app.disableHardwareAcceleration()
const createWindow = () => {
  const urlLocation = isDev ? 'http://localhost:3000' : 'https'
  const mainWindowConfig = {
    width: 900,
    height: 530,
  }
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  enable(mainWindow.webContents);
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  ipcMain.on('open-setting-window', () => {
    const settingWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    }
    const settingFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
    settingsWindow = new AppWindow(settingWindowConfig, settingFileLocation)
    settingsWindow.menuBarVisible = false
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
    enable(settingsWindow.webContents);
  })

  ipcMain.on('config-is-saved', () => {
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
    const switchItems = (toggle) => {
      [1, 2, 3].forEach(index => {
        qiniuMenu.submenu.items[index].enabled = toggle
      })
    }
    const qiniuIsConfig = ['accessKey', 'secretKey', 'bucketName'].every(key => {
      return !!settingsStore.get(key)
    })
    if (qiniuIsConfig) {
      switchItems(true)
    } else {
      switchItems(false)
    }
  })

  ipcMain.on('upload-file', (event, data) => {
    const manager = createManager()
    manager.uploadFile(data.key, data.path).then(data => {
      console.log('success', data);
      mainWindow.webContents.send('active-file-uploaded')
    }).catch(err => {
      dialog.showErrorBox('同步失败', '请检查参数是否正确')
    })
  })

  initialize()
}
app.whenReady().then(() => {
  createWindow()
})