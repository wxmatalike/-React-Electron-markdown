const { app, ipcMain } = require('electron')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })

const qiniuIsConfig = ['accessKey', 'secretKey', 'bucketName'].every(key => {
    return !!settingsStore.get(key)
})
//是否自动同步
let enableAutoSync = settingsStore.get('enableAutoSync')
const template = [
    {
        label: '文件',
        submenu: [
            {
                label: '新建',
                accelerator: 'CmdOrCtrl+N',
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send('create-file')
                }
            },
            {
                label: '保存',
                accelerator: 'CmdOrCtrl+S',
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send('save-file')
                }
            },
            {
                label: '搜索',
                accelerator: 'CmdOrCtrl+F',
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send('search-file')
                }
            },
            {
                label: '导入',
                accelerator: 'CmdOrCtrl+O',
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.send('import-file')
                }
            },
        ]
    },
    {
        label: '编辑',
        submenu: [
            {
                label: '撤销',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            }, {
                label: '重做',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            }, {
                type: 'separator'
            }, {
                label: '剪切',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                label: '复制',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                label: '粘贴',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                label: '全选',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }
        ]
    },
    {
        label: '云同步',
        submenu: [
            {
                label: '设置',
                accelerator: 'Ctrl+,',
                click: () => {
                    ipcMain.emit('open-setting-window')
                }
            },
            {
                label: '自动同步',
                type: 'checkbox',
                enabled: qiniuIsConfig,
                checked: enableAutoSync,
                click: () => {
                    settingsStore.set('enableAutoSync', !enableAutoSync)
                }
            },
            {
                label: '全部同步至云端',
                enabled: qiniuIsConfig,
                click: () => {
                    ipcMain.emit('upload-all-to-qiniu')
                }
            },
            {
                label: '从云端下载至本地',
                enabled: qiniuIsConfig,
                click: () => {
                    ipcMain.emit('download-all-to-local')
                }
            },
        ]
    },
    {
        label: '视图',
        submenu: [
            {
                label: '刷新',
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.reload();
                }
            },
            {
                label: '全屏/窗口',
                accelerator: (function () {
                    if (process.platform === 'darwin')
                        return 'Ctrl+Command+F';
                    else
                        return 'F11';
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                }
            },
            {
                label: '开发者工具',
                accelerator: (function () {
                    if (process.platform === 'darwin')
                        return 'Alt+Command+I';
                    else
                        return 'Ctrl+Shift+I';
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.toggleDevTools();
                }
            },
        ]
    },
    {
        label: '窗口',
        role: 'window',
        submenu: [
            {
                label: '最小化',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: '关闭',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
        ]
    }
];

if (process.platform === 'darwin') {
    const { name } = app;
    template.unshift({
        label: name,
        submenu: [
            {
                label: '关于 ' + name,
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                label: '设置',
                accelerator: 'Ctrl+,',
                click: () => {
                    ipcMain.emit('open-setting-window')
                }
            },
            {
                type: 'separator'
            },
            {
                label: '服务',
                role: 'services',
                submenu: []
            },
            {
                type: 'separator'
            },
            {
                label: '隐藏 ' + name,
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: '隐藏其他',
                accelerator: 'Command+Shift+H',
                role: 'hideothers'
            },
            {
                label: '展示全部',
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: '退出',
                accelerator: 'Command+Q',
                click: function () { app.quit(); }
            },
        ]
    });
    const windowMenu = template.find(function (m) { return m.role === 'window' })
    if (windowMenu) {
        windowMenu.submenu.push(
            {
                type: 'separator'
            },
            {
                label: '置于前面',
                role: 'front'
            }
        );
    }
}

module.exports = template