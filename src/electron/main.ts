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

  ipcMain.on("sqlCommand", async (_, command: string, tableName: string) => {
    await dbManager.sqlCommand(command);
    const tableIndex: FromId = await dbManager.getCurrentIndexRange(tableName);
    if (tableIndex.endId > 100) tableIndex.endId = 100;
    mainWindow.webContents.send("database-updated", tableIndex, tableName);
  });
});
