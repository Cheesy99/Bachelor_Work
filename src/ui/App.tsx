import "./App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import { ViewSetting } from "./Connector/Enum/Setting";
import React, { useState, useEffect, useRef } from "react";
import UiManager from "./Connector/UiManager";
import Converter from "./Connector/Converter";

type ContextType = [Table | null, ViewSetting, boolean];

export const Context = React.createContext<ContextType | undefined>(undefined);

function App() {
  const [tableData, setTableData] = useState<Table | null>(null);
  const [tableType, setTableType] = useState<ViewSetting>(
    ViewSetting.NESTEDTABLES
  );
  const [showSqlInput, setShowSqlInput] = useState(false);
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);
  const [loading, setLoading] = useState(false);
  const uiManager = useRef<UiManager | null>(null);
  useEffect(() => {
    async function initializeUiManager() {
      uiManager.current = await UiManager.create(
        new Converter(),
        setTableData,
        setLoading
      );
    }
    initializeUiManager();
  }, []);

  useEffect(() => {
    if (uiManager.current) {
      uiManager.current.setTableDataSetter(setTableData);
      uiManager.current.checkDatabaseAndFetchData(tableType);
    }
  }, [tableType]);

  const handleViewChange = async (viewSetting: ViewSetting) => {
    setLoading(true);
    setTableType(viewSetting);
    if (uiManager.current) {
      uiManager.current.setStrategyByViewSetting(viewSetting);
      if (tableData) {
        let convertedData: Table | null = null;
        if (viewSetting === ViewSetting.ONETABLE) {
          convertedData = await uiManager.current.convertNestedToOne(
            tableData as NestedTable
          );
          console.log("THe result", convertedData);
        } else if (viewSetting === ViewSetting.NESTEDTABLES) {
          convertedData = await uiManager.current.convertOneToNested(
            tableData as TableData
          );
        }
        setTableData(convertedData);
      }
    }
    setLoading(false);
  };

  const toggleSqlInput = () => {
    setShowSqlInput((prev) => !prev);
  };
  return (
    <Context.Provider value={[tableData, tableType, loading]}>
      <div className="app-container">
        <SmallSidePanel
          toggleSqlInput={toggleSqlInput}
          onViewChange={handleViewChange}
          uiMananger={uiManager.current}
        />
        <BigSidePanel columnValues={selectedColumnValues} />
        <MainWindow
          showSqlInput={showSqlInput}
          setSelectedColumnValues={setSelectedColumnValues}
        />
      </div>
    </Context.Provider>
  );
}

export default App;
