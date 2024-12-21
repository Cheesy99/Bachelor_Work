// import ConversionStrategy from "./Interface/ConversionStrategy";
// import { getMinMax, checkSchemaName, removeId } from "./Utils";
// class OneTableConverter implements ConversionStrategy {
//   async convert(data: TableStruct): Promise<TableData> {
//     return this.convertToOneTableView(data);
//   }

//   private async convertToOneTableView(
//     tableStruct: TableStruct
//   ): Promise<TableData> {
//     let schema: string[] = tableStruct.schema;
//     let table: (string | number)[][] = [];
//     for (const value of tableStruct.table) {
//       const subTable: (string | number)[][] = [];
//       for (const [index, entry] of value.entries()) {

//         if (Array.isArray(entry)) {
//           const tableName = tableStruct.schema[index];
//           const from: FromId = getMinMax(entry);
//           const table: TableData = await window.electronAPI.getTableData(
//             from,
//             tableName
//           );
//           schema = checkSchemaName(schema, table.schema);
//           let insertTable: (string | number)[][] = table.table;
//           insertTable = removeId(insertTable);

//           let initialId = tableStruct.table[index][0];
//           insertTable.forEach((foreignRow, foreignIndex) => {
//             const newRow = this.createRow(schema, entry, foreignRow);
//             .push(newRow);
//           });
//         } else {
//           row.push(entry);
//         }
//       }
//     }
//   }

//   private createRow(
//     schema: string[],
//     copyRow: (string | number)[],
//     addRow:(string | number)[]
//   ): (string | number)[] {}
// }

// export default OneTableConverter;
