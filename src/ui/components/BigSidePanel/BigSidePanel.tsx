import "./BigSidePanel.css";

interface BigSidePanelProps {
  columnValues: (string | number)[];
}

function BigSidePanel({ columnValues }: BigSidePanelProps) {
  return (
    <div className="big-side-panel">
      <h2>Column Values</h2>
      <ul className="column-elements">
        {columnValues.map((value, index) => (
          <li key={index}>
            <label>
              <input type="checkbox" defaultChecked={true} />
              {value}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BigSidePanel;
