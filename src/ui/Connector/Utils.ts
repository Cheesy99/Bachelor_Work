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

export const checkSchemaName = (
  schema1: string[],
  schema2: string[]
): string[] => {
  const result = [...schema1];

  schema2.forEach((str) => {
    if (!schema1.includes(str)) {
      result.push(str);
    }
  });

  return result;
};
