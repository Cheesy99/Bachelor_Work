import "./App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import { ViewSetting } from "./connector/Enum/Setting";
import React, { useState, useEffect } from "react";
import UiManager from "./connector/UiManager";
import Converter from "./connector/Converter";
enum IndexDirection {
  RIGHT,
  LEFT,
}
enum Clicked {
  RowId,
  Column,
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
export const Context = React.createContext<ContextType | undefined>(undefined);
export const ContextCommandStack = React.createContext<
  ContextStack | undefined
>(undefined);
function App() {
  const [selectedAll, setSelectedAll] = useState<boolean>(false);
  const [tableData, setTableData] = useState<Table | null>(null);
  const [tableType, setTableType] = useState<ViewSetting>(ViewSetting.ONETABLE);
  const [showSqlInput, setShowSqlInput] = useState(false);
  const [selectedColumnValues, setSelectedColumnValues] = useState<{
    values: (string | number | TableData)[];
    columnName: string;
  }>({ values: [], columnName: "id" });
  const [selectedRowData, setSelectedRowData] = useState<(string | number)[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [amountOfShownRows, setAmountOfShownRows] = useState<number>(100);
  const [indexStart, setIndexStart] = useState<number>(0);
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [sqlCommand, setSqlCommand] = useState<string>("");

  const [lastClicked, setLastClicked] = useState<
    Clicked.RowId | Clicked.Column | undefined
  >(undefined);
  const uiManager = new UiManager(
    new Converter(),
    setTableData,
    setLoading,
    tableType,
    sqlCommand,
    setSqlCommand
  );

  useEffect(() => {}, [sqlCommand]);

  useEffect(() => {
    uiManager.getInitTableData();
  }, []);

  const handleIdClick = (rowData: (string | number)[]) => {
    setSelectedRowData(rowData);
    setShowSidePanel(true);
    setLastClicked(Clicked.RowId);
  };

  const handleColumnClick = (columnValues: {
    values: (string | number | TableData)[];
    columnName: string;
  }) => {
    setSelectedColumnValues(columnValues);
    setShowSidePanel(true);
    setLastClicked(Clicked.Column);
  };

  const handleViewChange = async (viewSetting: ViewSetting) => {
    setLoading(true);
    setTableType(viewSetting);
    if (uiManager) {
      if (tableData) {
        let convertedData: Table | null = null;
        if (viewSetting === ViewSetting.ONETABLE) {
          convertedData = await uiManager.convert(viewSetting);
        } else if (viewSetting === ViewSetting.NESTEDTABLES) {
          convertedData = await uiManager.convert(viewSetting);
        }
        setTableData(convertedData);
      }
    }
    setLoading(false);
  };

  const handleIndexChange = (direction: IndexDirection) => {
    let newIndexStart = indexStart;

    if (direction === IndexDirection.RIGHT) {
      newIndexStart = indexStart + amountOfShownRows;
    } else {
      newIndexStart = Math.max(0, indexStart - amountOfShownRows);
    }

    setIndexStart(newIndexStart);

    if (tableData) {
      const lastSqlCommand = sqlCommand;
      console.log("LastsqlCommand: ", lastSqlCommand);
      let newSqlCommand;

      if (lastSqlCommand.includes("OFFSET")) {
        newSqlCommand = lastSqlCommand.replace(
          /OFFSET\s+\d+/,
          `OFFSET ${newIndexStart}`
        );
      } else {
        newSqlCommand = `${lastSqlCommand} OFFSET ${newIndexStart}`;
      }

      setSqlCommand(newSqlCommand);
      console.log("Index command: ", newSqlCommand);
      uiManager.executeSqlCommand(newSqlCommand);
    }
  };
  const toggleSqlInput = () => {
    setShowSqlInput((prev) => !prev);
  };

  const resetApp = () => {
    setTableData(null);
    setSelectedColumnValues({ values: [], columnName: "" });
    setSelectedRowData([]);
    setSqlCommand("");
    setShowSidePanel(false);
    const amountIndex = amountOfShownRows;
    setAmountOfShownRows(amountIndex);
    setIndexStart(0);
    setLastClicked(Clicked.Column);
    setLoading(false);
  };

  const toggleSidePanel = () => {
    setShowSidePanel((prev) => !prev);
  };

  const handleUndo = async (): Promise<void> => {
    if (sqlCommand === "") alert("This is the original Data");
    else await uiManager.undo();
  };

  return (
    <Context.Provider
      value={[tableData, tableType, loading, uiManager, setTableData]}
    >
      <ContextCommandStack.Provider
        value={[
          sqlCommand,
          setSqlCommand,
          amountOfShownRows,
          setIndexStart,
          indexStart,
          selectedAll,
          setSelectedAll,
        ]}
      >
        <div className="app-container">
          <div className="small-side-panel">
            <SmallSidePanel
              toggleSqlInput={toggleSqlInput}
              handleViewChange={handleViewChange}
              setterAmountSetting={setAmountOfShownRows}
              amountSetted={amountOfShownRows}
              resetApp={resetApp}
            />
          </div>
          {showSidePanel && (
            <div className="big-side-panel">
              <BigSidePanel
                columnValues={selectedColumnValues}
                closeSidePanel={setShowSidePanel}
                rowValues={selectedRowData}
                lastClicked={lastClicked}
              />
            </div>
          )}
          <div className="show-side-panel" onClick={toggleSidePanel}>
            {showSidePanel ? "←" : "→"}
          </div>
          <div
            className={`main-window ${
              showSidePanel ? "" : "main-window-full-width"
            }`}
          >
            <MainWindow
              showSqlInput={showSqlInput}
              index={handleIndexChange}
              setSelectedColumnValues={handleColumnClick}
              handleUndo={handleUndo}
              onIdClick={handleIdClick}
              setTable={setTableData}
            />
          </div>
        </div>
      </ContextCommandStack.Provider>
    </Context.Provider>
  );
}

export default App;
