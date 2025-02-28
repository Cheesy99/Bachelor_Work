import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import sinon from "sinon";
import DataBaseConnector from "../Backend/DataBaseConnector.js";
import sqlite3 from "sqlite3";
import fs from "fs";

vi.mock("sqlite3");
vi.mock("fs");

describe("DataBaseConnector", () => {
  let databaseConnector: DataBaseConnector;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    databaseConnector = DataBaseConnector.getInstance();
    databaseConnector["dataBase"] = {
      close: sandbox.stub(),
      get: sandbox.stub(),
      all: sandbox.stub(),
      run: sandbox.stub(),
      serialize: sandbox.stub(),
    } as unknown as sqlite3.Database;
  });

  afterEach(() => {
    sandbox.restore();
    vi.clearAllMocks();
  });

  it("should close the database", async () => {
    const closeStub = databaseConnector["dataBase"].close as sinon.SinonStub;
    closeStub.callsFake((callback) => callback(null));

    await databaseConnector.closeDatabase();

    expect(closeStub.calledOnce).toBe(true);
  });

  it("should reject if closing the database fails", async () => {
    const closeStub = databaseConnector["dataBase"].close as sinon.SinonStub;
    const error = new Error("Test error");
    closeStub.callsFake((callback) => callback(error));

    await expect(databaseConnector.closeDatabase()).rejects.toThrow("Test error");
  });

  it("should delete the database file", async () => {
    sandbox.stub(databaseConnector, "closeDatabase").resolves();
    const unlinkSyncStub = sandbox.stub(fs, "unlinkSync");

    await databaseConnector["deleteDatabase"]();

    expect(unlinkSyncStub.calledOnceWith(databaseConnector["dbPath"])).toBe(true);
  });

  it("should recreate the database", async () => {
    sandbox.stub(databaseConnector, "deleteDatabase").resolves();
    const newDatabaseStub = sandbox.stub(sqlite3, "Database").callsFake((path, callback) => callback(null));

    await databaseConnector.recreateDatabase();

    expect(newDatabaseStub.calledOnceWith(databaseConnector["dbPath"])).toBe(true);
  });

  it("should check if the database exists", async () => {
    const getStub = databaseConnector["dataBase"].get as sinon.SinonStub;
    getStub.callsFake((query, callback) => callback(null, { count: 1 }));

    const exists = await databaseConnector.databaseExists();

    expect(getStub.calledOnce).toBe(true);
    expect(exists).toBe(true);
  });

  it("should execute SQL command with response", async () => {
    const allStub = databaseConnector["dataBase"].all as sinon.SinonStub;
    allStub.callsFake((sqlCommand, callback) => callback(null, [{ id: 1 }]));

    const response = await databaseConnector.sqlCommandWithResponse("SELECT * FROM test");

    expect(allStub.calledOnceWith("SELECT * FROM test")).toBe(true);
    expect(response).toEqual([{ id: 1 }]);
  });


  it("should reject if there is an error executing the SQL command", async () => {
    const runStub = databaseConnector["dataBase"].run as sinon.SinonStub;
    const error = new Error("Test error");
    runStub.callsFake((sqlCommand, callback) => callback(error));

    await expect(databaseConnector.sqlCommandWithIdResponse("INSERT INTO test (name) VALUES ('test')")).rejects.toThrow("Test error");

    expect(runStub.calledOnceWith("INSERT INTO test (name) VALUES ('test')")).toBe(true);
  });

  it("should reject if any SQL command fails", async () => {
    const sqlCommands = ["INSERT INTO test (id) VALUES (1)", "INSERT INTO test (id) VALUES (2)"];
    const serializeStub = databaseConnector["dataBase"].serialize as sinon.SinonStub;
    const runStub = databaseConnector["dataBase"].run as sinon.SinonStub;
    const error = new Error("Test error");
    const processExitStub = sandbox.stub(process, "exit");

    serializeStub.callsFake((fn) => fn());
    runStub.withArgs("BEGIN TRANSACTION").callsFake((sql, callback) => {
      if (typeof callback === 'function') callback(null);
    });

    runStub.withArgs(sqlCommands[0]).callsFake((sql, callback) => {
      if (typeof callback === 'function') callback(error);
    });

    try {
      await databaseConnector.sqlCommand(sqlCommands);
      throw new Error("Should have rejected");
    } catch (err) {
      expect(err.message).toBe("Test error");
      expect(processExitStub.calledOnceWith(1)).toBe(true);
    }

    expect(serializeStub.calledOnce).toBe(true);
    expect(runStub.calledWith("BEGIN TRANSACTION")).toBe(true);
    expect(runStub.calledWith(sqlCommands[0])).toBe(true);
  });

  it("should reject if error occurs while checking database tables", async () => {
    const getStub = databaseConnector["dataBase"].get as sinon.SinonStub;
    const error = new Error("Test error");
    const consoleErrorStub = sandbox.stub(console, "error");

    getStub.callsFake((query, callback) => callback(error));

    await expect(databaseConnector.databaseExists()).rejects.toThrow("Test error");

    expect(consoleErrorStub.calledOnceWith(
        "Error checking if database has tables:",
        error.message,
        error
    )).toBe(true);
  });

  it("should reject if commit fails", async () => {
    const sqlCommands = ["INSERT INTO test (id) VALUES (1)"];
    const serializeStub = databaseConnector["dataBase"].serialize as sinon.SinonStub;
    const runStub = databaseConnector["dataBase"].run as sinon.SinonStub;
    const error = new Error("Commit error");
    const processExitStub = sandbox.stub(process, "exit");
    const consoleErrorStub = sandbox.stub(console, "error");

    serializeStub.callsFake((fn) => fn());

    runStub.withArgs("BEGIN TRANSACTION").callsFake((sql, callback) => {
      if (typeof callback === 'function') callback(null);
    });

    runStub.withArgs(sqlCommands[0]).callsFake((sql, callback) => {
      if (typeof callback === 'function') callback(null);
    });

    runStub.withArgs("COMMIT").callsFake((sql, callback) => {
      if (typeof callback === 'function') callback(error);
    });

    try {
      await databaseConnector.sqlCommand(sqlCommands);
      throw new Error("Should have rejected");
    } catch (err) {
      expect(err.message).toBe("Commit error");
      expect(processExitStub.calledOnceWith(1)).toBe(true);
      expect(consoleErrorStub.calledWith(
          "Error committing transaction:",
          error.message,
          error
      )).toBe(true);
    }
  });
});