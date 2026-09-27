import { describe, expect, it } from "vitest";
import { validarHorario } from "../src/application/use-cases/validar-horario";

const grade = [
  {
    dia: "segunda",
    inicio: "08:00",
    fim: "12:00"
  }
];

describe("Validação da grade médica", () => {
  it("aceita um horário dentro da grade", () => {
    const data = new Date(2026, 9, 5, 9, 0);

    expect(validarHorario(data, grade)).toBe(true);
  });

  it("aceita o primeiro horário da grade", () => {
    const data = new Date(2026, 9, 5, 8, 0);

    expect(validarHorario(data, grade)).toBe(true);
  });

  it("rejeita uma consulta que ultrapassa o fim da grade", () => {
    const data = new Date(2026, 9, 5, 11, 45);

    expect(validarHorario(data, grade)).toBe(false);
  });

  it("rejeita horários anteriores ao início da grade", () => {
    const data = new Date(2026, 9, 5, 7, 30);

    expect(validarHorario(data, grade)).toBe(false);
  });

  it("rejeita consultas em dias não atendidos", () => {
    const data = new Date(2026, 9, 6, 9, 0);

    expect(validarHorario(data, grade)).toBe(false);
  });

  it("rejeita horários desalinhados dos intervalos de 30 minutos", () => {
    const data = new Date(2026, 9, 5, 9, 15);

    expect(validarHorario(data, grade)).toBe(false);
  });
});