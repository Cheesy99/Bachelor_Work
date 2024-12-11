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
  const dbManager = MainManager.getInstance();

  ipcMain.handle("databaseExists", async () => {
    return dbManager.dataBaseExist;
  });
  ipcMain.on("upload-json", async (_, fileData: string) => {
    try {
      if (dbManager && typeof dbManager.insertJson === "function") {
        await dbManager.insertJson(fileData);
        const tableIndex: FromId = await dbManager.getCurrentIndexRange(
          "main_table"
        );
        if (tableIndex.endId > 100) tableIndex.endId = 100;
        mainWindow.webContents.send(
          "database-updated",
          tableIndex,
          "main_table"
        );
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

  ipcMain.handle("exportToExcel", async () => {
    await dbManager.exportToExcel();
  });

  ipcMain.handle("getTableSchema", async (_, tableName: string) => {
    return await dbManager.getTableSchema(tableName);
  });

  ipcMain.handle("getRow", async (_, id: number, tableName: string) => {
    return await dbManager.getRow(id, tableName);
  });

  ipcMain.handle("checkIfTable", async (_, tableName: string) => {
    return await dbManager.checkForTable(tableName);
  });
});
