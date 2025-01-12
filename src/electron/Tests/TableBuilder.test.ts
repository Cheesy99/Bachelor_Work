import TableBuilder from "../Backend/TableBuilder.js";
import DataBaseConnector from "../Backend/DataBaseConnector.js";
import TableSchema from "../Backend/Interfaces/TableSchema.js";
import JsonObject from "../Backend/Interfaces/JsonObject.js";

jest.mock("./DataBaseConnector");

describe("TableBuilder", () => {
  let tableBuilder: TableBuilder;
  let mockDataBaseConnector: jest.Mocked<DataBaseConnector>;

  beforeEach(() => {
    mockDataBaseConnector =
      DataBaseConnector.getInstance() as jest.Mocked<DataBaseConnector>;
    DataBaseConnector.getInstance = jest
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
        addresses: [{ city: "New York", zip: "10001" }],
      },
    ];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "addresses"],
      addresses: ["city", "zip"],
    };

    mockDataBaseConnector.sqlCommandWithIdResponse.mockResolvedValue(1);

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).toEqual([
      "INSERT INTO main_table (id, name, addresses) VALUES (1, 'John Doe', 1);",
      "INSERT INTO addresses (city, zip) VALUES ('New York', '10001');",
    ]);
  });

  test("should handle empty JSON array", async () => {
    const json: JsonObject[] = [];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "age"],
    };

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).toEqual([]);
  });
});
