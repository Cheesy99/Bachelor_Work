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
        const databaseExists = await ipcRenderer.invoke("databaseExists");
        if (databaseExists) {
          const data = await ipcRenderer.invoke(
            "getTableData",
            fromID,
            tableName
          );
          callback(data);
        } else {
          console.log("Database is empty");
        }
      }
    );
  },

  sendSqlCommand: (
    command: string,
    tableName: string
  ): Promise<(string | number)[][]> => {
    let result = ipcRenderer.invoke("sqlCommand", command, tableName);
    console.log(result);
    return result;
  },

  databaseExists: () => {
    return ipcRenderer.invoke("databaseExists");
  },
} satisfies Window["electronAPI"]);
