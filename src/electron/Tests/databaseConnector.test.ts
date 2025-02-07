import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import sinon from "sinon";
import DataBaseConnector from "../Backend/DataBaseConnector.js";

describe("DataBaseConnector", () => {
  let dataBaseConnector: DataBaseConnector;
  let sandbox: sinon.SinonSandbox;
  let mockDb: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    dataBaseConnector = DataBaseConnector.getInstance();

    // Mock the db property
    mockDb = {
      all: sandbox.stub(),
      run: sandbox.stub(),
      exec: sandbox.stub(),
    };
    (dataBaseConnector as any)["db"] = mockDb;
  });

  afterEach(async () => {
    sandbox.restore();
    DataBaseConnector["instance"] = null as unknown as DataBaseConnector;

    // Ensure the table does not exist before running the test
    await dataBaseConnector.sqlCommand(["DROP TABLE IF EXISTS users"]);
  });
});
