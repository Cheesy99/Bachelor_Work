import "@fortawesome/fontawesome-free/css/all.min.css";
import "./SmallSidePanel.css";
import { useContext, useState } from "react";
import { Context, ContextCommandStack } from "../../App";
import SettingsModal from "./Settings/Settings";
import React from "react";
import { ViewSetting } from "../../connector/Enum/Setting";
import Modal from "react-modal";
import InputModal from "./InputModal/InputModal";

Modal.setAppElement("#root");
interface SmallSidePanelProps {
  toggleSqlInput: () => void;
  handleViewChange: (view: ViewSetting) => void;
  setterAmountSetting: React.Dispatch<React.SetStateAction<number>>;
  amountSetted: number;
  resetApp: () => void;
}
function SmallSidePanel({
  toggleSqlInput,
  handleViewChange,
  setterAmountSetting,
  amountSetted,
  resetApp,
}: SmallSidePanelProps) {
  const context = useContext(Context);
  const contextCommandStack = useContext(ContextCommandStack);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  if (!context || !contextCommandStack) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  const [tableData, tableType, loading, uiManager] = context;
  const [
    sqlCommandStack,
    setSqlCommandStack,
    amountOfShownRows,
    setIndexStart,
    indexStart,
  ] = contextCommandStack;
  
    const exportToExcel = async (appName: string) => {
    if (appName) {
      await uiManager.export(appName);
    }
  };

  const deleteDatabase = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete the database?"
    );
    if (confirmed) {
      setIsModalOpen(false);
      await uiManager.clearOutDatabase();
      resetApp();
    }
  };
  const openSettings = () => {
    setIsModalOpen(true);
  };

  const closeSettings = () => {
    setIsModalOpen(false);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    await uiManager.insertJsonData(event);
  };

  return (
    <div className="small_panel">
      <label
        htmlFor="settings"
        className="settings-icon-label"
        onClick={openSettings}
        title="Settings"
      >
        <i className="fas fa-cog icon"></i>
      </label>
      <SettingsModal
        deleteDatabase={deleteDatabase}
        uiManager={uiManager}
        setterAmountSetting={setterAmountSetting}
        isOpen={isModalOpen}
        amountSetted={amountSetted}
        onRequestClose={closeSettings}
        handleViewChange={handleViewChange}
        table={tableData}
        currentView={tableType}
      />

      <label
        htmlFor="excelUpload"
        className="excel-icon-label"
        onClick={() => setIsInputModalOpen(true)}
        title="Export to Excel"
      >
        <i className="fas fa-file-excel icon"></i>
      </label>
      <InputModal
        isOpen={isInputModalOpen}
        onRequestClose={() => setIsInputModalOpen(false)}
        onSubmit={exportToExcel}
      />
      <label
        htmlFor="sqlUpload"
        className="sql-icon-label"
        onClick={toggleSqlInput}
        title="SQL Command"
      >
        <i className="fas fa-database icon"></i>
      </label>
      <label
        htmlFor="fileUpload"
        className="upload-icon-label"
        title="Upload JSON"
      >
        <i className="fas fa-upload icon"></i>
      </label>
      <input
        type="file"
        id="fileUpload"
        className="file-upload"
        accept=".json"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default SmallSidePanel;
