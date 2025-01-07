import { ipcRenderer, IpcRendererEvent } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string): Promise<void> => {
    console.log("Preload got called");
    return ipcRenderer.invoke("upload-json", fileData);
  },
  getTableData: (fromID: FromId, tableName: string) =>
    ipcRenderer.invoke("getTableData", fromID, tableName),

  sendSqlCommand: (
    command: string,
    tableName: string
  ): Promise<(string | number)[][]> => {
    let result = ipcRenderer.invoke("sqlCommand", command, tableName);
    console.log(result);
    return result;
  },

  subscribeToListener: (callback: (tableData: TableData) => void) => {
    ipcRenderer.on("tableDataFromBackend", (_, tableData) => {
      callback(tableData);
    });
  },

  databaseExists: () => {
    return ipcRenderer.invoke("databaseExists");
  },

  exportToExcel: () => {
    return ipcRenderer.send("exportToExcel");
  },
  getTableSchema: (tableName: string) => {
    return ipcRenderer.invoke("getTableSchema", tableName);
  },

  getRow: (id: number, tableName: string) => {
    return ipcRenderer.invoke("getRow", id, tableName);
  },

  checkIfColumnIsTable: (tableName: string) => {
    return ipcRenderer.invoke("checkIfTable");
  },

  howManyRows: (tableName: string) => {
    return ipcRenderer.invoke("howManyRows", tableName);
  },

  saveResult: (tableData: TableData) => {
    return ipcRenderer.invoke("saveResult", tableData);
  },
  getSaveResult: () => {
    return ipcRenderer.invoke("getSaveResult");
  },
} satisfies Window["electronAPI"]);
