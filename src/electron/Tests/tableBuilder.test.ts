import { describe, it, expect, vi } from "vitest";
import TableBuilder from "../Backend/TableBuilder.js";
import TableSchema from "../Backend/Interfaces/TableSchema.js";
import JsonObject from "../Backend/Interfaces/JsonObject.js";
import DataBaseConnector from "../Backend/DataBaseConnector.js";

describe("TableBuilder", () => {
  it("should build the table and return the correct SQL commands", async () => {
    const json: JsonObject[] = [
      { id: "1", name: "John Doe", age: "30" },
      { id: "2", name: "Jane Doe", age: "25" },
    ];
    const tableSchema: TableSchema = {
      main_table: ["id", "name", "age"],
    };

    const mockDatabaseConnector = vi
      .spyOn(DataBaseConnector.prototype, "sqlCommandWithIdResponse")
      .mockResolvedValue(-1);

    const tableBuilder = new TableBuilder();

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(
      "INSERT INTO main_table (id, name, age) VALUES (1, 'John Doe', '30');"
    );
    expect(result[1]).toBe(
      "INSERT INTO main_table (id, name, age) VALUES (2, 'Jane Doe', '25');"
    );

    mockDatabaseConnector.mockRestore();
  });
});
