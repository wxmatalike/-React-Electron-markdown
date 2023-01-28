import React, { useEffect, useState } from 'react';
import './App.css';
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSeach from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import * as marked from 'marked'
import { flattenArr, mapToArr } from './utils/helper'
import useIpcRenderer from './hooks/useIpcRenderer'
//uuid
import { v4 as uuidv4 } from 'uuid';
//md编辑器
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
//node.js处理文件
import fileHelper from './utils/fileHelper';
const { join, basename, extname, dirname } = window.require('path')
const remote = window.require('@electron/remote')
//数据持久化
const Store = window.require('electron-store')
const fileStore = new Store({ 'name': 'FilesData' })

const settingsStore = new Store({ name: 'Settings' })

const saveFilesToStore = (files) => {
  const filesStoreObj = mapToArr(files).reduce((res, file) => {
    const { id, path, title, createdAt } = file
    res[id] = { id, path, title, createdAt }
    return res
  }, {})
  fileStore.set('files', filesStoreObj)
}

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const [activeFileId, setActiveFileId] = useState(0) //当前文件
  const [openFileIDs, setOpenFileIDs] = useState([]) //打开的文件列表
  const [unsaveFileIDs, setUnsaveFileIDs] = useState([]) //未保存的文件列表
  const [searchFiles, setSearchFiles] = useState([])
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
    if (!currentFile.isLoaded) {
      fileHelper.readFile(currentFile.path).then((val) => {
        const newFile = { ...files[fileId], body: val, isLoaded: true }
        setFiles({ ...files, [fileId]: newFile })
      }).catch(err => {
        console.log(fileId, files);
        delete files[fileId]
        setFiles({ ...files })
        saveFilesToStore(files)
        tabClose(fileId)
      })
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
    const modifiedFile = { ...files[id], title: newValue, isNew: false, path: newPath }
    const newFile = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFile)
        saveFilesToStore(newFile)
      })
    } else {
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFile)
        saveFilesToStore(newFile)
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
    fileHelper.writeFile(activedFile.path, activedFile.body).then(() => {
      setUnsaveFileIDs(unsaveFileIDs.filter(id => id !== activedFile.id))
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

  useIpcRenderer({
    'create-file': createNewFile,
    'save-file': saveCurrentFile,
    'import-file': importFiles
  })

  return (
    <div className="App container-fluid p-0">
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
                minHeight: '440px',
                maxHeight: '440px',
                autofocus: true,
                previewRender: (plainText, preview) => {
                  setTimeout(() => {
                    preview.innerHTML = marked.parse(plainText);
                  }, 250);
                  return "Loading...";
                }
              }} onChange={(val) => { fileChange(activedFile.id, val) }} />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
