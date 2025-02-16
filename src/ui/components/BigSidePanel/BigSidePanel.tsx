import { useState, useContext, useEffect } from "react";
import "./BigSidePanel.css";
import { ViewSetting } from "../../connector/Enum/Setting";
import UiManager from "../../connector/UiManager";
import { Context, ContextCommandStack } from "../../App";

enum Clicked {
  RowId,
  Column,
}

interface BigSidePanelProps {
  columnValues: { values: (string | number | TableData)[]; columnName: string };
  closeSidePanel: React.Dispatch<React.SetStateAction<boolean>>;
  rowValues: (string | number)[];
  lastClicked: Clicked | undefined;
}

type ContextType = [
  Table | null,
  ViewSetting,
  boolean,
  UiManager,
  React.Dispatch<React.SetStateAction<Table | null>>
];
type ContextStack = [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  number,
  React.Dispatch<React.SetStateAction<number>>,
  number,
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>
];
function BigSidePanel({
  columnValues,
  closeSidePanel,
  rowValues,
  lastClicked,
}: BigSidePanelProps) {
  const context: ContextType | undefined = useContext(Context);
  const contextCommandStack: ContextStack | undefined =
    useContext(ContextCommandStack);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  if (!contextCommandStack) {
    throw new Error("contextCommandStack is not defined");
  }
  const [tableData, tableType, loading, uiManager, setTableData] = context;
  const [
    sqlCommandStack,
    setSqlCommandStack,
    amountOfShownRows,
    setIndexStart,
    indexStart,
    selectedAll,
    setSelectedAll,
  ] = contextCommandStack;
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);
  const filteredColumnValues = Array.from(
    new Set(
      columnValues.values.filter(
        (value) => typeof value === "string" || typeof value === "number"
      )
    )
  );

  const columnFilter = async (
    value: (string | number)[],
    columnName: string
  ) => {
    const uniqueValues = Array.from(new Set(value));
    const nonEmptyValues = uniqueValues.filter(
      (val) =>
        val !== null &&
        val !== undefined &&
        val !== "" &&
        val !== "null" &&
        val !== "undefined"
    );
    const formattedValues = nonEmptyValues
      .map((value) => (typeof value === "string" ? `'${value}'` : value))
      .join(", ");
    const newCondition = `${columnName} IN (${formattedValues})`;

    let newSqlCommand = sqlCommandStack[sqlCommandStack.length - 1];
    if (newSqlCommand.includes("WHERE")) {
      // If there's already a WHERE clause, add the new condition with AND
      newSqlCommand = newSqlCommand.replace(
        /WHERE\s+(.+?)(\s+LIMIT|\s+OFFSET|$)/i,
        `WHERE $1 AND ${newCondition}$2`
      );
    } else {
      // If there's no WHERE clause, add one with the new condition
      newSqlCommand = newSqlCommand.replace(
        /(FROM main_table)(\s+LIMIT|\s+OFFSET|$)/i,
        `$1 WHERE ${newCondition}$2`
      );
    }

    await uiManager.executeSqlCommand(newSqlCommand);
  };

  const handleColumnCheckbox = (value: string | number) => {
    setSelectedColumnValues((prevSelected) =>
      prevSelected.includes(value)
        ? prevSelected.filter((item) => item !== value)
        : [...prevSelected, value]
    );
  };

  const handleDeleteRow = async (id: number) => {
    const newCondition = `id != ${id}`;

    let newSqlCommand = sqlCommandStack[sqlCommandStack.length - 1];
    if (newSqlCommand.includes("WHERE")) {
      // If there's already a WHERE clause, add the new condition with AND
      newSqlCommand = newSqlCommand.replace(
        /WHERE\s+(.+?)(\s+LIMIT|\s+OFFSET|$)/i,
        `WHERE $1 AND ${newCondition}$2`
      );
    } else {
      // If there's no WHERE clause, add one with the new condition
      newSqlCommand = newSqlCommand.replace(
        /(FROM main_table)(\s+LIMIT|\s+OFFSET|$)/i,
        `$1 WHERE ${newCondition}$2`
      );
    }

    await uiManager.executeSqlCommand(newSqlCommand);
    closeSidePanel(false);
  };

  const handleDeleteColumn = async () => {
    if (tableData) {
      const deleteThisColumn = columnValues.columnName;
      let index = tableData?.schema.findIndex(
        (col) => col === deleteThisColumn
      );
      let newSchema = tableData!.schema;
      if (index !== -1 && index) {
        newSchema.splice(index, 1);
      }

      setTableData({
        schema: newSchema,
        table: tableData?.table!,
      });

      let newSqlCommand = sqlCommandStack[sqlCommandStack.length - 1];
      const selectColumnsMatch = newSqlCommand.match(/SELECT\s+(.*?)\s+FROM/i);
      if (selectColumnsMatch && selectColumnsMatch[1]) {
        let selectColumns = selectColumnsMatch[1]
          .split(",")
          .map((col) => col.trim());
        selectColumns = selectColumns.filter((col) => col !== deleteThisColumn);
        newSqlCommand = newSqlCommand.replace(
          /SELECT\s+(.*?)\s+FROM/i,
          `SELECT ${selectColumns.join(", ")} FROM`
        );
      }

      await uiManager.executeSqlCommand(newSqlCommand);
      closeSidePanel(false);
    }
  };

  const handleSelectAll = async () => {
    if (!selectedAll) {
      const allValues = await uiManager.getAllValue(columnValues.columnName);
      setSelectedColumnValues(allValues);
    } else {
      setSelectedColumnValues([]);
    }
    setSelectedAll(!selectedAll);
  };

  return (
    <div className="big-side-panel">
      <h2>{lastClicked === Clicked.Column ? "Column Values" : "Row Values"}</h2>
      <div className="list">
        {lastClicked === Clicked.RowId ? (
          <button
            onClick={() => handleDeleteRow(rowValues[0] as number)}
            className="delete-button"
          >
            Delete Row
          </button>
        ) : (
          <div className="header-column-values">
            <button
              onClick={() => handleDeleteColumn()}
              className="delete-button"
            >
              Delete Column
            </button>
            <label className="select-all-button">
              <input
                type="checkbox"
                checked={selectedAll}
                onChange={handleSelectAll}
              />
              Select all
            </label>
          </div>
        )}
        <ul className="column-elements">
          {lastClicked === Clicked.Column
            ? filteredColumnValues.map((value, index) => (
                <li key={index}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedColumnValues.includes(value)}
                      onChange={() => handleColumnCheckbox(value)}
                    />
                    {value}
                  </label>
                </li>
              ))
            : rowValues.map((value, index) => (
                <li key={index}>
                  <h3>{tableData?.schema[index]}</h3>
                  {value}
                </li>
              ))}
        </ul>
      </div>
      <div className="buttons">
        {lastClicked === Clicked.Column ? (
          <button
            onClick={() =>
              columnFilter(selectedColumnValues, columnValues.columnName)
            }
          >
            filter
          </button>
        ) : (
          <button>filter</button>
        )}
      </div>
    </div>
  );
}

export default BigSidePanel;
