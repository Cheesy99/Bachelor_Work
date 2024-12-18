interface TableView {
  schema: string[];
  table: (string | number | TableView)[][];
}
export default TableView;
