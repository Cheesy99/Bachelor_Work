import { ipcRenderer, IpcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string) => {
    console.log(fileData);
    ipcRenderer.send("upload-json", fileData);
  },
  //Invoke you get a promise back
  getTableData: (fromID: number[]) =>
    electron.ipcRenderer.invoke("getTable", fromID),

  onDatabaseChange: (callback: (amountOfRows: number) => void) => {
    ipcRenderer.on("database-change", (event, amountOfRows) => {
      callback(amountOfRows);
    });
  },
});
