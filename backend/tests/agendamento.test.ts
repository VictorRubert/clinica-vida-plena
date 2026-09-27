import { describe, expect, it } from "vitest";

import {
  Agendamento,
  StatusAgendamento
} from "../src/domain/entity/agendamento";

function criarAgendamento(
  status: StatusAgendamento = "agendada",
  dataConsulta = new Date(Date.now() + 24 * 60 * 60 * 1000)
) {
  return new Agendamento(
    "AG_TESTE",
    "PAC_TESTE",
    "MED01",
    new Date(),
    dataConsulta,
    status,
    "particular"
  );
}

describe("Regras de status do agendamento", () => {
  it("deve permitir confirmar uma consulta agendada", () => {
    const agendamento = criarAgendamento();

    agendamento.alterarStatus("confirmada");

    expect(agendamento.status).toBe("confirmada");
  });

  it("não deve permitir voltar de confirmada para agendada", () => {
    const agendamento = criarAgendamento("confirmada");

    expect(() => {
      agendamento.alterarStatus("agendada");
    }).toThrow(
      "Uma consulta confirmada não pode voltar a ser agendada."
    );
  });

  it("não deve permitir cancelar uma consulta já finalizada", () => {
    const agendamento = criarAgendamento("realizada");

    expect(() => {
      agendamento.alterarStatus("cancelada_paciente");
    }).toThrow("Este agendamento já foi finalizado.");
  });

  it("não deve permitir registrar falta antes da consulta", () => {
    const agendamento = criarAgendamento();

    expect(() => {
      agendamento.alterarStatus("falta");
    }).toThrow("A consulta ainda não ocorreu.");
  });

  it("não deve permitir registrar realização antes da consulta", () => {
    const agendamento = criarAgendamento();

    expect(() => {
      agendamento.alterarStatus("realizada");
    }).toThrow("A consulta ainda não ocorreu.");
  });

  it("deve permitir registrar falta após o horário da consulta", () => {
    const ontem = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const agendamento = criarAgendamento("confirmada", ontem);

    agendamento.alterarStatus("falta");

    expect(agendamento.status).toBe("falta");
  });

  it("deve permitir cancelar uma consulta futura", () => {
    const agendamento = criarAgendamento();

    agendamento.alterarStatus("cancelada_paciente");

    expect(agendamento.status).toBe("cancelada_paciente");
  });

  it("não deve permitir alterar um agendamento cancelado", () => {
    const agendamento = criarAgendamento("cancelada_clinica");

    expect(() => {
      agendamento.alterarStatus("confirmada");
    }).toThrow("Este agendamento já foi finalizado.");
  });
});