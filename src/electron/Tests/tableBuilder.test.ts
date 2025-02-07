import { describe, it, expect, vi } from "vitest";
import TableBuilder from "../Backend/TableBuilder.js";
import TableSchema from "../Backend/Interfaces/TableSchema.js";
import JsonObject from "../Backend/Interfaces/JsonObject.js";
import DataBaseConnector from "../Backend/DataBaseConnector.js";

describe("TableBuilder", () => {
  it("should build the table and return the correct SQL commands", async () => {
    const json: JsonObject[] = [
      { name: "John Doe", age: "30" },
      { name: "Jane Doe", age: "25" },
    ];
    const tableSchema: TableSchema = {
      main_table: ["name", "age"],
    };

    const mockDatabaseConnector = vi
      .spyOn(DataBaseConnector.prototype, "sqlCommandWithIdResponse")
      .mockResolvedValue(-1);

    const tableBuilder = new TableBuilder();

    // Spy on the insertWithIdReponse method
    const insertWithIdReponseSpy = vi.spyOn(
      tableBuilder as any,
      "insertWithIdReponse"
    );

    const result = await tableBuilder.build(json, tableSchema);

    expect(result).toHaveLength(0);

    // Verify that insertWithIdReponse was called with the expected statements
    expect(insertWithIdReponseSpy).toHaveBeenCalledWith(
      "INSERT INTO main_table (name, age) VALUES ('John Doe', '30');"
    );
    expect(insertWithIdReponseSpy).toHaveBeenCalledWith(
      "INSERT INTO main_table (name, age) VALUES ('Jane Doe', '25');"
    );

    mockDatabaseConnector.mockRestore();
    insertWithIdReponseSpy.mockRestore();
  });

  it("should build the table and return the correct SQL commands", async () => {
    const json: JsonObject[] = [
      {
        term: "Sommersemester 2024",
        url: "https://marvin.uni-marburg.de/qisserver/pages/startFlow.xhtml?_flowId=detailView-flow&unitId=69939&periodId=4137&navigationPosition=searchCourses",
        modulZuordnungen: [],
        studiengangZuordnungen: [],
        termine: [
          {
            verantwortlicher: "",
            parallelgruppe: "Advanced Topics in Cryptography",
            Raum: "04C37 (SR XV C) (Hans-Meerwein-Straße 6, Institutsgebäude (H | 04))",
            Rhythmus: "wöchentlich",
            Ausfalltermin: "",
            StartdatumEnddatum: "16.04.2024 - 16.07.2024",
            ErwTn: "",
            Wochentag: "Di",
            Durchführender: "",
            Bemerkung: "",
            VonBis: "14:00 - 16:00",
          },
          {
            verantwortlicher: "",
            parallelgruppe: "Advanced Topics in Cryptography",
            Raum: "04A30 (HS IV A4) (Hans-Meerwein-Straße 6, Institutsgebäude (H | 04))",
            Rhythmus: "Einzeltermin",
            Ausfalltermin: "",
            StartdatumEnddatum: "26.07.2024",
            ErwTn: "",
            Wochentag: "Fr",
            Durchführender: "",
            Bemerkung: "Erstklausur",
            VonBis: "13:00 - 16:00",
          },
          {
            verantwortlicher: "",
          },
        ],
      },
    ];

    const tableSchema: TableSchema = {
      main_table: [
        "term",
        "url",
        "modulZuordnungen",
        "studiengangZuordnungen",
        "termine",
      ],
      termine: [
        "termine_verantwortlicher",
        "termine_parallelgruppe",
        "termine_Raum",
        "termine_Rhythmus",
        "termine_Ausfalltermin",
        "termine_StartdatumEnddatum",
        "termine_ErwTn",
        "termine_Wochentag",
        "termine_Durchführender",
        "termine_Bemerkung",
        "termine_VonBis",
      ],
    };

    const mockDatabaseConnector = vi
      .spyOn(DataBaseConnector.prototype, "sqlCommandWithIdResponse")
      .mockResolvedValue(-1);

    const tableBuilder = new TableBuilder();

    // Spy on the insertWithIdReponse method
    const insertWithIdReponseSpy = vi.spyOn(
      tableBuilder as any,
      "insertWithIdReponse"
    );

    const result = await tableBuilder.build(json, tableSchema);
    expect(result).toHaveLength(3);
    const expectedResult = [
      "INSERT INTO main_table (term, url, modulZuordnungen, studiengangZuordnungen, termine) VALUES ('Sommersemester 2024', 'https://marvin.uni-marburg.de/qisserver/pages/startFlow.xhtml?_flowId=detailView-flow&unitId=69939&periodId=4137&navigationPosition=searchCourses', null, null, -1);",
      "INSERT INTO main_table (term, url, modulZuordnungen, studiengangZuordnungen, termine) VALUES ('Sommersemester 2024', 'https://marvin.uni-marburg.de/qisserver/pages/startFlow.xhtml?_flowId=detailView-flow&unitId=69939&periodId=4137&navigationPosition=searchCourses', null, null, -1);",
      "INSERT INTO main_table (term, url, modulZuordnungen, studiengangZuordnungen, termine) VALUES ('Sommersemester 2024', 'https://marvin.uni-marburg.de/qisserver/pages/startFlow.xhtml?_flowId=detailView-flow&unitId=69939&periodId=4137&navigationPosition=searchCourses', null, null, -1);",
    ];

    expect(result).toEqual(expectedResult);

    expect(insertWithIdReponseSpy).toHaveBeenCalledWith(
      "INSERT INTO termine (termine_verantwortlicher, termine_parallelgruppe, termine_Raum, termine_Rhythmus, termine_Ausfalltermin, termine_StartdatumEnddatum, termine_ErwTn, termine_Wochentag, termine_Durchführender, termine_Bemerkung, termine_VonBis) VALUES ('not found', 'Advanced Topics in Cryptography', '04C37 (SR XV C) (Hans-Meerwein-Straße 6, Institutsgebäude (H | 04))', 'wöchentlich', 'not found', '16.04.2024 - 16.07.2024', 'not found', 'Di', 'not found', 'not found', '14:00 - 16:00');"
    );

    expect(insertWithIdReponseSpy).toHaveBeenCalledWith(
      "INSERT INTO termine (termine_verantwortlicher, termine_parallelgruppe, termine_Raum, termine_Rhythmus, termine_Ausfalltermin, termine_StartdatumEnddatum, termine_ErwTn, termine_Wochentag, termine_Durchführender, termine_Bemerkung, termine_VonBis) VALUES ('not found', 'Advanced Topics in Cryptography', '04A30 (HS IV A4) (Hans-Meerwein-Straße 6, Institutsgebäude (H | 04))', 'Einzeltermin', 'not found', '26.07.2024', 'not found', 'Fr', 'not found', 'Erstklausur', '13:00 - 16:00');"
    );

    expect(insertWithIdReponseSpy).toHaveBeenCalledWith(
      "INSERT INTO termine (termine_verantwortlicher, termine_parallelgruppe, termine_Raum, termine_Rhythmus, termine_Ausfalltermin, termine_StartdatumEnddatum, termine_ErwTn, termine_Wochentag, termine_Durchführender, termine_Bemerkung, termine_VonBis) VALUES ('not found', 'not found', 'not found', 'not found', 'not found', 'not found', 'not found', 'not found', 'not found', 'not found', 'not found');"
    );

    mockDatabaseConnector.mockRestore();
    insertWithIdReponseSpy.mockRestore();
  });
});
