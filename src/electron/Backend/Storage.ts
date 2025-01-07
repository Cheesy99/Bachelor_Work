import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Storage {
  private tableSchema?: string[];
  public async store(table: (string | number)[][]): Promise<void> {
    const tableData: TableData = { schema: this.tableSchema!, table: table };
    await this.saveTableDataToDisk(tableData, "TableData");
  }

  private async saveTableDataToDisk(
    tableData: TableData,
    fileName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(__dirname, fileName);
      fs.writeFile(filePath, JSON.stringify(tableData, null, 2), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export default Storage;
