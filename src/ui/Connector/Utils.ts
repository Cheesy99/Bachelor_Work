export const translateUmlauts = (text: string): string => {
  return text
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");
};

export const areArraysEqual = (arr1: number[], arr2: number[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
};

export const getMinMax = (values: number[]): FromId => {
  if (values.length === 0) {
    throw new Error("Array is empty");
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { startId: min, endId: max };
};

export const createJoinedSchemaName = (
  mainSchema: string[],
  foreignTableName_columnName: string,
  foreignSchema: string[]
): string[] => {
  const joinedSchema = [...mainSchema];
  const columnIndex = joinedSchema.indexOf(foreignTableName_columnName);

  if (columnIndex !== -1) {
    joinedSchema.splice(columnIndex, 1);
    for (const columnName of foreignSchema) {
      if (columnName !== "id") {
        joinedSchema.push(`${foreignTableName_columnName}.${columnName}`);
      }
    }
  } else {
    throw new Error("ForeignTable name does not match a column name in parent");
  }

  return joinedSchema;
};

export const removeId = (
  table: (string | number)[][]
): (string | number)[][] => {
  return table.map((row) => row.slice(1));
};

export const createSqlQuery = (command: any[]): string => {
  let result: string = "";
  if (command.length !== 0) {
    result = command.join(" ");
    result = result.replace(/AND/, "WHERE");
  }

  result = `FROM main_table ${result}`;
  return result;
};

export const createSqlQueryForView = (
  command: any[],
  schema: string[]
): string => {
  let result: string = "";
  if (command.length !== 0) {
    result = command.join(" ");
    result = result.replace(/AND/, "WHERE");
  }

  result = `SELECT ${schema.join(", ")} FROM main_table ${result}`;
  return result;
};
