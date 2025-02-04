import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import MainManager from "./Backend/MainManager.js";
import { ipcRenderer } from "electron/renderer";

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

  ipcMain.handle("initTableData", async (_) => {
    return await mainManager.initTableData();
  });

  ipcMain.handle("sqlCommand", async (_, command: any, schema: string[]) => {
    return await mainManager.uiSqlCommand(command, schema);
  });

  ipcMain.handle("getRow", async (_, id: number, tableName: string) => {
    return await mainManager.getRow(id, tableName);
  });
  ipcMain.handle("exportToExcel", async (_) => {
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
    async (
      _,
      sqlCommand: string,
      schema: string[],
      newColumnName: string,
      oldColumnName: string
    ) => {
      return await mainManager.renameColumn(
        sqlCommand,
        schema,
        newColumnName,
        oldColumnName
      );
    }
  );

  ipcMain.handle("isForeignTable", async (_, tableName: string) => {
    return await mainManager.isForeignTable(tableName);
  });

  ipcMain.handle("getAllValues", async (_, columnName: string) => {
    return await mainManager.getAllValues(columnName);
  });

  ipcMain.handle("getMaxRowNumber", async (_) => {
    return await mainManager.getMaxRowValue();
  });

  ipcMain.handle("hasStack", async (_) => {
    return await mainManager.hasStack();
  });

  ipcMain.handle("getStack", async (_) => {
    return await mainManager.getStack();
  });

  ipcMain.handle("popStack", async (_) => {
    return await mainManager.popStack();
  });
});

app.on("before-quit", () => {
  if (mainManager) {
    mainManager.saveToDiskWhenQuit();
  }
});
