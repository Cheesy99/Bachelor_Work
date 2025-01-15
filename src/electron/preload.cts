import { ipcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string): Promise<string> => {
    console.log("Preload got called");
    return ipcRenderer.invoke("upload-json", fileData);
  },
  getNestedTableData: (fromID: FromId, tableName: string) =>
    ipcRenderer.invoke("getNestedTableData", fromID, tableName),

  executeSqlCommandStack: (
    command: any,
    tableName: string
  ): Promise<string> => {
    return ipcRenderer.invoke("sqlCommand", command, tableName);
  },

  subscribeToListener: (
    callback: (tableData: TableData, fromDisk: boolean) => void
  ) => {
    ipcRenderer.removeAllListeners("tableDataFromBackend");
    ipcRenderer.on("tableDataFromBackend", (_, tableData, fromDisk) => {
      callback(tableData, fromDisk);
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

  getSaveResult: () => {
    return ipcRenderer.invoke("getSaveResult");
  },

  getTableData: (from: From, tableName: string) => {
    return ipcRenderer.invoke("getTableData", from, tableName);
  },
  cleanDatabase: () => {
    return ipcRenderer.invoke("cleanDatabase");
  },

  renameNamingColumn: (
    commandStack: string,
    newColumnName: string,
    oldColumnName: string
  ) => {
    return ipcRenderer.invoke(
      "renameColumn",
      commandStack,
      newColumnName,
      oldColumnName
    );
  },
} satisfies Window["electronAPI"]);
