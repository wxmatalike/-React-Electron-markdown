import React, { useState } from 'react';
import './App.css';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSeach from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import Loader from './components/Loader';
import * as marked from 'marked'
import { flattenArr, mapToArr, timestampToString } from './utils/helper'
import useIpcRenderer from './hooks/useIpcRenderer'
import { v4 as uuidv4 } from 'uuid';
//md编辑器
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
//node.js处理文件
import fileHelper from './utils/fileHelper';
const { join, basename, extname, dirname } = window.require('path')
const remote = window.require('@electron/remote')
const { ipcRenderer } = window.require('electron')
//数据持久化
const Store = window.require('electron-store')
const fileStore = new Store({ name: 'FilesData' })
const settingsStore = new Store({ name: 'Settings' })

const saveFilesToStore = (files) => {
  const filesStoreObj = mapToArr(files).reduce((res, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    res[id] = { id, path, title, createdAt, isSynced, updatedAt }
    return res
  }, {})
  fileStore.set('files', filesStoreObj)
}

const getAutoSync = () => {
  return ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => {
    return !!settingsStore.get(key)
  })
}

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const [activeFileId, setActiveFileId] = useState(0) //当前文件
  const [openFileIDs, setOpenFileIDs] = useState([]) //打开的文件列表
  const [unsaveFileIDs, setUnsaveFileIDs] = useState([]) //未保存的文件列表
  const [searchFiles, setSearchFiles] = useState([])
  const [isLoading, setLoading] = useState(false)
  //转回数组
  const filesArr = mapToArr(files)
  const useSearchFilesArr = searchFiles.length === 0 ? filesArr : searchFiles
  const opendFiles = openFileIDs.map(openID => {
    return files[openID]
  })
  const activedFile = files[activeFileId]
  //文件存储位置
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')

  //点击左侧导航栏中的file
  const fileClick = (fileId) => {
    setActiveFileId(fileId)
    const currentFile = files[fileId]
    const { id, title, path, isLoaded } = currentFile
    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fileHelper.readFile(currentFile.path).then((val) => {
          const newFile = { ...files[fileId], body: val, isLoaded: true }
          setFiles({ ...files, [fileId]: newFile })
        }).catch(err => {
          delete files[fileId]
          setFiles({ ...files })
          saveFilesToStore(files)
          tabClose(fileId)
        })
      }
    }
    if (!openFileIDs.includes(fileId))
      setOpenFileIDs([...openFileIDs, fileId])
  }
  //点击右侧上方导航栏中的file
  const tabClick = (fileId) => {
    setActiveFileId(fileId)
  }
  //关闭右侧上方导航栏中的file
  const tabClose = (fileId) => {
    let fileIndex = openFileIDs.indexOf(fileId)
    if (!openFileIDs.includes(fileId)) return;
    let newFiles = openFileIDs.filter(id => { return id !== fileId })
    setOpenFileIDs(newFiles)
    if (newFiles.length === 0) {
      setActiveFileId(0)
    }
    else {
      if (newFiles.length - 1 >= fileIndex) {
        setActiveFileId(newFiles[fileIndex])
      } else {
        setActiveFileId(newFiles[newFiles.length - 1])
      }
    }
  }
  //编辑文档
  const fileChange = (id, value) => {
    const newFile = { ...files[id], body: value }
    setFiles({ ...files, [id]: newFile })
    if (!unsaveFileIDs.includes(id)) {
      setUnsaveFileIDs([...unsaveFileIDs, id])
    }
  }
  //删除
  const deleteFile = (fileId) => {
    if (files[fileId].isNew) {
      delete files[fileId]
      setFiles({ ...files })
    } else {
      fileHelper.deleteFile(files[fileId].path).then(() => {
        if (getAutoSync() && files[fileId].isSynced) {
          ipcRenderer.send('delete-file', { key: `${files[fileId].title}.md`, })
        }
        delete files[fileId]
        setFiles({ ...files })
        saveFilesToStore(files)
        tabClose(fileId)

      })
    }
  }
  //编辑标题
  const updateFileName = (id, newValue, isNew) => {
    //新建的文件才保存在savedLocation中
    const newPath = isNew ? join(savedLocation, `${newValue}.md`) : join(dirname(files[id].path), `${newValue}.md`)
    const oldFile = { title: files[id].title, isSynced: files[id].isSynced }
    const modifiedFile = { ...files[id], title: newValue, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (getAutoSync() && oldFile.isSynced) {
          ipcRenderer.send('rename-file', { key: `${oldFile.title}.md`, newKey: `${newValue}.md` })
        }
      })
    }


  }
  //搜索file
  const fileSearch = (keyWord) => {
    const newFiles = filesArr.filter(file => {
      return file.title && file.title.includes(keyWord)
    })
    setSearchFiles(newFiles)
  }
  //新建file
  const createNewFile = () => {
    let newId = uuidv4()
    let f = {
      id: newId,
      title: '',
      body: '## 请输入 Markdown',
      isNew: true,
      createdAt: new Date().getTime()
    }
    setFiles({ ...files, [newId]: f })
  }
  //保存
  const saveCurrentFile = () => {
    const { path, body, title } = activedFile
    fileHelper.writeFile(path, body).then(() => {
      setUnsaveFileIDs(unsaveFileIDs.filter(id => id !== activedFile.id))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', { key: `${title}.md`, path })
      }
    })
  }
  //导入文件
  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '选择导入的 Markdown 文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }).then((res) => {
      if (res.filePaths.length !== 0) {
        const paths = res.filePaths
        //遍历对比选择的文件中哪些是当前store中没有的
        const filteredPaths = paths.filter(path => {
          const needAdd = Object.values(files).find(file => {
            return file.path === path
          })
          return !needAdd
        })

        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            path,
            title: basename(path, extname(path))
          }
        })
        const newFiles = { ...files, ...flattenArr(importFilesArr) }
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入${importFilesArr.length}个文件`,
            message: `成功导入${importFilesArr.length}个文件`
          })
        }
      }
    })
  }
  //文件上传至云
  const activeFileUploaded = () => {
    const { id } = activedFile
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  //文件从云下载
  const activeFileDownLoaded = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      if (message.status === 'download-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true }
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }
  //文件全部上传至云端后
  const filesUploaded = () => {
    const newFiles = mapToArr(files).reduce((res, file) => {
      const currentTime = new Date().gettime()
      res[file.id] = {
        ...files[file.id],
        isSynced: true,
        updatedAt: currentTime
      }
      return res
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  useIpcRenderer({
    'create-file': createNewFile,
    'save-file': saveCurrentFile,
    'import-file': importFiles,
    'active-file-uploaded': activeFileUploaded,
    'file-download': activeFileDownLoaded,
    'loading-status': (message, status) => {
      setLoading(status)
    },
    'files-uploaded-success': filesUploaded
  })

  return (
    <div className="App container-fluid p-0">
      {isLoading && <Loader />}
      <div className='row g-0'>
        <div className='col-3 bg-light left-panel p-0'>
          <FileSeach title='我的文档' onFileSearch={fileSearch} />
          <FileList files={useSearchFilesArr} onFileClick={fileClick} onFileDelete={deleteFile}
            onSaveEdit={updateFileName} />
          <div className='row g-0 btns-group'>
            <div className='col d-grid'>
              <BottomBtn text='新建' color='btn-primary' icon={faPlus} btnClick={createNewFile} />
            </div>
            <div className='col d-grid'>
              <BottomBtn text='导入' color='btn-success' icon={faFileImport} btnClick={importFiles} />
            </div>
          </div>
        </div>
        <div className='col-9 right-panel'>
          {!activedFile &&
            <div className='start-page'>
              选择或创建新的 Markdown 文档
            </div>
          }
          {activedFile &&
            <>
              <TabList files={opendFiles} onTabClick={tabClick}
                activeId={activeFileId} onCloseTab={tabClose}
                unsaveIds={unsaveFileIDs} />
              <SimpleMDE value={activedFile && activedFile.body} options={{
                minHeight: '328px',
                autofocus: true,
                previewRender: (plainText, preview) => {
                  setTimeout(() => {
                    preview.innerHTML = marked.parse(plainText);
                  }, 250);
                  return "Loading...";
                }
              }} onChange={(val) => { fileChange(activedFile.id, val) }} />
              {
                activedFile.isSynced &&
                <span className='sync-status'>已同步，上次同步时间:{timestampToString(activedFile.updatedAt)}</span>
              }
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
