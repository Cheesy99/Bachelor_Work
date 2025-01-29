import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts, createSqlQuery, extractSchema } from "./Utils";
import { ViewSetting } from "./Enum/Setting";
import React from "react";

class UiManager {
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
  private sqlCommand: string;
  private setSqlCommand: React.Dispatch<React.SetStateAction<string>>;
  public constructor(
    converter: Converter,
    setterTableRef: React.Dispatch<React.SetStateAction<Table | null>> | null,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    tableType: ViewSetting,
    limit: number,
    offset: number,
    sqlCommandStack: string[],
    setSqlCommandStack: React.Dispatch<React.SetStateAction<string[]>>,
    sqlCommand: string,
    setSqlCommand: React.Dispatch<React.SetStateAction<string>>
  ) {
    this.setSqlCommandStack = setSqlCommandStack;
    this.sqlCommand = sqlCommand;
    this.setSqlCommand = setSqlCommand;
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

  private setStrategyByViewSetting(viewSetting: ViewSetting) {
    if (viewSetting === ViewSetting.NESTEDTABLES) {
      this.converter.setStrategy(new NestedTableConverter());
    } else {
      this.converter.setStrategy(new OneTableConverter());
    }
  }

  public async executeStack(updatedSqlCommand?: string) {
    const commandToExecute = updatedSqlCommand || this.sqlCommand;
    console.log("what is coming in", commandToExecute);
    let reponse = await window.electronAPI.executeSqlCommandStack(
      createSqlQuery(commandToExecute),
      extractSchema(commandToExecute)
    );

    if (reponse !== "ok") {
      this.setSqlCommand(this.sqlCommand);
      alert("Sql Error occured please try again");
    } else {
      const stack = this.sqlCommandStack;
      stack.push(this.sqlCommand);
      this.setSqlCommandStack(stack);
    }
  }

  public async changingSchemaName(
    newColumnName: string,
    oldColumnName: string
  ) {
    await window.electronAPI.renameNamingColumn(
      createSqlQuery(this.sqlCommand),
      extractSchema(this.sqlCommand),
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
