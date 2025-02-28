import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import sinon from "sinon";
import MainManager from "../Backend/MainManager.js";
import DataBaseConnector from "../Backend/DataBaseConnector.js";
import ExcelExporter from "../Backend/ExcelExporter.js";
import SchemaBuilder from "../Backend/SchemaBuilder.js";
import TableBuilder from "../Backend/TableBuilder.js";
import SqlTextGenerator from "../Backend/SqlTextGenerator.js";
import { BrowserWindow } from "electron";
import fs from "fs";
import path from "path";

describe("MainManager", () => {
  let mainManager: MainManager;
  let browserWindow: BrowserWindow;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    browserWindow = {
      webContents: {
        send: sandbox.stub(),
      },
    } as unknown as BrowserWindow;
    mainManager = new MainManager(browserWindow);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should initialize correctly", () => {
    expect(mainManager).toBeInstanceOf(MainManager);
  });

  it("should check for disk files", () => {
    sandbox.stub(fs, "existsSync").returns(true);
    const result = mainManager.checkForDisk();
    expect(result).toBe(true);
  });

  it("should handle missing disk files", () => {
    sandbox.stub(fs, "existsSync").returns(false);
    const result = mainManager.checkForDisk();
    expect(result).toBe(false);
  });

  it("should save schema to disk", () => {
    const writeFileSyncStub = sandbox.stub(fs, "writeFileSync");
    mainManager.persistSqlStack();
    expect(writeFileSyncStub.callCount).toBe(4);
  });

  it("should insert JSON data", async () => {
    const json = JSON.stringify([{ name: "John Doe", age: "30" }]);
    sandbox.stub(DataBaseConnector.prototype, "sqlCommand").resolves();
    sandbox
      .stub(DataBaseConnector.prototype, "sqlCommandWithResponse")
      .resolves([]);
    sandbox.stub(SchemaBuilder.prototype, "generateSchemaWithCommand").returns({
      command: [],
      tableSchema: { main_table: ["name", "age"] },
    });
    sandbox.stub(TableBuilder.prototype, "build").resolves([]);
    const result = await mainManager.insertJson(json);
    expect(result).toBe("ok");
  });

  it("should handle invalid JSON data", async () => {
    const json = "invalid json";
    const result = await mainManager.insertJson(json);
    expect(result).toBe("Invalid Json object please give valid json object");
  });

  it("should get the maximum row value", async () => {
    const mockResult = [{ max_id: 10 }];
    sandbox
      .stub(DataBaseConnector.prototype, "sqlCommandWithResponse")
      .resolves(mockResult);
    const maxValue = await mainManager.getMaxRowValue();
    expect(maxValue).toBe(10);
  });

  it("should clean the database", async () => {
    sandbox.stub(DataBaseConnector.prototype, "recreateDatabase").resolves();
    const unlinkSyncStub = sandbox.stub(fs, "unlinkSync");
    await mainManager.cleanDatabase();
    expect(unlinkSyncStub.callCount).toBe(4);
  });

  it("should execute SQL command and update stack", async () => {
    // const sqlCommand = 'SELECT * FROM main_table';
    // sandbox.stub(DataBaseConnector.prototype, 'sqlCommandWithReponse').resolves([]);
    // const result = await mainManager.uiSqlCommand(sqlCommand);
    // expect(result).toBe('ok');
    // expect(mainManager.getStack()).toContain(sqlCommand);
  });

  it("should get all values for a column", async () => {
    const mockResult = [{ name: "John Doe" }, { name: "Tom Holland" }];
    sandbox
      .stub(DataBaseConnector.prototype, "sqlCommandWithResponse")
      .resolves(mockResult);
    const values = await mainManager.getAllValues("name");
    expect(values).toEqual(["John Doe", "Tom Holland"]);
  });
});
