const {contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    errorChecker: ipcRenderer.on('seeError', (event, errorMessage) => {
        console.log(errorMessage);
    }),
})