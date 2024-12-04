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

  ipcMain.on("upload-json", async (event, fileData: string) => {
    try {
      console.log("Arrived here");
      const dbManager = MainManager.getInstance();
      if (dbManager && typeof dbManager.insertJson === "function") {
        await dbManager.insertJson(fileData);
        mainWindow.webContents.send("database-updated");
      } else {
        console.error(
          "MainManager instance or insertJson method is not defined"
        );
      }

      ipcMain.handle(
        "getTableData",
        async (
          _,
          fromID: [startId: number, endId: number],
          tableName: string
        ) => {
          const dbManager = MainManager.getInstance();
          return await dbManager.getTableData(fromID, tableName);
        }
      );
    } catch (error) {
      console.error("Error handling upload-json event:", error);
    }
  });
});
