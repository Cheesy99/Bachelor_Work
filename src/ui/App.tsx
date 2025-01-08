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
type ContextType = [Table | null, ViewSetting, boolean, UiManager];

export const Context = React.createContext<ContextType | undefined>(undefined);

function App() {
  const [tableData, setTableData] = useState<Table | null>(null);
  const [tableType, setTableType] = useState<ViewSetting>(ViewSetting.ONETABLE);
  const [showSqlInput, setShowSqlInput] = useState(false);
  const [selectedColumnValues, setSelectedColumnValues] = useState<{
    values: (string | number | TableData)[];
    columnName: string;
  }>({ values: [], columnName: "id" });
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState<{ startId: number; endId: number }>({
    startId: 1,
    endId: 100,
  });
  const [sqlCommandChain, setSqlCommandChain] = useState<string[]>([]);

  const uiManager = new UiManager(
    new Converter(),
    setTableData,
    setLoading,
    tableType
  );
  useEffect(() => {
    uiManager.getInitTableData();
  }, []);

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
  return (
    <Context.Provider value={[tableData, tableType, loading, uiManager]}>
      <div className="app-container">
        <SmallSidePanel
          toggleSqlInput={toggleSqlInput}
          handleViewChange={handleViewChange}
          uiManager={uiManager}
        />
        <BigSidePanel columnValues={selectedColumnValues} />
        <MainWindow
          showSqlInput={showSqlInput}
          index={handleIndexChange}
          setSelectedColumnValues={setSelectedColumnValues}
        />
      </div>
    </Context.Provider>
  );
}

export default App;
