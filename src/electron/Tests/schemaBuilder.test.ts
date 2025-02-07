import { expect, test, beforeEach, describe } from "vitest";
import JsonObject from "../../electron/Backend/Interfaces/JsonObject.js";
import TableSchema from "../../electron/Backend/Interfaces/TableSchema.js";
import SchemaBuilder from "../Backend/SchemaBuilder.js";
import SqlTextGenerator from "../Backend/SqlTextGenerator.js";

describe("schemaBuilder", () => {
  let schemaBuilder: SchemaBuilder;
  beforeEach(() => {
    schemaBuilder = new SchemaBuilder(new SqlTextGenerator());
  });

  test("simple schema with command", async () => {
    const json: JsonObject[] = [
      { name: "John Doe", age: "30" },
      { name: "Jane Doe", age: "25" },
    ];
    const tableSchema: TableSchema = {
      main_table: ["name", "age"],
    };

    const result: {
      command: string[];
      tableSchema: TableSchema;
    } = schemaBuilder.generateSchemaWithCommand(json);

    expect(result.tableSchema).toEqual(tableSchema);
    const expectedCommand = [
      "CREATE TABLE main_table (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT ,",
      "  name VARCHAR(255),",
      "  age VARCHAR(255)",
      ")",
    ].join("\n");

    expect(result.command.join("\n")).toEqual(expectedCommand);
  });

  test("nested object schema with command", async () => {
    const json: JsonObject[] = [
      {
        name: "John Doe",
        age: "30",
        address: [
          { city: "New York", zip: "10001" },
          { city: "Los Angeles", zip: "90001" },
        ],
      },
      {
        name: "Jane Doe",
        age: "25",
        address: [],
      },
    ];
    const tableSchema: TableSchema = {
      main_table: ["name", "age", "address"],
      address: ["address_city", "address_zip"],
    };

    const result: {
      command: string[];
      tableSchema: TableSchema;
    } = schemaBuilder.generateSchemaWithCommand(json);

    expect(result.tableSchema).toEqual(tableSchema);

    const expectedCommandAddressTable = [
      "CREATE TABLE main_table (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT ,",
      "  name VARCHAR(255),",
      "  age VARCHAR(255),",
      "  address INTEGER,",
      "  FOREIGN KEY (address) REFERENCES address(id)",
      ")",
      "CREATE TABLE address (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT ,",
      "  address_city VARCHAR(255),",
      "  address_zip VARCHAR(255)",
      ")",
    ].join("\n");

    const normalizeString = (str: string) => str.replace(/\s+/g, " ").trim();

    expect(normalizeString(result.command.join("\n"))).toEqual(
      normalizeString(expectedCommandAddressTable)
    );
  });

  test("nested object schema with command", async () => {
    const json: JsonObject[] = [
      {
        name: "John Doe",
        age: "30",
        address: { city: "New York", zip: "10001" },
      },
      {
        name: "Jane Doe",
        age: "25",
        address: { city: "Los Angeles", zip: "90001" },
      },
    ];
    const tableSchema: TableSchema = {
      main_table: ["name", "age", "address"],
      address: ["address_city", "address_zip"],
    };

    const result: {
      command: string[];
      tableSchema: TableSchema;
    } = schemaBuilder.generateSchemaWithCommand(json);
    expect(result.tableSchema).toEqual(tableSchema);
    const expectedCommandMainTable = [
      "CREATE TABLE main_table (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT ,",
      "  name VARCHAR(255),",
      "  age VARCHAR(255),",
      "  address INTEGER,",
      "  FOREIGN KEY (address) REFERENCES address(id)",
      ")",
      "",
      "CREATE TABLE address (",
      "  id INTEGER PRIMARY KEY AUTOINCREMENT ,",
      "  address_city VARCHAR(255),",
      "  address_zip VARCHAR(255)",
      ")",
    ].join("\n");

    expect(result.command.join("\n")).toEqual(expectedCommandMainTable);
  });
});
