import "./App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import { ViewSetting } from "./Connector/Enum/Setting";
import React, { useState, useEffect } from "react";
import UiManager from "./Connector/UiManager";

type ContextType = [Table | null, ViewSetting, boolean];

export const Context = React.createContext<ContextType | undefined>(undefined);
const adpater = UiManager.getInstance();
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

  useEffect(() => {
    adpater.setTableDataSetter(setTableData);
    adpater.checkDatabaseAndFetchData(tableType);
    adpater.setupDatabaseChangeListener(tableType);
  }, []);

  const handleViewChange = async (viewSetting: ViewSetting) => {
    setLoading(true);
    setTableType(viewSetting);
    UiManager.setStrategyByViewSetting(viewSetting);
    if (tableData) {
      let convertedData: Table | null = null;
      if (viewSetting === ViewSetting.ONETABLE) {
        convertedData = await UiManager.convertNestedToOne(
          tableData as NestedTable
        );
        console.log("THe result", convertedData);
      } else if (viewSetting === ViewSetting.NESTEDTABLES) {
        convertedData = await UiManager.convertOneToNested(
          tableData as TableData
        );
      }
      setTableData(convertedData);
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
