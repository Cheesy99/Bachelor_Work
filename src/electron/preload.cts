import { ipcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string): Promise<void> => {
    console.log("Preload got called");
    return ipcRenderer.invoke("upload-json", fileData);
  },
  getNestedTableData: (fromID: FromId, tableName: string) =>
    ipcRenderer.invoke("getNestedTableData", fromID, tableName),

  sendSqlCommand: (command: string, tableName: string): Promise<void> => {
    return ipcRenderer.invoke("sqlCommand", command, tableName);
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
    return ipcRenderer.invoke("exportToExcel");
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

  getTableData: (fromID: FromId, tableName: string) => {
    return ipcRenderer.invoke("getTableData", fromID, tableName);
  },
} satisfies Window["electronAPI"]);
