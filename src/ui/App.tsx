import "./App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import React, { useState, useEffect } from "react";
import Adapter from "./Connector/Adapter";

type ContextType = [
  Table | null,
  React.Dispatch<React.SetStateAction<Table | null>>
];

export const Context = React.createContext<ContextType | undefined>(undefined);
const adpater = Adapter.getInstance();
function App() {
  const [tableData, setTableData] = useState<Table | null>(null);
  const [showSqlInput, setShowSqlInput] = useState(false);
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);

  useEffect(() => {
    adpater.setTableDataSetter(setTableData);
    adpater.checkDatabaseAndFetchData();

    window.electronAPI.onDatabaseChange((data: TableData) => {
      setTableData(data);
    });
  }, []);

  const toggleSqlInput = () => {
    setShowSqlInput((prev) => !prev);
  };
  return (
    <Context.Provider value={[tableData, setTableData]}>
      <div className="app-container">
        <SmallSidePanel toggleSqlInput={toggleSqlInput} />
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
