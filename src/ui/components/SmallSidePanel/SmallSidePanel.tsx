import "@fortawesome/fontawesome-free/css/all.min.css";
import "./SmallSidePanel.css";
import { useContext, useState } from "react";
import { Context } from "../../App";

function SmallSidePanel({ toggleSqlInput }: { toggleSqlInput: () => void }) {
  const context = useContext(Context);

  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  function translateUmlauts(text: string): string {
    return text
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/Ä/g, "Ae")
      .replace(/Ö/g, "Oe")
      .replace(/Ü/g, "Ue")
      .replace(/ß/g, "ss");
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        let fileData = reader.result as string;
        fileData = translateUmlauts(fileData);
        console.log("I am in UI");
        window.electronAPI.sendJsonFile(fileData);
      };
      reader.readAsText(file);
    } else {
      alert("Invalid file type. Please select a .json file.");
    }
  };

  return (
    <div className="small_panel">
      <label htmlFor="excelUpload" className="excel-icon-label">
        <i className="fas fa-file-excel icon"></i>
      </label>
      <label
        htmlFor="sqlUpload"
        className="sql-icon-label"
        onClick={toggleSqlInput}
      >
        <i className="fas fa-database icon"></i>
      </label>
      <label htmlFor="fileUpload" className="upload-icon-label">
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
