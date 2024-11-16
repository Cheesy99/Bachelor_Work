import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import DataLoader from "./DataBase/dataLoader.js";
import JsonToSqlMapper from "./DataBase/jsonToSQLMapper.js";
import SchemaBuilder from "./DataBase/schemaBuilder.js";

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

  ipcMain.handle("getTableData", () => {});

  ipcMain.on("upload-json", async (event, fileData) => {
    loader.loadData(fileData);
    console.log("File data inserted into database");
    event.sender.send("database-updated");
  });
  loader.on("dataLoaded", (insertedCount: number) => {
    mainWindow.webContents.send("database-change", insertedCount);
  });
});
