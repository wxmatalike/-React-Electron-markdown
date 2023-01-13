import './App.css';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSeach from './components/FileSearch';
import defaultFiles from './utils/defaultFiles';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';

function App() {
  return (
    <div className="App container-fluid">
      <div className='row p-0'>
        <div className='col-3 bg-light left-panel p-0'>
          <FileSeach title='云文档' onFileSearch={(value) => { console.log(value) }} />
          <FileList files={defaultFiles} onFileClick={(id) => { console.log(id) }} onFileDelete={(id) => { console.log('del', id) }}
            onSaveEdit={(id, newValue) => { console.log(id, newValue); }} />
          <div className='row g-0'>
            <div className='col d-grid'>
              <BottomBtn text='新建' color='btn-primary' icon={faPlus} />
            </div>
            <div className='col d-grid'>
              <BottomBtn text='导入' color='btn-success' icon={faFileImport} />
            </div>
          </div>
        </div>
        <div className='col-9 right-panel'>
          <TabList files={defaultFiles} onTabClick={(id) => { console.log(id) }}
            activeId='1' onCloseTab={(id) => { console.log('colse', id) }}
            unsaveIds={['1','2']} />
        </div>
      </div>
    </div>
  );
}

export default App;
