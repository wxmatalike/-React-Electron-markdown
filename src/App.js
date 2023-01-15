import React, { useState } from 'react';
import './App.css';
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSeach from './components/FileSearch';
// import defaultFiles from './utils/defaultFiles';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import * as marked from 'marked'
import { flattenArr, mapToArr } from './utils/helper'
//md编辑器
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
//node.js处理文件
import fileHelper from './utils/fileHelper';
const { join } = window.require('path')
const remote = window.require('@electron/remote')
//数据持久化
const Store = window.require('electron-store')
const fileStore = new Store({ 'name': 'FilesData' })

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
  const [activeFileId, setActiveFileId] = useState(-1) //当前文件
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
  const savedLocation = remote.app.getPath('documents')

  //点击左侧导航栏中的file
  const fileClick = (fileId) => {
    setActiveFileId(fileId)
    const currentFile = files[fileId]
    if (!currentFile.inLoaded) {
      fileHelper.readFile(currentFile.path).then((val) => {
        const newFile = { ...files[fileId], body: val, isLoaded: true }
        setFiles({ ...files, [fileId]: newFile })
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
      setActiveFileId('')
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
      const { [fileId]: value, ...afterDelete } = files
      setFiles(afterDelete)
      // delete files[fileId]
      // setFiles({ ...files })
    } else {
      fileHelper.deleteFile(files[fileId].path).then(() => {
        // delete files[fileId]
        // setFiles({ ...files })
        const { [fileId]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(files)
        tabClose(fileId)
      })
    }
  }
  //编辑标题
  const updateFileName = (id, newValue, isNew) => {
    const newPath = join(savedLocation, `${newValue}.md`)
    const modifiedFile = { ...files[id], title: newValue, isNew: false, path: newPath }
    const newFile = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFile)
        saveFilesToStore(newFile)
      })
    } else {
      const oldPath = join(savedLocation, `${files[id].title}.md`)
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
    let newId = new Date().getTime() + 1
    let f = {
      id: newId,
      title: '',
      body: '## 请输入 Markdown',
      isNew: true,
      createdAt: new Date().getTime()
    }
    setFiles({ ...files, [newId]: f })
  }
  const saveCurrentFile = () => {
    fileHelper.writeFile(join(savedLocation, `${activedFile.title}.md`), activedFile.body).then(() => {
      setUnsaveFileIDs(unsaveFileIDs.filter(id => id !== activedFile.id))
    })
  }

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
              <BottomBtn text='导入' color='btn-success' icon={faFileImport} />
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
                // autofocus: true,
                previewRender: (plainText, preview) => {
                  setTimeout(() => {
                    preview.innerHTML = marked.parse(plainText);
                  }, 250);
                  return "Loading...";
                }
              }} onChange={(val) => { fileChange(activedFile.id, val) }} />
              <BottomBtn text='保存' color='btn-success' icon={faSave} btnClick={saveCurrentFile} />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
