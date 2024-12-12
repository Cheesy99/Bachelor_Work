import * as XLSX from "xlsx";
import fileSaver from "file-saver";

const { saveAs } = fileSaver;
class ExcelExporter {
  public async exportResultToExcel(result: TableData): Promise<void> {
    const worksheet = XLSX.utils.aoa_to_sheet([result.schema, ...result.table]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "results.xlsx");
  }
}

export default ExcelExporter;
