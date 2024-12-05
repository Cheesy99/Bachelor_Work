import { ipcRenderer, IpcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string) => {
    console.log("Preload got called");
    ipcRenderer.send("upload-json", fileData);
  },
  getTableData: (fromID: FromId, tableName: string) =>
    ipcRenderer.invoke("getTableData", fromID, tableName),

  onDatabaseChange: (callback) => {
    ipcRenderer.on(
      "database-updated",
      async (_, fromID: FromId, tableName: string) => {
        const data = await ipcRenderer.invoke(
          "getTableData",
          fromID,
          tableName
        );
        callback(data);
      }
    );
  },

  sendSqlCommand: (command: string, tableName: string) => {
    console.log("Arrived here");
    ipcRenderer.send("sqlCommand", command, tableName);
  },

  databaseExists: () => {
    return ipcRenderer.invoke("databaseExists");
  },
} satisfies Window["electronAPI"]);
