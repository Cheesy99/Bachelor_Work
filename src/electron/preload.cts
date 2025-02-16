import { ipcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string): Promise<string> => {
    return ipcRenderer.invoke("upload-json", fileData);
  },

  executeSqlCommand: (command: string): Promise<string> => {
    return ipcRenderer.invoke("sqlCommand", command);
  },

  subscribeToListener: (callback: (tableObject: TableObject[]) => void) => {
    ipcRenderer.removeAllListeners("tableDataFromBackend");
    ipcRenderer.on("tableDataFromBackend", (_, tableObject) => {
      callback(tableObject);
    });
  },

  databaseExists: () => {
    return ipcRenderer.invoke("databaseExists");
  },

  exportToExcel: () => {
    return ipcRenderer.invoke("exportToExcel");
  },

  initTableData: () => {
    return ipcRenderer.invoke("initTableData");
  },
  cleanDatabase: () => {
    return ipcRenderer.invoke("cleanDatabase");
  },

  renameNamingColumn: (newColumnName: string, oldColumnName: string) => {
    return ipcRenderer.invoke("renameColumn", newColumnName, oldColumnName);
  },

  getAllColumnValues: (columnName: string) => {
    return ipcRenderer.invoke("getAllValues", columnName);
  },
  getMaxRowValue: () => {
    return ipcRenderer.invoke("getMaxRowNumber");
  },
  isForeignTable: (tableName: string) => {
    return ipcRenderer.invoke("isForeignTable", tableName);
  },
  undo: () => {
    return ipcRenderer.invoke("undo");
  },
  reset: () => {
    return ipcRenderer.invoke("reset");
  },
  getAllTableName: () => {
    return ipcRenderer.invoke("getAllTableNames");
  },
  getTable: (command: string) => {
    return ipcRenderer.invoke("getTable", command);
  },

  getLastCommand: () => {
    return ipcRenderer.invoke("getLastCommand");
  },
} satisfies Window["electronAPI"]);
