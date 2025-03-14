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
  mainManager = new MainManager(mainWindow);

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

  ipcMain.handle("initTableData", async (_) => {
    return await mainManager.initTableData();
  });

  ipcMain.handle("sqlCommand", async (_, command: string) => {
    return await mainManager.uiSqlCommand(command);
  });

  ipcMain.handle("exportToExcel", async (_, name: string) => {
    await mainManager.exportToExcel(name);
  });

  ipcMain.handle("howManyRows", async (_, tableName: string) => {
    return await mainManager.amountOfRows(tableName);
  });

  ipcMain.handle("cleanDatabase", async (_) => {
    return await mainManager.cleanDatabase();
  });

  ipcMain.handle(
    "renameColumn",
    async (_, newColumnName: string, oldColumnName: string) => {
      return await mainManager.renameColumn(newColumnName, oldColumnName);
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

  ipcMain.handle("getTable", async (_, command) => {
    return await mainManager.getTable(command);
  });
  ipcMain.handle("undo", async (_) => {
    return await mainManager.undo();
  }),
    ipcMain.handle("reset", async (_) => {
      return await mainManager.reset();
    }),
    ipcMain.handle("getAllTableNames", async (_) => {
      return await mainManager.getAllTableName();
    });
  ipcMain.handle("getLastCommand", async (_) => {
    return await mainManager.getLastCommand();
  });
});


