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
const { v4: uuidv4 } = require('uuid')

const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucket = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucket)
}

const mapToArr = (map) => {
  return Object.keys(map).map(key => {
      return map[key]
  })
}

const saveFilesToStore = (files) => {
  const filesStoreObj = mapToArr(files).reduce((res, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    res[id] = { id, path, title, createdAt, isSynced, updatedAt }
    return res
  }, {})
  fileStore.set('files', filesStoreObj)
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
  //同步meun是否可点击设置
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
  //单文件上传云端
  ipcMain.on('upload-file', (event, data) => {
    const manager = createManager()
    manager.uploadFile(data.key, data.path).then(data => {
      console.log('success', data);
      mainWindow.webContents.send('active-file-uploaded')
    }).catch(err => {
      dialog.showErrorBox('同步失败', '请检查参数是否正确')
    })
  })
  //单文件从云端下载
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
  //删除云端文件
  ipcMain.on('delete-file', (event, data) => {
    const manager = createManager()
    manager.deleteFile(data.key).then(res => {
      console.log('delete-success');
    }).catch(err => {
      dialog.showErrorBox('云端删除失败', '请检查SDK设置是否正确')
    })
  })
  //文件云端重命名
  ipcMain.on('rename-file', (event, data) => {
    const manager = createManager()
    manager.renameFile(data.key, data.newKey).then(res => {
      console.log('rename-success');
    }).catch(err => {
      dialog.showErrorBox('云端重命名失败', '请检查SDK设置是否正确')
    })
  })
  //全部文件上传云端
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
        message: `成功上传${res.length}个文件`
      })
      mainWindow.webContents.send('files-uploaded-success')
    }).catch(err => {
      dialog.showErrorBox('上传失败', '请检查SDK设置是否正确')
    }).finally(() => {
      mainWindow.webContents.send('loading-status', false)
    })
  })
  //全部文件从云端下载
  ipcMain.on('download-all-to-local', () => {
    const manager = createManager()
    const savedFileLocation = settingsStore.get('savedFileLocation')
    const filesObj = fileStore.get('files')
    manager.getFileList().then(res => {
      //筛选符合下载条件的文件
      const downloadPromiseArr = res.items.filter(downFile => {
        const noHasFile = !Object.values(filesObj).some(localFile => {
          return localFile.title === downFile.key.substr(0, downFile.key.length - 3)
        })
        const hasFileNoNewFile = Object.values(filesObj).some(localFile => {
          if (localFile.title === downFile.key.substr(0, downFile.key.length - 3) && localFile.updatedAt < Math.round(downFile.putTime / 10000)) {
            downFile.path = localFile.path
            return true
          }
          return false
        })
        return noHasFile || hasFileNoNewFile
      }).map(item => {
        if (!item[path]) {
          item.path = path.join(savedFileLocation, item.key)
        }
        return item
      }).map(item => {
        return manager.downloadFile(item.key, item.path)
      })
      return Promise.all(downloadPromiseArr)
    }).then(res => {
      dialog.showMessageBox({
        type: 'info',
        title: `下载成功`,
        message: `成功下载${res.length}个文件`
      })
      const newFilesObj = res.reduce((currentFilesObj, qiniuFile) => {
        console.log(qiniuFile);
        const localHasFile = Object.values(filesObj).some(file => {
          if (file.title === qiniuFile.key) {
            qiniuFile.id = file.id
            return true
          }
        })
        //下载的文件在本地已存在（只需更新）
        if (localHasFile) {
          const updatedFile = {
            ...filesObj[qiniuFile.id],
            isSynced: true,
            updatedAt: new Date().getTime()
          }
          return { ...currentFilesObj, [qiniuFile.id]: updatedFile }
        } else {
          const newId = uuidv4()
          const newFile = {
            id: newId,
            title: qiniuFile.key,
            path: qiniuFile.downloadPath,
            updatedAt: new Date().getTime()
          }
          return { ...currentFilesObj, [newId]: newFile }
        }
      }, { ...filesObj })
      saveFilesToStore(newFilesObj)
      mainWindow.webContents.send('files-download-success')
    }).catch(err => {
      console.log('download-all-error', err);
    })
  })
  initialize()
}
app.whenReady().then(() => {
  createWindow()
})