import FieldNames from "./Interfaces/fieldNames.js";
import JsonObject from "./Interfaces/JsonObject.js";

export class SchemaBuilder {
  private keys: FieldNames[] = [];

  public createSchema(jsonObject: JsonObject) {
    this.collectKeys(jsonObject);
  }

  private collectKeys(
    jsonObject: JsonObject,
    parent: string | null = null
  ): void {
    Object.entries(jsonObject).forEach(([key, value]) => {
      if (isNaN(Number(key))) {
        const adjustedParent = isNaN(Number(parent)) ? parent : null;
        const fieldName: FieldNames = { key, parent: adjustedParent };

        // Check for duplicates before adding to the set
        if (!this.hasDuplicate(fieldName)) {
          this.keys.push(fieldName);
        }
      }

      if (Array.isArray(value)) {
        value.forEach((item) => this.collectKeys(item, key));
      } else if (typeof value === "object" && value !== null) {
        this.collectKeys(value, key);
      }
    });
  }

  private hasDuplicate(fieldName: FieldNames): boolean {
    for (const item of this.keys) {
      if (item.key === fieldName.key && item.parent === fieldName.parent) {
        return true;
      }
    }
    return false;
  }

  public get schema(): FieldNames[] {
    const cleanedSchema = this.cleanKeys(this.keys);
    const sortedSchema = this.sortSchema(cleanedSchema);
    return sortedSchema;
  }

  private sortSchema(Schema: FieldNames[]): FieldNames[] {
    return Schema.sort((a, b) => {
      if (a.parent === null) return -1;
      if (b.parent === null) return 1;
      if (a.parent === b.parent) return 0;
      return a.parent! < b.parent! ? -1 : 1;
    });
  }

  private cleanKeys(Schema: FieldNames[]): FieldNames[] {
    return Schema.map((field) => {
      field.key = field.key.replace(/-/g, "_").replace(/\s+/g, "");
      return field;
    });
  }
}

export default SchemaBuilder;
