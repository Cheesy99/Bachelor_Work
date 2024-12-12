import { useEffect, useState } from "react";
import TableData from "../../../tableDataContext";
import "./Table.css";

interface TableProps {
  data: {
    schema: string[];
    table: (string | number)[][];
  } | null;
  onHeaderClick: (column: (string | number)[]) => void;
}

function Table({ data, onHeaderClick }: TableProps) {
  const [columnIndexForeignTable, setColumnIndexForeignTable] = useState<
    { index: number; name: string }[]
  >([]);

  //This might have to be an array cause we can have more than one foreign keys columns
  const [nestedTableData, setNestedTableData] = useState<TableData>();

  useEffect(() => {
    if (data && data.table.length > 0) {
      const firstRow = data.table[0];
      const slicedRow = firstRow.slice(1);
      const indices: { index: number; name: string }[] = [];
      slicedRow.forEach(async (value, index) => {
        if (typeof value === "number") {
          const columnIndex = index + 1;
          const columnName = data.schema[columnIndex];
          indices.push({ index: columnIndex, name: columnName });
          const from = {
            startId: 0,
            endId: Math.max(
              ...data.table.map((row: any) => {
                if (typeof row[columnIndex] === "number") {
                  return row[columnIndex];
                }
                return 0;
              })
            ),
          };
          const nestedData = await window.electronAPI.getTableData(
            from,
            columnName
          );
          setNestedTableData(nestedData);
        }
      });
      setColumnIndexForeignTable(indices);
    }
  }, [data]);
  if (!data) {
    return <div>No data available</div>; // Handle the case where data is null
  }

  const handleHeaderClick = (columnIndex: number) => {
    const columnValues = data!.table.map((row) => row[columnIndex]);
    const uniqueColumnValues = Array.from(new Set(columnValues));
    onHeaderClick(uniqueColumnValues);
  };

  const renderCell = (
    cell: string | number,
    cellIndex: number,
    rowIndex: number
  ) => {
    const foreignTableInfo: { index: number; name: string } | undefined =
      columnIndexForeignTable.find((item) => item.index === cellIndex);
    if (foreignTableInfo && nestedTableData && nestedTableData.table) {
      const foreignRow = nestedTableData.table[rowIndex];

      return (
        <td key={cellIndex}>
          <Table
            data={{
              schema: nestedTableData.schema,
              table: [foreignRow],
            }}
            onHeaderClick={onHeaderClick}
          />
        </td>
      );
    }
    return <td key={cellIndex}>{cell}</td>;
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {data.schema === undefined ? (
              <th></th>
            ) : (
              data.schema.map((item, index) => (
                <th key={index} onClick={() => handleHeaderClick(index)}>
                  {item}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {data.table === undefined ? (
            <tr>
              <td></td>
            </tr>
          ) : (
            data.table.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) =>
                  renderCell(cell, cellIndex, rowIndex)
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
