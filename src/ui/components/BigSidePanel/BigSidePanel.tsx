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
  rowValues: (string | number)[];
  lastClicked: Clicked;
}

type ContextType = [Table | null, ViewSetting, boolean, UiManager];
type ContextStack = [any[], React.Dispatch<React.SetStateAction<any[]>>];
function BigSidePanel({
  columnValues,
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
  const [tableData, tableType, loading, uiManager] = context;
  const [sqlCommandStack, setSqlCommandStack] = contextCommandStack;
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);
  const [selectedRowValues, setSelectedRowValues] = useState<
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
    const formattedValues = value
      .map((value) => (typeof value === "string" ? `'${value}'` : value))
      .join(", ");
    let command = `AND ${columnName} IN (${formattedValues})`;
    const history = sqlCommandStack;
    history.push(command);
    setSqlCommandStack(history);
    await uiManager.executeStack();
  };

  const handleColumnCheckbox = (value: string | number) => {
    setSelectedColumnValues((prevSelected) =>
      prevSelected.includes(value)
        ? prevSelected.filter((item) => item !== value)
        : [...prevSelected, value]
    );
  };

  const handleDeleteRow = async (id: number, tableName: string) => {
    const command: string = `AND id != ${id}`;
    const history = sqlCommandStack;
    history.push(command);
    setSqlCommandStack(history);
    await uiManager.executeStack();
  };

  const handleDeleteColumn = () => {};

  return (
    <div className="big-side-panel">
      <h2>{lastClicked === Clicked.Column ? "Column Values" : "Row Values"}</h2>
      <div className="list">
        {lastClicked === Clicked.RowId ? (
          <button
            onClick={() =>
              handleDeleteRow(rowValues[0] as number, "main_table")
            }
            className="delete-button"
          >
            Delete Row
          </button>
        ) : (
          <div className="header-column-values">
            <button
              onClick={() => handleDeleteColumn}
              className="delete-button"
            >
              Delete Column
            </button>
            <button
              onClick={() => handleDeleteColumn}
              className="get-all-button"
            >
              Get All
            </button>
            <label className="select-all-button">
              <input type="checkbox" />
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
