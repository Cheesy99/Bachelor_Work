import "./BigSidePanel.css";

interface BigSidePanelProps {
  columnValues: (string | number | TableData)[];
}

function BigSidePanel({ columnValues }: BigSidePanelProps) {
  const filteredValues = columnValues.filter(
    (value) => typeof value === "string" || typeof value === "number"
  );
  return (
    <div className="big-side-panel">
      <h2>Column Values</h2>
      <ul className="column-elements">
        {filteredValues.map((value, index) => (
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
