import "./App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import { ViewSetting } from "./Connector/Enum/Setting";
import React, { useState, useEffect } from "react";
import Adapter from "./Connector/UiManager";

type ContextType = [Table | null, ViewSetting];

export const Context = React.createContext<ContextType | undefined>(undefined);
const adpater = Adapter.getInstance();
function App() {
  const setting: ViewSetting = ViewSetting.ONETABLE;
  const [tableData, setTableData] = useState<Table | null>(null);
  const [tableType, setTableType] = useState<ViewSetting>(
    ViewSetting.NESTEDTABLES
  );
  const [showSqlInput, setShowSqlInput] = useState(false);
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);

  useEffect(() => {
    adpater.setTableDataSetter(setTableData);
    adpater.checkDatabaseAndFetchData();
    adpater.setupDatabaseChangeListener();
  }, []);

  const toggleSqlInput = () => {
    setShowSqlInput((prev) => !prev);
  };
  return (
    <Context.Provider value={[tableData, tableType]}>
      <div className="app-container">
        <SmallSidePanel
          toggleSqlInput={toggleSqlInput}
          onViewChange={setTableType}
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
