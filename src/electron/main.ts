import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import MainManager from "./Backend/MainManager.js";
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
  const dbManager = MainManager.getInstance(mainWindow);

  ipcMain.handle("databaseExists", async () => {
    return dbManager.dataBaseExist;
  });
  ipcMain.handle("upload-json", async (_, fileData: string) => {
    try {
      if (dbManager) {
        await dbManager.insertJson(fileData);
      } else {
        console.error(
          "MainManager instance or insertJson method is not defined"
        );
      }
    } catch (error) {
      console.error("Error handling upload-json event:", error);
    }
  });

  ipcMain.handle("subscribeListener", async (_, callback): Promise<void> => {
    return dbManager.setListener(callback);
  });

  ipcMain.handle(
    "getTableData",
    async (_, fromID: FromId, tableName: string) => {
      return await dbManager.getTableData(fromID, tableName);
    }
  );

  ipcMain.handle(
    "sqlCommand",
    async (_, command: string, tableName: string) => {
      let result = await dbManager.sqlCommand(command);
      return result;
    }
  );

  ipcMain.handle("exportToExcel", async (_, result: TableData) => {
    await dbManager.exportToExcel(result);
  });

  ipcMain.handle("getTableSchema", async (_, tableName: string) => {
    return await dbManager.getTableSchema(tableName);
  });

  ipcMain.handle("checkIfTable", async (_, tableName: string) => {
    return await dbManager.checkForTable(tableName);
  });

  ipcMain.handle("howManyRows", async (_, tableName: string) => {
    return await dbManager.amountOfRows(tableName);
  });

  ipcMain.handle("saveResult", async (_, tableData) => {
    return await dbManager.saveResult(tableData);
  });

  ipcMain.handle("getSavedResult", async (_) => {
    return await dbManager.getSavedResult();
  });

  ipcMain.handle("insertBig", async (_, fileData) => {
    return await dbManager.insertBig(fileData);
  });
});
