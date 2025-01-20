interface JsonObject {
  [key: string]: string | JsonObject[] | JsonObject;
}

export default JsonObject;
