import { expect } from "chai";
import "mocha";
import TableBuilder from "../Backend/TableBuilder.js";
import TableSchema from "../Backend/Interfaces/TableSchema.js";
import JsonObject from "../Backend/Interfaces/JsonObject.js";
import DataBaseConnector from "../Backend/DataBaseConnector.js";

describe("TableBuilder", () => {
  let tableBuilder: TableBuilder;
  let mockDatabaseConnector: DataBaseConnector;

  beforeEach(() => {
    mockDatabaseConnector = DataBaseConnector.getInstance();
    tableBuilder = new TableBuilder();
  });

  test("should build the table with given JSON and schema", async () => {
    const json: JsonObject[] = [
      { id: "1", name: "John Doe", age: "30" },
      { id: "2", name: "Jane Doe", age: "25" },
    ];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "age"],
    };

    mockDatabaseConnector.sqlCommandWithIdResponse = async (statement: any) =>
      1;

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.include(
      "INSERT INTO main_table (id, name, age) VALUES ('1', 'John Doe', '30');"
    );
    expect(result[1]).to.include(
      "INSERT INTO main_table (id, name, age) VALUES ('2', 'Jane Doe', '25');"
    );
  });

  test("should handle nested objects in JSON", async () => {
    const json: JsonObject[] = [
      {
        id: "1",
        name: "John Doe",
        address: { street: "123 Main St", city: "Anytown" },
      },
    ];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "address"],
      address: ["street", "city"],
    };

    mockDatabaseConnector.sqlCommandWithIdResponse = async (statement: any) =>
      1;

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.include(
      "INSERT INTO address (street, city) VALUES ('123 Main St', 'Anytown');"
    );
    expect(result[1]).to.include(
      "INSERT INTO main_table (id, name, address) VALUES ('1', 'John Doe', 1);"
    );
  });

  test("should handle arrays in JSON", async () => {
    const json: JsonObject[] = [
      {
        id: "1",
        name: "John Doe",
        tags: [{ innerKey: "tag1", innerKey1: "tag2" }],
      },
    ];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "tags"],
      tags: ["innerKey", "innerKey1"],
    };

    mockDatabaseConnector.sqlCommandWithIdResponse = async (statement: any) =>
      1;

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).to.have.lengthOf(3);
    expect(result[0]).to.include("INSERT INTO tags (tag) VALUES ('tag1');");
    expect(result[1]).to.include("INSERT INTO tags (tag) VALUES ('tag2');");
    expect(result[2]).to.include(
      "INSERT INTO main_table (id, name, tags) VALUES ('1', 'John Doe', 1, 1);"
    );
  });

  test("should return an empty array when given an empty JSON array", async () => {
    const json: JsonObject[] = [];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "age"],
    };

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).to.be.an("array").that.is.empty;
  });

  test("should throw an error when given an invalid table schema", async () => {
    const json: JsonObject[] = [{ id: "1", name: "John Doe", age: "30" }];
    const tableSchema: TableSchema = {
      invalid_table: ["id", "name", "age"],
    };

    try {
      await tableBuilder.build(json, tableSchema);
    } catch (error) {
      expect(error).to.be.an("error");
    }
  });
});
