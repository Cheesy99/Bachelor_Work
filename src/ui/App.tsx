import "./App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import React, { useState, useEffect } from "react";

type ContextType = [
  TableData | null,
  React.Dispatch<React.SetStateAction<TableData | null>>
];

export const Context = React.createContext<ContextType | undefined>(undefined);

function App() {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [showSqlInput, setShowSqlInput] = useState(false);
  const [selectedColumnValues, setSelectedColumnValues] = useState<
    (string | number)[]
  >([]);

  useEffect(() => {
    const checkDatabaseAndFetchData = async () => {
      const databaseExists = await window.electronAPI.databaseExists();
      if (databaseExists) {
        const fromID: FromId = { startId: 1, endId: 100 };
        const data = await window.electronAPI.getTableData(
          fromID,
          "main_table"
        );
        setTableData(data);
      } else {
        console.log("Database does not exist.");
      }
    };

    checkDatabaseAndFetchData();

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
