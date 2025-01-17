import { expect, test, vi, beforeEach, describe } from "vitest";
import TableBuilder from "../../electron/Backend/TableBuilder.js";
import DataBaseConnector from "../../electron/Backend/DataBaseConnector.js";
import JsonObject from "../../electron/Backend/Interfaces/JsonObject.js";
import TableSchema from "../../electron/Backend/Interfaces/TableSchema.js";
vi.mock("../../electron/Backend/DataBaseConnector.js");

describe("TableBuilder", () => {
  let tableBuilder: TableBuilder;
  let mockDataBaseConnector: {
    sqlCommandWithIdResponse: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDataBaseConnector = {
      sqlCommandWithIdResponse: vi.fn(),
    };

    DataBaseConnector.getInstance = vi
      .fn()
      .mockReturnValue(mockDataBaseConnector);

    tableBuilder = new TableBuilder();
  });

  test("should build table inserts correctly", async () => {
    const json: JsonObject[] = [
      { name: "John Doe", age: "30" },
      { name: "Jane Doe", age: "25" },
    ];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "age"],
    };

    mockDataBaseConnector.sqlCommandWithIdResponse.mockResolvedValue(1);

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).toEqual([
      "INSERT INTO main_table (id, name, age) VALUES (1, 'John Doe', 30);",
      "INSERT INTO main_table (id, name, age) VALUES (2, 'Jane Doe', 25);",
    ]);
  });

  test("should handle nested objects correctly", async () => {
    const json: JsonObject[] = [
      {
        name: "John Doe",
        age: "30",
        address: [
          {
            street: "123 Main St",
            city: "Anytown",
          },
        ],
      },
    ];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "age", "address"],
    };

    mockDataBaseConnector.sqlCommandWithIdResponse.mockResolvedValue(1);

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).toEqual([
      'INSERT INTO main_table (id, name, age, address) VALUES (1, \'John Doe\', 30, \'{"street":"123 Main St","city":"Anytown"}\');',
    ]);
  });
});
