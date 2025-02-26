import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import sinon from "sinon";
import MainManager from "../Backend/MainManager.js";
import DataBaseConnector from "../Backend/DataBaseConnector.js";
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
    mainManager.saveToDiskWhenQuit();
    expect(writeFileSyncStub.callCount).toBe(1);
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
    expect(result).toBe("SELECT main_table_id FROM main_table  LIMIT 100 OFFSET 0;");
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
    expect(unlinkSyncStub.callCount).toBe(0);});


  it("should get all values for a column", async () => {
    const mockResult = [{ name: "John Doe" }, { name: "Tom Holland" }];
    sandbox
      .stub(DataBaseConnector.prototype, "sqlCommandWithResponse")
      .resolves(mockResult);
    const values = await mainManager.getAllValues("name");
    expect(values).toEqual(["John Doe", "Tom Holland"]);
  });

  it("should return an empty schema and table when result is empty", async () => {
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").resolves([]);
    const result = await mainManager.getTable("SELECT * FROM test_table");
    expect(result).toEqual({ schema: [], table: [] });
  });

  it("should return the correct schema and table when result is not empty", async () => {
    const mockResult = [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Doe" },
    ];
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").resolves(mockResult);
    const result = await mainManager.getTable("SELECT * FROM test_table");
    expect(result).toEqual({
      schema: ["id", "name"],
      table: [
        [1, "John Doe"],
        [2, "Jane Doe"],
      ],
    });
  });

  it("should throw an error when sqlCommandWithResponse fails", async () => {
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").rejects(new Error("Database error"));
    await expect(mainManager.getTable("SELECT * FROM test_table")).rejects.toThrow("Failed to get table");
  });

  it("should pop the last command from the stack", () => {
    mainManager["sqlCommandStack"] = ["command1", "command2"];
    mainManager.popStack();
    expect(mainManager["sqlCommandStack"]).toEqual(["command1"]);
  });

  it("should return true if the database exists", () => {
    const databaseExistsStub = sandbox.stub(DataBaseConnector.prototype, "databaseExists").returns(true);
    expect(mainManager.dataBaseExist).toBe(true);
    expect(databaseExistsStub.calledOnce).toBe(true);
  });

  it("should return false if the database does not exist", () => {
    const databaseExistsStub = sandbox.stub(DataBaseConnector.prototype, "databaseExists").returns(false);
    expect(mainManager.dataBaseExist).toBe(false);
    expect(databaseExistsStub.calledOnce).toBe(true);
  });

  it("should execute SQL command and send result to frontend", async () => {
    const sqlCommand = "SELECT * FROM test_table";
    const mockResult = [{ id: 1, name: "John Doe" }];
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").resolves(mockResult);

    const result = await mainManager.uiSqlCommand(sqlCommand);

    expect(result).toBe(sqlCommand);
    sinon.assert.calledWith(browserWindow.webContents.send, "tableDataFromBackend", mockResult);
    expect(mainManager["sqlCommandStack"]).toContain(sqlCommand);
  });

  it("should return 'error' when SQL command execution fails", async () => {
    const sqlCommand = "SELECT * FROM test_table";
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").rejects(new Error("Database error"));

    const result = await mainManager.uiSqlCommand(sqlCommand);

    expect(result).toBe("error");
    sinon.assert.notCalled(browserWindow.webContents.send);
  });


  it("should export table data to Excel", async () => {
    const sqlCommand = "SELECT * FROM test_table";
    const mockResult = [{ id: 1, name: "John Doe" }];
    const filePath = `${mainManager["persistencePath"]}excelData.xlsx`;

    mainManager["sqlCommandStack"].push(sqlCommand);
    sandbox.stub(mainManager["dataBase"], "sqlCommandWithResponse").resolves(mockResult);
    const exportResultToExcelStub = sandbox.stub(mainManager["excelExporter"], "exportResultToExcel").resolves();

    await mainManager.exportToExcel();

    sinon.assert.calledWith(mainManager["dataBase"].sqlCommandWithResponse, sqlCommand);
    sinon.assert.calledWith(exportResultToExcelStub, { schema: ["id", "name"], table: [[1, "John Doe"]] }, filePath);
  });

  it("should throw an error when export fails", async () => {
    mainManager["sqlCommandStack"].push("SELECT * FROM test_table");
    sandbox.stub(mainManager["dataBase"], "sqlCommandWithResponse").rejects(new Error("Database error"));

    await expect(mainManager.exportToExcel()).rejects.toThrow("Failed to export to Excel");
  });

  it("should load SQL command stack from disk", () => {
    const mockData = JSON.stringify({ sqlCommand: ["SELECT * FROM test_table"] });
    sandbox.stub(fs, "readFileSync").returns(mockData);
    sandbox.stub(path, "resolve").returns("sqlCommandStack.json");

    mainManager.getDiskData();

    expect(mainManager["sqlCommandStack"]).toEqual(["SELECT * FROM test_table"]);
  });

  it("should handle missing sqlCommand in parsed data", () => {
    const mockData = JSON.stringify({ someOtherKey: [] });
    sandbox.stub(fs, "readFileSync").returns(mockData);
    sandbox.stub(path, "resolve").returns("sqlCommandStack.json");
    const consoleErrorStub = sandbox.stub(console, "error");

    mainManager.getDiskData();

    expect(consoleErrorStub.calledWith("Parsed data does not contain sqlCommand:", { someOtherKey: [] })).toBe(true);
  });

  it("should handle JSON parsing errors", () => {
    sandbox.stub(fs, "readFileSync").throws(new Error("JSON parse error"));
    sandbox.stub(path, "resolve").returns("sqlCommandStack.json");
    const consoleErrorStub = sandbox.stub(console, "error");

    expect(() => mainManager.getDiskData()).toThrow("JSON parse error");
    expect(consoleErrorStub.calledWith("Error parsing JSON data:", sinon.match.instanceOf(Error))).toBe(true);
  });

  it("should return true if the table is a foreign table", async () => {
    const tableName = "foreign_table";
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").resolves([{ name: tableName }]);

    const result = await mainManager.isForeignTable(tableName);

    expect(result).toBe(true);
  });

  it("should return false if the table is not a foreign table", async () => {
    const tableName = "main_table";
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").resolves([]);

    const result = await mainManager.isForeignTable(tableName);

    expect(result).toBe(false);
  });

  it("should rename the column and update the sqlCommandStack", async () => {
    const oldColumnName = "old_column";
    const newColumnName = "new_column";
    const tableName = "test_table";
    const sqlCommand = "SELECT * FROM test_table";

    sandbox.stub(mainManager, "getTableName").resolves(tableName);
    const sqlCommandStub = sandbox.stub(mainManager["dataBase"], "sqlCommand").resolves();
    mainManager["sqlCommandStack"] = [sqlCommand];
    const uiSqlCommandStub = sandbox.stub(mainManager, "uiSqlCommand").resolves(sqlCommand);

    const result = await mainManager.renameColumn(newColumnName, oldColumnName);

    expect(result).toBe(sqlCommand);
    sinon.assert.calledWith(sqlCommandStub,     [ '\n    ALTER TABLE test_table \n    RENAME COLUMN old_column TO new_column;\n  ' ]);
    expect(mainManager["sqlCommandStack"]).toEqual([]);
    sinon.assert.calledWith(uiSqlCommandStub, sqlCommand.replace(new RegExp(`\\b${oldColumnName}\\b`, "g"), newColumnName));
  });

  it("should reset the sqlCommandStack and execute initial SQL command", async () => {
    const initialSqlCommand = "";
    sandbox.stub(mainManager, "constructInitialSqlCommand").resolves(initialSqlCommand);
    const uiSqlCommandStub = sandbox.stub(mainManager, "uiSqlCommand").resolves(initialSqlCommand);

    const result = await mainManager.reset();

    expect(result).toBe(initialSqlCommand);
    expect(mainManager["sqlCommandStack"]).toEqual([]);
    sinon.assert.calledWith(uiSqlCommandStub, initialSqlCommand);
  });


  it("should undo the last SQL command and execute the previous one", async () => {
    const sqlCommand1 = "SELECT * FROM table1";
    const sqlCommand2 = "SELECT * FROM table2";
    mainManager["sqlCommandStack"] = [sqlCommand1, sqlCommand2];
    const uiSqlCommandStub = sandbox.stub(mainManager, "uiSqlCommand").resolves(sqlCommand1);

    const result = await mainManager.undo();

    expect(result).toBe(sqlCommand1);
    expect(mainManager["sqlCommandStack"]).toEqual([]);
    sinon.assert.calledWith(uiSqlCommandStub, sqlCommand1);
  });


  it("should return the number of rows in the table", async () => {
    const tableName = "test_table";
    const mockResult = [{ count: 42 }];
    sandbox.stub(DataBaseConnector.prototype, "sqlCommandWithResponse").resolves(mockResult);

    const result = await mainManager.amountOfRows(tableName);

    expect(result).toBe(42);
    sinon.assert.calledWith(DataBaseConnector.prototype.sqlCommandWithResponse, `SELECT COUNT(*) as count FROM ${tableName}`);
  });

  it("should load data from disk if disk files exist", async () => {
    sandbox.stub(mainManager, "checkForDisk").returns(true);
    const getDiskDataStub = sandbox.stub(mainManager, "getDiskData");
    const uiSqlCommandStub = sandbox.stub(mainManager, "uiSqlCommand");

    await mainManager.initTableData();

    expect(getDiskDataStub.calledOnce).toBe(true);
    expect(uiSqlCommandStub.calledOnce).toBe(true);
    expect(uiSqlCommandStub.calledWith(mainManager["sqlCommandStack"][mainManager["sqlCommandStack"].length - 1])).toBe(true);
  });

  it("should construct initial SQL command if disk files do not exist", async () => {
    sandbox.stub(mainManager, "checkForDisk").returns(false);
    const constructInitialSqlCommandStub = sandbox.stub(mainManager, "constructInitialSqlCommand").resolves("SELECT * FROM main_table");
    const uiSqlCommandStub = sandbox.stub(mainManager, "uiSqlCommand");

    await mainManager.initTableData();

    expect(constructInitialSqlCommandStub.calledOnce).toBe(true);
    expect(uiSqlCommandStub.calledOnce).toBe(true);
    expect(uiSqlCommandStub.calledWith("SELECT * FROM main_table")).toBe(true);
  });

  it("should return undefined if the sqlCommandStack is empty", () => {
    mainManager["sqlCommandStack"] = [];

    const result = mainManager.getLastCommand();

    expect(result).toBeUndefined();
  });
});


