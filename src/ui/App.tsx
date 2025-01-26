import "./App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import { ViewSetting } from "./connector/Enum/Setting";
import React, { useState, useEffect, useRef } from "react";
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
type ContextType = [Table | null, ViewSetting, boolean, UiManager];
type ContextStack = [any[], React.Dispatch<React.SetStateAction<any[]>>];
export const Context = React.createContext<ContextType | undefined>(undefined);
export const ContextCommandStack = React.createContext<
  ContextStack | undefined
>(undefined);
function App() {
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
  const [sqlCommandStack, setSqlCommandStack] = useState<string[]>([]);
  const [lastClicked, setLastClicked] = useState<
    Clicked.RowId | Clicked.Column | undefined
  >(undefined);
  const uiManager = new UiManager(
    new Converter(),
    setTableData,
    setLoading,
    tableData,
    tableType,
    sqlCommandStack,
    amountOfShownRows
  );
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
    if (direction === IndexDirection.RIGHT) {
      setIndexStart(indexStart + amountOfShownRows);
      uiManager.executeStack(tableData?.schema!);
    } else {
      const newIdex = Math.max(0, indexStart - amountOfShownRows);
      setIndexStart(newIdex);
      uiManager.getTableData();
    }
  };
  const toggleSqlInput = () => {
    setShowSqlInput((prev) => !prev);
  };

  const resetApp = () => {
    setTableData(null);
    setSelectedColumnValues({ values: [], columnName: "" });
    setSelectedRowData([]);
    setSqlCommandStack([]);
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
  return (
    <Context.Provider value={[tableData, tableType, loading, uiManager]}>
      <ContextCommandStack.Provider
        value={[sqlCommandStack, setSqlCommandStack]}
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
              onIdClick={handleIdClick}
              setTable={setTableData}
              setTableType={setTableType}
            />
          </div>
        </div>
      </ContextCommandStack.Provider>
    </Context.Provider>
  );
}

export default App;
