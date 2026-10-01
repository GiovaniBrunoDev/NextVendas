import { dateOnlyKey, formatDateOnly } from "./dateOnly";

describe("dateOnly", () => {
  it("preserva a data de calendario recebida da API", () => {
    expect(dateOnlyKey("2026-10-01T00:00:00.000Z")).toBe("2026-10-01");
  });

  it("formata a data sem deslocar para o dia anterior", () => {
    expect(formatDateOnly("2026-10-01T00:00:00.000Z")).toBe("01/10/2026");
  });

  it("rejeita datas de calendário inválidas", () => {
    expect(dateOnlyKey("2026-02-30T00:00:00.000Z")).toBe("");
  });
});
