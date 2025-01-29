import React, { useState } from "react";
import Modal from "react-modal";
import { ViewSetting } from "../../../connector/Enum/Setting";
import "./Settings.css";
import { Context, ContextCommandStack } from "../../../App";
import { useContext } from "react";
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

type ContextStack = [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  React.Dispatch<React.SetStateAction<string[]>>,
  number,
  React.Dispatch<React.SetStateAction<number>>,
  number
];

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
  const contextCommandStack: ContextStack | undefined =
    useContext(ContextCommandStack);
  if (!contextCommandStack) {
    throw new Error("contextCommandStack is not defined");
  }
  const [
    sqlCommand,
    setSqlCommand,
    setSqlCommandStack,
    amountOfShownRows,
    setIndexStart,
    indexStart,
  ] = contextCommandStack;

  const [saveBetween, setSaveBetween] = useState<number>(amountSetted);
  const setAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount: number = parseInt(event.target.value, 10);
    if (!isNaN(newAmount)) {
      setSaveBetween(newAmount);
    }
  };

  const setStepAmount = async () => {
    let newValue = saveBetween;
    if (saveBetween === -1) {
      newValue = await uiManager.getMaxColumnValue();
    }

    setterAmountSetting(newValue);
    setIndexStart(0);
    const newSqlCommand = sqlCommand.replace(
      /LIMIT\s+\d+/,
      `LIMIT ${newValue}`
    );
    setSqlCommand(newSqlCommand);
    await uiManager.executeStack(newSqlCommand);
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
        To many row value can lead to decreased preformance, if you want all
        rows incert -1
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
