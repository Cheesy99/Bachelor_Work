import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import DataLoader from "./DataBase/dataLoader.js";
import JsonToSqlMapper from "./DataBase/jsonToSQLMapper.js";
import SchemaBuilder from "./DataBase/schemaBuilder.js";
import TableData from "./DataBase/Interfaces/TableData.js";
import DatabaseManager from "./DataBase/DataBaseManager/dataBaseManager.js";
const mapper = new JsonToSqlMapper();
const schema = new SchemaBuilder();
const loader = new DataLoader(mapper, schema);
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

  ipcMain.handle(
    "getTableData",
    async (
      event,
      from: [startId: number, endId: number],
      tableName: string
    ) => {
      const tableData: TableData = await loader.getTable(from, tableName);
      console.log("tableName", tableName);
      return tableData;
    }
  );

  ipcMain.on("upload-json", async (event, fileData) => {
    const dbManager = DatabaseManager.getInstance();
    await loader.loadData(fileData);
  });

  loader.on("dataLoaded", (insertedCount: number) => {
    mainWindow.webContents.send("database-change", insertedCount);
  });
});
