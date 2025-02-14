import { ipcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendJsonFile: (fileData: string): Promise<string> => {
    console.log("Preload got called");
    return ipcRenderer.invoke("upload-json", fileData);
  },
  getNestedTableData: (fromID: FromId, tableName: string) =>
    ipcRenderer.invoke("getNestedTableData", fromID, tableName),

  executeSqlCommandStack: (command: any, schema: string[]): Promise<string> => {
    return ipcRenderer.invoke("sqlCommand", command, schema);
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
  getTableSchema: (tableName: string) => {
    return ipcRenderer.invoke("getTableSchema", tableName);
  },

  getRow: (id: number, tableName: string) => {
    return ipcRenderer.invoke("getRow", id, tableName);
  },

  checkIfColumnIsTable: (tableName: string) => {
    return ipcRenderer.invoke("checkIfTable");
  },

  getSaveResult: () => {
    return ipcRenderer.invoke("getSaveResult");
  },

  initTableData: () => {
    return ipcRenderer.invoke("initTableData");
  },
  cleanDatabase: () => {
    return ipcRenderer.invoke("cleanDatabase");
  },

  renameNamingColumn: (
    sqlCommand: string,
    schema: string[],
    newColumnName: string,
    oldColumnName: string
  ) => {
    return ipcRenderer.invoke(
      "renameColumn",
      sqlCommand,
      schema,
      newColumnName,
      oldColumnName
    );
  },
  deleteColumn: (commandStack: string, columnName: string) => {
    return ipcRenderer.invoke("removeColumn", commandStack, columnName);
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
  hasStack: () => {
    return ipcRenderer.invoke("hasStack");
  },

  getStack: () => {
    return ipcRenderer.invoke("getStack");
  },

  popStack() {
    return ipcRenderer.invoke("popStack");
  },
  getAllTableName: () => {
    return ipcRenderer.invoke("getAllTableNames");
  },

  getTable: (command: string) => {
    return ipcRenderer.invoke("getTable", command);
  },
} satisfies Window["electronAPI"]);
