import "@fortawesome/fontawesome-free/css/all.min.css";
import "./SmallSidePanel.css";
import { useContext, useState } from "react";
import { Context } from "../../App";
import UiManager from "../../Connector/UiManager";
import SettingsModal from "./Settings/Settings";
import React from "react";
import { ViewSetting } from "../../Connector/Enum/Setting";
import Modal from "react-modal";

Modal.setAppElement("#root");
interface SmallSidePanelProps {
  toggleSqlInput: () => void;
  handleViewChange: (view: ViewSetting) => void;
  uiManager: UiManager;
}
function SmallSidePanel({
  toggleSqlInput,
  handleViewChange,
  uiManager,
}: SmallSidePanelProps) {
  const context = useContext(Context);
  const [isModalOpen, setIsModalOpen] = useState(false);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  const [_, viewType] = context;

  const exportToExcel = async () => {
    // await window.electronAPI.exportToExcel();
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
        isOpen={isModalOpen}
        onRequestClose={closeSettings}
        handleViewChange={handleViewChange}
        currentView={viewType}
      />

      <label
        htmlFor="excelUpload"
        className="excel-icon-label"
        onClick={exportToExcel}
        title="Export to Excel"
      >
        <i className="fas fa-file-excel icon"></i>
      </label>
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
