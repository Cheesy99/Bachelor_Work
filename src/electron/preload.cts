import { ipcRenderer, IpcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string) => {
    console.log("Preload got called");
    ipcRenderer.send("upload-json", fileData);
  },
  getTableData: (fromID: [startId: number, endId: number], tableName: string) =>
    ipcRenderer.invoke("getTableData", fromID, tableName),

  onDatabaseChange: (callback) => {
    ipcRenderer.on("database-updated", async () => {
      const data = await ipcRenderer.invoke(
        "getTableData",
        [1, 100],
        "main_table"
      );
      callback(data);
    });
  },
} satisfies Window["electronAPI"]);
