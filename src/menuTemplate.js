const { app, shell, ipcMain } = require('electron')

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
                enabled: false,
                checked: false,
                click: () => {
                }
            },
            {
                label: '全部同步至云端',
                enabled: false,
                click: () => {
                }
            },
            {
                label: '从云端下载至本地',
                enabled: false,
                click: () => {
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