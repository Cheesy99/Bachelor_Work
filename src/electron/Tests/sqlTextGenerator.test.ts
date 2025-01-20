import { expect } from "chai";
import "mocha";
import SqlTextGenerator from "../Backend/SqlTextGenerator.js";
import TableSchema from "../Backend/Interfaces/TableSchema.js";

describe("SqlTextGenerator", () => {
  let sqlTextGenerator: SqlTextGenerator;

  beforeEach(() => {
    sqlTextGenerator = new SqlTextGenerator();
  });

  test("should generate correct SQL schema text for a given table schema", () => {
    const tableSchema: TableSchema = {
      users: ["name", "email", "profile_id"],
      profiles: ["bio", "avatar"],
    };

    const expectedSQL = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT ,
  name VARCHAR(255),
  email VARCHAR(255),
  profile_id INTEGER,
  FOREIGN KEY (profile_id) REFERENCES profile_id(id)
);

CREATE TABLE profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT ,
  bio VARCHAR(255),
  avatar VARCHAR(255)
);

`;

    const result = sqlTextGenerator.createSchemaText(tableSchema);
    expect(result).to.equal(expectedSQL);
  });

  test("should handle empty table schema", () => {
    const tableSchema: TableSchema = {};

    const expectedSQL = "";

    const result = sqlTextGenerator.createSchemaText(tableSchema);
    expect(result).to.equal(expectedSQL);
  });
});
