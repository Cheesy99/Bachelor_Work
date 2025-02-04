import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts, createSqlQuery, extractSchema } from "./Utils";
import { ViewSetting } from "./Enum/Setting";
import React from "react";

class UiManager {
  async popStack() {
    await window.electronAPI.popStack();
  }
  private converter: Converter;
  private readonly setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  private setTableData: React.Dispatch<
    React.SetStateAction<Table | null>
  > | null;
  private readonly tableType: ViewSetting;
  private sqlCommandStack: any[];
  private limit: number;
  private offset: number;
  private setSqlCommandStack: React.Dispatch<React.SetStateAction<string[]>>;

  public constructor(
    converter: Converter,
    setterTableRef: React.Dispatch<React.SetStateAction<Table | null>> | null,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    tableType: ViewSetting,
    limit: number,
    offset: number,
    sqlCommandStack: string[],
    setSqlCommandStack: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    this.setSqlCommandStack = setSqlCommandStack;

    this.limit = limit;
    this.offset = offset;
    this.converter = converter;
    this.setTableData = setterTableRef;
    this.setLoading = setLoading;
    this.tableType = tableType;
    this.sqlCommandStack = sqlCommandStack;

    window.electronAPI.subscribeToListener(async (tableData: TableData) => {
      if (this.setTableData) {
        const newSchema = tableData.schema.flatMap((entry) =>
          entry.includes(",") ? entry.split(",").map((e) => e.trim()) : entry
        );
        tableData.schema = newSchema;
        sessionStorage.setItem("TableData", JSON.stringify(tableData));
        this.setTableData(await this.convert(this.tableType));
      }
    });
  }

  async insertJsonData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      const databaseExists = await window.electronAPI.databaseExists();
      if (databaseExists) {
        alert("Database already exists.");
        return;
      }
      const reader = new FileReader();

      reader.onload = async () => {
        this.setLoading(true);
        let fileData = reader.result as string;
        fileData = translateUmlauts(fileData);
        let reponse = await window.electronAPI.sendJsonFile(fileData);
        this.setLoading(false);
        if (reponse !== "ok") {
          alert(reponse);
        }
      };
      reader.readAsText(file);
    }
  }

  public async getTableData() {
    await window.electronAPI.initTableData();
  }

  public async getInitTableData() {
    const databaseExists = await window.electronAPI.databaseExists();
    if (databaseExists && this.setTableData) {
      await window.electronAPI.initTableData();
    }
    if (await window.electronAPI.hasStack()) {
      this.setSqlCommandStack(await window.electronAPI.getStack());
    } else {
      this.setSqlCommandStack([]);
    }
  }

  public async clearOutDatabase(): Promise<void> {
    sessionStorage.clear();
    return await window.electronAPI.cleanDatabase();
  }
  public async convert(tableView: ViewSetting): Promise<Table> {
    const table = sessionStorage.getItem("TableData");
    const result: TableData = JSON.parse(table!);
    this.setStrategyByViewSetting(tableView);
    return await this.converter.convertBackendData(result);
  }

  public async getSchema(tableName: string): Promise<string[]> {
    return await window.electronAPI.getTableSchema(tableName);
  }

  public async export(): Promise<void> {
    return await window.electronAPI.exportToExcel();
  }
  private setStrategyByViewSetting(viewSetting: ViewSetting) {
    if (viewSetting === ViewSetting.NESTEDTABLES) {
      this.converter.setStrategy(new NestedTableConverter());
    } else {
      this.converter.setStrategy(new OneTableConverter());
    }
  }

  public async executeStack(updatedSqlCommand?: string) {
    const commandToExecute =
      updatedSqlCommand ||
      this.sqlCommandStack[this.sqlCommandStack.length - 1];

    let reponse = await window.electronAPI.executeSqlCommandStack(
      createSqlQuery(commandToExecute),
      extractSchema(commandToExecute)
    );

    if (reponse !== "ok") {
      this.sqlCommandStack.pop();
      alert("Sql Error occured please try again");
    } else {
      console.log("Man: ", commandToExecute);
      const stack = [...this.sqlCommandStack, commandToExecute];
      this.setSqlCommandStack(stack);
    }
  }

  public async changingSchemaName(
    newColumnName: string,
    oldColumnName: string
  ) {
    await window.electronAPI.renameNamingColumn(
      createSqlQuery(this.sqlCommandStack[this.sqlCommandStack.length - 1]),
      extractSchema(this.sqlCommandStack[this.sqlCommandStack.length - 1]),
      newColumnName,
      oldColumnName
    );
  }

  async getMaxColumnValue(): Promise<number> {
    return await window.electronAPI.getMaxRowValue();
  }

  async getAllValue(columnName: string): Promise<string[]> {
    return await window.electronAPI.getAllColumnValues(columnName);
  }
}

export default UiManager;
