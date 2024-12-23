import { useEffect, useState } from "react";
import "./Table.css";
import UiManager from "../../../Connector/UiManager";
import { ViewSetting } from "../../../Connector/Enum/Setting";

interface TableProps {
  data: Table;
  viewSetting: ViewSetting;
  onHeaderClick: (column: (string | number)[]) => void;
}

function Table({ data, viewSetting, onHeaderClick }: TableProps) {
  console.log("Table component received data:", data);
  console.log("Table component received viewSetting:", viewSetting);

  const isOneTable = (viewSetting: ViewSetting): boolean => {
    return viewSetting === ViewSetting.ONETABLE ? true : false;
  };

  if (!data) {
    return <div>No data available</div>; // Handle the case where data is null
  }

  const renderTableData = (data: TableData) => (
    <table>
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
    </table>
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
        {isOneTable(viewSetting)
          ? renderTableData(data as TableData)
          : renderTableView(data as TableView)}
      </table>
    </div>
  );
}

export default Table;
