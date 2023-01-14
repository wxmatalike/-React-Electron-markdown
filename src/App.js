import React, { useState } from 'react';
import './App.css';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSeach from './components/FileSearch';
import defaultFiles from './utils/defaultFiles';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import * as marked from 'marked'
import { flattenArr, mapToArr } from './utils/helper'
//md编辑器
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

function App() {
  const [files, setFiles] = useState(flattenArr(defaultFiles))
  const [activeFileId, setActiveFileId] = useState('') //当前文件
  const [openFileIDs, setOpenFileIDs] = useState([]) //打开的文件列表
  const [unsaveFileIDs, setUnsaveFileIDs] = useState([]) //未保存的文件列表
  const [searchFiles, setSearchFiles] = useState([])
  //转回数组
  const filesArr=mapToArr(files)

  const useSearchFiles = searchFiles.length === 0 ? false : true

  const opendFiles = openFileIDs.map(openID => {
    return files[openID]
  })

  const activedFile = files[activeFileId]
  //点击左侧导航栏中的file
  const fileClick = (fileId) => {
    setActiveFileId(fileId)
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
    const newFile = files.map(file => {
      if (file.id === id) {
        file.body = value
      }
      return file
    })
    setFiles(newFile)

    if (!unsaveFileIDs.includes(id)) {
      setUnsaveFileIDs([...unsaveFileIDs, id])
    }
  }
  //删除
  const deleteFile = (fileId) => {
    delete files[fileId]
    tabClose(fileId)
    console.log(fileId,files);
    setFiles(files)
  }
  //编辑标题
  const updateFileName = (id, newValue) => {
    const newFiles = files.map(file => {
      if (file.id === id) {
        file.title = newValue
        file.isNew = false
      }
      return file
    })
    setFiles(newFiles)
  }
  //搜索file
  const fileSearch = (keyWord) => {
    const newFiles = files.filter(file => {
      return file.title && file.title.includes(keyWord)
    })
    setSearchFiles(newFiles)
  }
  //新建file
  const createNewFile = () => {
    let f = {
      id: new Date().getTime() + 1,
      title: '',
      body: '## 请输入 Markdown',
      isNew: true,
      createdAt: new Date().getTime()
    }
    const newFiles = [...files, f]
    setFiles(newFiles)
  }
  return (
    <div className="App container-fluid p-0">
      <div className='row g-0'>
        <div className='col-3 bg-light left-panel p-0'>
          <FileSeach title='我的文档' onFileSearch={fileSearch} />
          <FileList files={useSearchFiles ? searchFiles : filesArr} onFileClick={fileClick} onFileDelete={deleteFile}
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
              <SimpleMDE value={activedFile && activedFile.body} key={activedFile.id} options={{
                minHeight: '430px',
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
