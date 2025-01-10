import * as XLSX from "xlsx";
import fs from "fs";

class ExcelExporter {
  public async exportResultToExcel(
    result: TableData,
    path: string
  ): Promise<void> {
    try {
      console.log("Starting export to Excel...");
      const worksheet = XLSX.utils.aoa_to_sheet([
        result.schema,
        ...result.table,
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
      console.log("Workbook created");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });
      console.log("Excel buffer created");

      fs.writeFileSync(path, excelBuffer);
      console.log(`Excel file saved to: ${path}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  }
}

export default ExcelExporter;
