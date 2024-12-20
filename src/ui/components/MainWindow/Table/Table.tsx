import { useEffect, useState } from "react";
import "./Table.css";
import Adapter from "../../../Connector/UiManager";

interface TableProps {
  data: Table;
  onHeaderClick: (column: (string | number)[]) => void;
}

function Table({ data, onHeaderClick }: TableProps) {
  const [tableData, setTableData] = useState<Table>();
  let tableType: string = "TableData";

  const isTableData = (data: TableData | TableView): data is TableData => {
    return "type" in data;
  };

  if (!data) {
    return <div>No data available</div>; // Handle the case where data is null
  }

  const renderTableData = (data: TableData) => (
    <>
      <thead>
        <tr>
          {data.schema.map((item, index) => (
            <th key={index}>{item}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.table.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );

  const renderTableView = (data: TableView) => (
    <>
      <thead>
        <tr>
          {data.schema.map((column, index) => (
            <th key={index}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.table.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {Array.isArray(row) ? (
              row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  {typeof cell === "object" ? renderTableData(cell) : cell}
                </td>
              ))
            ) : (
              <td colSpan={data.schema.length}>{row}</td>
            )}
          </tr>
        ))}
      </tbody>
    </>
  );

  return (
    <div>
      <table>
        {isTableData(data) ? renderTableData(data) : renderTableView(data)}
      </table>
    </div>
  );
}

export default Table;
