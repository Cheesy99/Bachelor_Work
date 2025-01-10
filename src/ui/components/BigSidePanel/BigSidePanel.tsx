import { useState, useContext, useEffect } from "react";
import "./BigSidePanel.css";
import { ViewSetting } from "../../connector/Enum/Setting";
import UiManager from "../../connector/UiManager";
import { Context } from "../../App";

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

function BigSidePanel({
  columnValues,
  rowValues,
  lastClicked,
}: BigSidePanelProps) {
  const context: ContextType | undefined = useContext(Context);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  const [tableData, tableType, loading, uiManager] = context;
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);
  const [selectedRowValues, setSelectedRowValues] = useState<
    (string | number)[]
  >([]);
  const filteredValues = Array.from(
    new Set(
      columnValues.values.filter(
        (value) => typeof value === "string" || typeof value === "number"
      )
    )
  );

  const columnFilter = async (
    value: (string | number)[],
    comlumnName: string
  ) => {
    await uiManager.executeColumnFilter(value, comlumnName);
  };

  const handleCheckboxChange = (value: string | number) => {
    setSelectedColumnValues((prevSelected) =>
      prevSelected.includes(value)
        ? prevSelected.filter((item) => item !== value)
        : [...prevSelected, value]
    );
  };

  return (
    <div className="big-side-panel">
      <h2>{lastClicked === Clicked.Column ? "Column Values" : "Row Values"}</h2>
      <div className="list">
        <ul className="column-elements">
          {lastClicked === Clicked.Column
            ? filteredValues.map((value, index) => (
                <li key={index}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedColumnValues.includes(value)}
                      onChange={() => handleCheckboxChange(value)}
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
              columnFilter(selectedRowValues, columnValues.columnName)
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
