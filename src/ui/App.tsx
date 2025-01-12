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
  const [index, setIndex] = useState<{ startId: number; endId: number }>({
    startId: 1,
    endId: 100,
  });
  const [sqlCommandStack, setSqlCommandStack] = useState<string[]>([]);
  const [lastClicked, setLastClicked] = useState<
    Clicked.RowId | Clicked.Column
  >(Clicked.Column);
  const uiManager = new UiManager(
    new Converter(),
    setTableData,
    setLoading,
    tableType,
    sqlCommandStack
  );
  useEffect(() => {
    uiManager.getInitTableData();
  }, []);

  const handleIdClick = (rowData: (string | number)[]) => {
    setSelectedRowData(rowData);
    setLastClicked(Clicked.RowId);
  };

  const handleColumnClick = (columnValues: {
    values: (string | number | TableData)[];
    columnName: string;
  }) => {
    setSelectedColumnValues(columnValues);
    setLastClicked(Clicked.Column);
  };

  const [sqlInputValue, setSqlInputValue] = useState<string>("");

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
      const newIdex = {
        startId: index.startId + 100,
        endId: index.endId + 100,
      };
      setIndex(newIdex);
      uiManager.getTableData(newIdex, "main_table");
    } else {
      if (index.startId <= 0) {
        console.log("start index is less then 0", index.startId);
      } else {
        const newIdex = {
          startId: Math.max(0, index.startId - 100),
          endId: Math.max(index.endId - 100, 100),
        };
        setIndex(newIdex);
        uiManager.getTableData(newIdex, "main_table");
      }
    }
  };
  const toggleSqlInput = () => {
    setShowSqlInput((prev) => !prev);
  };

  const resetApp = () => {
    setTableData(null);
    setSelectedColumnValues({ values: [], columnName: "id" });
    setSelectedRowData([]);
    setSqlCommandStack([]);
    setIndex({ startId: 1, endId: 100 });
    setLastClicked(Clicked.Column);
    setLoading(false);
  };
  return (
    <Context.Provider value={[tableData, tableType, loading, uiManager]}>
      <ContextCommandStack.Provider
        value={[sqlCommandStack, setSqlCommandStack]}
      >
        <div className="app-container">
          <SmallSidePanel
            toggleSqlInput={toggleSqlInput}
            handleViewChange={handleViewChange}
            uiManager={uiManager}
            resetApp={resetApp}
          />
          <BigSidePanel
            columnValues={selectedColumnValues}
            rowValues={selectedRowData}
            lastClicked={lastClicked}
          />
          <MainWindow
            showSqlInput={showSqlInput}
            index={handleIndexChange}
            setSelectedColumnValues={handleColumnClick}
            onIdClick={handleIdClick}
            setTable={setTableData}
            setTableType={setTableType}
          />
        </div>
      </ContextCommandStack.Provider>
    </Context.Provider>
  );
}

export default App;
