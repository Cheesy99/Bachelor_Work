import React, { useState } from "react";
import Modal from "react-modal";
import { ViewSetting } from "../../../connector/Enum/Setting";
import "./Settings.css";
import { useContext } from "react";
import { Context } from "../../../App";
import UiManager from "../../../connector/UiManager";
interface SettingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  handleViewChange: (view: ViewSetting) => void;
  currentView: ViewSetting;
  amountSetted: number;
  deleteDatabase: () => void;
  uiManager: UiManager;
  table: Table | null;
  setterAmountSetting: React.Dispatch<React.SetStateAction<number>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onRequestClose,
  handleViewChange,
  setterAmountSetting,
  amountSetted,
  uiManager,
  currentView,
  table,
  deleteDatabase,
}) => {
  const [saveBetween, setSaveBetween] = useState<number>(amountSetted);
  const setAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount: number = parseInt(event.target.value, 10);
    if (!isNaN(newAmount)) {
      setSaveBetween(newAmount);
    }
  };

  const setStepAmount = async () => {
    setterAmountSetting(saveBetween);
    await uiManager.setJump(amountSetted);
    await uiManager.executeStack(table?.schema!);
  };
  useContext(Context);
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="modal"
      overlayClassName="modal-overlay"
    >
      <div className="radio-group">
        <label>
          <input
            type="radio"
            value="nested"
            checked={currentView === ViewSetting.NESTEDTABLES}
            onChange={() => handleViewChange(ViewSetting.NESTEDTABLES)}
          />
          Nested View
        </label>
        <label>
          <input
            type="radio"
            value="one"
            checked={currentView === ViewSetting.ONETABLE}
            onChange={() => handleViewChange(ViewSetting.ONETABLE)}
          />
          One View
        </label>
        <label>Max Row's:</label>
        To many row value can lead to decreased preformance
        <input type="number" value={saveBetween} onChange={setAmount}></input>
        <button onClick={setStepAmount}>Change</button>
      </div>

      <button className="delete-button" onClick={deleteDatabase}>
        Delete DataBase
      </button>
      <button className="close-button" onClick={onRequestClose}>
        Close
      </button>
    </Modal>
  );
};

export default SettingsModal;
