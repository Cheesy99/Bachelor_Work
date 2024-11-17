import { ipcRenderer, IpcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string) => {
    ipcRenderer.send("upload-json", fileData);
  },
  //Invoke you get a promise back
  getTableData: (fromID: [startId: number, endId: number], tableName: string) =>
    electron.ipcRenderer.invoke("getTableData", fromID, tableName),

  onDatabaseChange: (callback: (amountOfRows: number) => void) => {
    ipcRenderer.on("database-change", (event, amountOfRows) => {
      callback(amountOfRows);
    });
  },
});
