import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import MainManager from "./Backend/MainManager.js";

ipcMain.setMaxListeners(20);
let mainManager: MainManager;
app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    title: "JSON cleaner",
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
  mainManager = MainManager.getInstance(mainWindow);

  ipcMain.handle("databaseExists", async () => {
    return mainManager.dataBaseExist;
  });
  ipcMain.handle("upload-json", async (_, fileData: string) => {
    try {
      if (mainManager) {
        return await mainManager.insertJson(fileData);
      } else {
        console.error(
          "MainManager instance or insertJson method is not defined"
        );
      }
    } catch (error) {
      console.error("Error handling upload-json event:", error);
    }
  });

  ipcMain.handle(
    "getNestedTableData",
    async (_, fromID: FromId, tableName: string) => {
      return await mainManager.getTableDataObject(fromID, tableName);
    }
  );

  ipcMain.handle("getTableData", async (_, from: From, tableName: string) => {
    return await mainManager.GetTableData(from, tableName);
  });

  ipcMain.handle("sqlCommand", async (_, command: any, tableName: string) => {
    return await mainManager.uiSqlCommand(command, tableName);
  });

  ipcMain.handle("getRow", async (_, id: number, tableName: string) => {
    return await mainManager.getRow(id, tableName);
  });
  ipcMain.handle("exportToExcel", async (_, result: TableData) => {
    await mainManager.exportToExcel();
  });

  ipcMain.handle("getTableSchema", async (_, tableName: string) => {
    return await mainManager.getTableSchema(tableName);
  });

  ipcMain.handle("checkIfTable", async (_, tableName: string) => {
    return await mainManager.checkForTable(tableName);
  });

  ipcMain.handle("howManyRows", async (_, tableName: string) => {
    return await mainManager.amountOfRows(tableName);
  });

  ipcMain.handle("getSavedResult", async (_) => {
    return await mainManager.getDiskData();
  });
  ipcMain.handle("cleanDatabase", async (_) => {
    return await mainManager.cleanDatabase();
  });

  ipcMain.handle(
    "renameColumn",
    async (_, commandStack: string, tableName: string, columnName: string) => {
      return await mainManager.renameColumn(
        commandStack,
        tableName,
        columnName
      );
    }
  );

  ipcMain.handle(
    "removeColumn",
    async (_, commandStack: string, columnName: string) => {
      return await mainManager.removeColumn(commandStack, columnName);
    }
  );

  ipcMain.handle("getAllValues", async (_, columnName: string) => {
    return await mainManager.getAllValues(columnName);
  });

  ipcMain.handle("setJump", async (_, jump: number) => {
    return await mainManager.setJumper(jump);
  });
});

app.on("before-quit", () => {
  if (mainManager) {
    mainManager.saveSchemaToDisk();
  }
});
