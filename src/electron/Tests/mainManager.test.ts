import { expect } from "chai";
import "mocha";
import sinon from "sinon";
import fs from "fs";
import { BrowserWindow } from "electron";
import DataBaseConnector from "../Backend/DataBaseConnector.js";
import ExcelExporter from "../Backend/ExcelExporter.js";
import MainManager from "../Backend/MainManager.js";
import SchemaBuilder from "../Backend/SchemaBuilder.js";
import TableBuilder from "../Backend/TableBuilder.js";
import SqlTextGenerator from "../Backend/SqlTextGenerator.js";

describe("MainManager", () => {
  let mainManager: MainManager;
  let browserWindowStub: sinon.SinonStubbedInstance<BrowserWindow>;
  let dataBaseConnectorStub: sinon.SinonStubbedInstance<DataBaseConnector>;
  let excelExporterStub: sinon.SinonStubbedInstance<ExcelExporter>;
  let fsStub: sinon.SinonStub;

  beforeEach(() => {
    browserWindowStub = sinon.createStubInstance(BrowserWindow);
    dataBaseConnectorStub = sinon.createStubInstance(DataBaseConnector);
    excelExporterStub = sinon.createStubInstance(ExcelExporter);

    sinon.stub(DataBaseConnector, "getInstance").returns(dataBaseConnectorStub);
    sinon.stub(SchemaBuilder.prototype, "generateSchemaWithCommand").returns({
      command: [],
      tableSchema: {},
    });
    sinon.stub(TableBuilder.prototype, "build").resolves([]);
    sinon.stub(SqlTextGenerator.prototype, "createSchemaText").returns("");

    fsStub = sinon.stub(fs, "readFileSync").returns(JSON.stringify([]));
    sinon.stub(fs, "writeFileSync");
    sinon.stub(fs, "existsSync").returns(true);

    mainManager = MainManager.getInstance(browserWindowStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should initialize MainManager and load schema from disk", () => {
    expect(mainManager).to.be.instanceOf(MainManager);
    expect(fsStub.calledOnce).to.be.true;
  });

  it("should set jumper value", async () => {
    await mainManager.setJumper(200);
    expect(mainManager["indexJump"]).to.equal(200);
  });

  it("should insert JSON data", async () => {
    const json = JSON.stringify([
      { name: "John Doe", email: "john@example.com" },
    ]);
    const result = await mainManager.insertJson(json);
    expect(result).to.equal("ok");
  });

  it("should handle invalid JSON data", async () => {
    const json = "invalid json";
    const result = await mainManager.insertJson(json);
    expect(result).to.equal(
      "Invalid Json object please give valid json object"
    );
  });

  it("should get table data", async () => {
    const from = { startIndex: 0, endIndex: 10 };
    const tableName = "main_table";
    sinon.stub(mainManager, "getTableSchema").resolves(["id", "name", "email"]);
    dataBaseConnectorStub.sqlCommandWithReponse.resolves([
      { id: 1, name: "John Doe", email: "john@example.com" },
    ]);

    await mainManager.GetTableData(from, tableName);

    expect(browserWindowStub.webContents.send).to.be.true;
  });

  it("should save schema to disk", () => {
    mainManager.saveSchemaToDisk();
    expect(fs.writeFileSync).to.be.true;
  });

  it("should get table data object", async () => {
    const fromID = { startId: 0, endId: 10 };
    const tableName = "main_table";
    sinon.stub(mainManager, "getTableSchema").resolves(["id", "name", "email"]);
    dataBaseConnectorStub.sqlCommandWithReponse.resolves([
      { id: 1, name: "John Doe", email: "john@example.com" },
    ]);

    const result = await mainManager.getTableDataObject(fromID, tableName);
    expect(result).to.deep.equal({
      schema: ["id", "name", "email"],
      table: [[1, "John Doe", "john@example.com"]],
    });
  });

  it("should get current index range", async () => {
    const tableName = "main_table";
    dataBaseConnectorStub.sqlCommandWithReponse
      .onFirstCall()
      .resolves([{ minId: 1 }]);
    dataBaseConnectorStub.sqlCommandWithReponse
      .onSecondCall()
      .resolves([{ maxId: 10 }]);

    const result = await mainManager.getCurrentIndexRange(tableName);
    expect(result).to.deep.equal({ startId: 1, endId: 10 });
  });

  it("should execute SQL command and save data to disk", async () => {
    const sqlCommand = "SELECT * FROM main_table";
    const tableName = "main_table";
    sinon.stub(mainManager, "getTableSchema").resolves(["id", "name", "email"]);
    dataBaseConnectorStub.sqlCommandWithReponse.resolves([
      { id: 1, name: "John Doe", email: "john@example.com" },
    ]);

    const result = await mainManager.uiSqlCommand(sqlCommand, tableName);
    expect(result).to.equal("ok");
  });

  it("should handle error when executing SQL command", async () => {
    const sqlCommand = "SELECT * FROM main_table";
    const tableName = "main_table";
    dataBaseConnectorStub.sqlCommandWithReponse.rejects(new Error("SQL error"));

    const result = await mainManager.uiSqlCommand(sqlCommand, tableName);
    expect(result).to.equal(
      "An error occurred while executing the SQL command"
    );
  });

  it("should get table schema", async () => {
    const tableName = "main_table";
    dataBaseConnectorStub.sqlCommandWithReponse.resolves([
      { name: "id" },
      { name: "name" },
      { name: "email" },
    ]);

    const result = await mainManager.getTableSchema(tableName);
    expect(result).to.deep.equal(["id", "name", "email"]);
  });

  it("should check if table exists", async () => {
    const tableName = "main_table";
    dataBaseConnectorStub.sqlCommandWithReponse.resolves([
      { name: "main_table" },
    ]);

    const result = await mainManager.checkForTable(tableName);
    expect(result).to.be.true;
  });

  it("should export data to Excel", async () => {
    sinon.stub(mainManager, "getDiskData").resolves({
      schema: ["id", "name", "email"],
      table: [[1, "John Doe", "john@example.com"]],
    });

    await mainManager.exportToExcel();
    expect(excelExporterStub.exportResultToExcel.calledOnce).to.be.true;
  });

  it("should clean the database", async () => {
    sinon.stub(fs, "unlinkSync");
    await mainManager.cleanDatabase();
    expect(dataBaseConnectorStub.recreateDatabase.calledOnce).to.be.true;
  });

  it("should rename column", async () => {
    const commandStack =
      "ALTER TABLE main_table RENAME COLUMN old_name TO new_name";
    const newColumnName = "new_name";
    const oldColumnName = "old_name";
    mainManager["mainSchema"].set(oldColumnName, "main_table");

    await mainManager.renameColumn(commandStack, newColumnName, oldColumnName);
    expect(dataBaseConnectorStub.sqlCommand.calledOnce).to.be.true;
  });

  it("should remove column", async () => {
    const commandStack = "ALTER TABLE main_table DROP COLUMN column_name";
    const columnName = "column_name";
    mainManager["mainSchema"].set(columnName, "main_table");

    await mainManager.removeColumn(commandStack, columnName);
    expect(dataBaseConnectorStub.sqlCommand.calledOnce).to.be.true;
  });

  it("should get all values for a column", async () => {
    const columnName = "name";
    mainManager["mainSchema"].set(columnName, "main_table");
    dataBaseConnectorStub.sqlCommandWithReponse.resolves([
      { name: "John Doe" },
      { name: "Jane Doe" },
    ]);

    const result = await mainManager.getAllValues(columnName);
    expect(result).to.deep.equal(["John Doe", "Jane Doe"]);
  });
});
