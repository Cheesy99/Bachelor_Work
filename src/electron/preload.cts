import { ipcRenderer, IpcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string) => {
    ipcRenderer.send("upload-json", fileData);
  },
  getTableData: (fromID: [startId: number, endId: number], tableName: string) =>
    ipcRenderer.invoke("getTableData", fromID, tableName),

  onDatabaseChange: (callback) => {
    ipcRenderer.on("database-change", (event, amountOfRows) => {
      callback(amountOfRows);
    });
  },
} satisfies Window["electronAPI"]);
