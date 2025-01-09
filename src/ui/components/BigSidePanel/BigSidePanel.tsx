import { useState, useContext, useEffect } from "react";
import "./BigSidePanel.css";
import { ViewSetting } from "../../connector/Enum/Setting";
import UiManager from "../../connector/UiManager";
import { Context } from "../../App";

interface BigSidePanelProps {
  columnValues: { values: (string | number | TableData)[]; columnName: string };
}

type ContextType = [Table | null, ViewSetting, boolean, UiManager];

function BigSidePanel({ columnValues }: BigSidePanelProps) {
  const context: ContextType | undefined = useContext(Context);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  const [tableData, tableType, loading, uiManager] = context;
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);
  const filteredValues = Array.from(
    new Set(
      columnValues.values.filter(
        (value) => typeof value === "string" || typeof value === "number"
      )
    )
  );

  const handleFilter = async (
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
      <h2>Column Values</h2>
      <div className="list">
        <ul className="column-elements">
          {filteredValues.map((value, index) => (
            <li key={index}>
              <label>
                <input
                  type="checkbox"
                  defaultChecked
                  checked={selectedColumnValues.includes(value)}
                  onChange={() => handleCheckboxChange(value)}
                />
                {value}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="buttons">
        <button
          onClick={() =>
            handleFilter(selectedColumnValues, columnValues.columnName)
          }
        >
          filter
        </button>
      </div>
    </div>
  );
}

export default BigSidePanel;
