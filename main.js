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
const fileStore = new Store({ name: 'FilesData' })
const QiniuManager = require('./src/utils/QiniuManager')

const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucket = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucket)
}

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
  //点击设置
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
  //
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

  ipcMain.on('download-file', (event, data) => {
    const manager = createManager()
    const filesObj = fileStore.get('files')
    const { key, path, id } = data
    manager.getStat(key).then(res => {
      const serverUpdatedTime = Math.round(res.putTime / 10000)
      const localUpdatedTime = filesObj[id].updatedAt
      if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
        console.log('new file');
        manager.downloadFile(key, path).then(() => {
          mainWindow.webContents.send('file-download', { status: 'download-success', id })
        })
      } else {
        console.log('old file');
        mainWindow.webContents.send('file-download', { status: 'no-new-file', id })
      }
    }, err => {
      if (err.statusCode === 612) {
        mainWindow.webContents.send('file-download', { status: 'no-file', id })
      }
    })
  })

  ipcMain.on('delete-file', (event, data) => {
    const manager = createManager()
    manager.deleteFile(data.key).then(res => {
      console.log('delete-success');
    }).catch(err => {
      dialog.showErrorBox('云端删除失败', '请检查SDK设置是否正确')
    })
  })

  ipcMain.on('rename-file', (event, data) => {
    const manager = createManager()
    manager.renameFile(data.key, data.newKey).then(res => {
      console.log('rename-success');
    }).catch(err => {
      dialog.showErrorBox('云端重命名失败', '请检查SDK设置是否正确')
    })
  })

  ipcMain.on(('upload-all-to-qiniu'), () => {
    mainWindow.webContents.send('loading-status', true)
    const manager = createManager()
    const filesObj = fileStore.get('files') || {}
    const uploadPromiseArr = Object.keys(filesObj).map(key => {
      const file = filesObj[key]
      return manager.uploadFile(`${file.title}.md`, file.path)
    })
    Promise.all(uploadPromiseArr).then(res => {
      console.log(res);
      dialog.showMessageBox({
        type: 'info',
        title: `上传成功`,
        message: `成功上传个${res.length}文件`
      })
      mainWindow.webContents.send('files-uploaded-success')
    }).catch(err => {
      dialog.showErrorBox('上传失败', '请检查SDK设置是否正确')
    }).finally(() => {
      mainWindow.webContents.send('loading-status', false)
    })
  })

  initialize()
}
app.whenReady().then(() => {
  createWindow()
})