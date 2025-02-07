interface JsonObject {
  [key: string]: string | JsonObject[] | JsonObject | number;
}

export default JsonObject;
