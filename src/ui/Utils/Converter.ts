import TableView from "./Interface_Enum/TableView";

class Converter {
  public convert(
    data: TableData[],
    setting: ViewSetting
  ): TableView | TableData {
    if ((setting = ViewSetting.ONETABLE)) {
      return this.convertOneView(data);
    } else if ((setting = ViewSetting.NESTEDTABLES)) {
      return this.convertNestedView(data);
    }

    return this.convertOneView(data);
  }
  private convertNestedView(data: TableData[]): TableView {
    if (data.length === 0) return { schema: [], table: [] };
  }

  private convertOneView(data: TableData[]): TableData {}
}

export default Converter;
