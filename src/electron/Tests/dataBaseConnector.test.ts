import { expect } from "chai";
import "mocha";
import sinon from "sinon";
import * as XLSX from "xlsx";
import fs from "fs";
import ExcelExporter from "../Backend/ExcelExporter.js";

describe("ExcelExporter", () => {
  let excelExporter: ExcelExporter;
  let writeFileSyncStub: sinon.SinonStub;
  let aoa_to_sheetStub: sinon.SinonStub;
  let book_newStub: sinon.SinonStub;
  let book_append_sheetStub: sinon.SinonStub;
  let writeStub: sinon.SinonStub;

  beforeEach(() => {
    excelExporter = new ExcelExporter();
    writeFileSyncStub = sinon.stub(fs, "writeFileSync");
    aoa_to_sheetStub = sinon.stub(XLSX.utils, "aoa_to_sheet");
    book_newStub = sinon.stub(XLSX.utils, "book_new");
    book_append_sheetStub = sinon.stub(XLSX.utils, "book_append_sheet");
    writeStub = sinon.stub(XLSX, "write");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should export result to Excel file", async () => {
    const result = {
      schema: ["id", "name", "email"],
      table: [
        [1, "John Doe", "john@example.com"],
        [2, "Jane Doe", "jane@example.com"],
      ],
    };
    const path = "test.xlsx";

    const worksheet = {};
    const workbook = {};
    const excelBuffer = Buffer.from("test buffer");

    aoa_to_sheetStub.returns(worksheet);
    book_newStub.returns(workbook);
    writeStub.returns(excelBuffer);

    await excelExporter.exportResultToExcel(result, path);

    expect(aoa_to_sheetStub.calledOnce).to.be.true;
    expect(aoa_to_sheetStub.calledWith([result.schema, ...result.table])).to.be
      .true;

    expect(book_newStub.calledOnce).to.be.true;
    expect(book_append_sheetStub.calledOnce).to.be.true;
    expect(book_append_sheetStub.calledWith(workbook, worksheet, "Results")).to
      .be.true;

    expect(writeStub.calledOnce).to.be.true;
    expect(writeStub.calledWith(workbook, { bookType: "xlsx", type: "buffer" }))
      .to.be.true;

    expect(writeFileSyncStub.calledOnce).to.be.true;
    expect(writeFileSyncStub.calledWith(path, excelBuffer)).to.be.true;
  });

  it("should handle errors during export", async () => {
    const result = {
      schema: ["id", "name", "email"],
      table: [
        [1, "John Doe", "john@example.com"],
        [2, "Jane Doe", "jane@example.com"],
      ],
    };
    const path = "test.xlsx";

    const error = new Error("Test error");
    writeFileSyncStub.throws(error);

    const consoleErrorStub = sinon.stub(console, "error");

    await excelExporter.exportResultToExcel(result, path);

    expect(consoleErrorStub.calledOnce).to.be.true;
    expect(consoleErrorStub.calledWith("Error exporting to Excel:", error)).to
      .be.true;

    consoleErrorStub.restore();
  });
});
