import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import sinon from "sinon";
import ExcelExporter from "../Backend/ExcelExporter.js";
import * as XLSX from "xlsx";
import fs from "fs";


vi.mock("xlsx");
vi.mock("fs");

describe("ExcelExporter.exportResultToExcel", () => {
  let excelExporter: ExcelExporter;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    excelExporter = new ExcelExporter();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should export result to Excel file", async () => {
    const result = {
      schema: ["Column1", "Column2"],
      table: [
        ["Data1", "Data2"],
        ["Data3", "Data4"],
      ],
    };
    const path = "test.xlsx";

    XLSX.utils.aoa_to_sheet = vi.fn().mockReturnValue({});
    XLSX.utils.book_new = vi.fn().mockReturnValue({});
    XLSX.write = vi.fn().mockReturnValue(Buffer.from([]));

    await excelExporter.exportResultToExcel(result, path);

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([result.schema, ...result.table]);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.write).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(path, Buffer.from([]));
  });

  it("should log an error if exporting fails", async () => {
    const result = {
      schema: ["Column1", "Column2"],
      table: [
        ["Data1", "Data2"],
        ["Data3", "Data4"],
      ],
    };
    const path = "test.xlsx";

    sandbox.stub(XLSX.utils, "aoa_to_sheet").throws(new Error("Test error"));
    const consoleErrorStub = sandbox.stub(console, "error");

    await excelExporter.exportResultToExcel(result, path);

    expect(consoleErrorStub.calledOnce).toBe(true);
    expect(consoleErrorStub.calledWith("Error exporting to Excel:", sinon.match.instanceOf(Error))).toBe(true);
  });
});