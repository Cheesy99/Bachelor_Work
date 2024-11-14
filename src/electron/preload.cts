import { ipcRenderer, IpcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  uploadFile: (json: string) => ipcRenderer.send("upload-json", json),
  getTable: (fromID: number[]) =>
    electron.ipcRenderer.invoke("getTable", fromID),
});
