const fs = window.require('fs').promises
const path = window.require('path')

const fileHelper = {
    readFile: (path) => {
        return fs.readFile(path, { encoding: 'utf-8' })
    },
    writeFile: (path, content) => {
        return fs.writeFile(path, content, { encoding: 'utf-8' })
    },
    renameFile: (path, newPath) => {
        return fs.rename(path, newPath)
    },
    deleteFile: (path) => {
        return fs.unlink(path)
    }
}

export default fileHelper

// const testPath = path.join(__dirname, 'helper.js')
// const testWritePath = path.join(__dirname, 'hello.md')
// const testRenamePath = path.join(__dirname, 'hello1.md')

// fileHelper.readFile(testPath).then((data)=>{
//     console.log(data);
// })
// fileHelper.renameFile(testWritePath, testRenamePath).then(() => {
//     console.log("更改成功");
// })
// fileHelper.deleteFile(testRenamePath).then(() => {
//     console.log("删除成功");
// })