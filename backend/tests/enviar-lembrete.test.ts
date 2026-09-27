import { beforeEach, describe, expect, it, vi } from "vitest";

import { enviarLembrete } from "../src/application/use-cases/enviar-lembrete-usecase";
import { AgendamentoModel } from "../src/infra/database/models/agendamento-model";

vi.mock("../src/infra/database/models/agendamento-model", () => ({
  AgendamentoModel: {
    findById: vi.fn()
  }
}));

function criarAgendamentoMock(
  alteracoes: Record<string, unknown> = {}
) {
  return {
    _id: "AG_TESTE",
    pacienteNome: "Paciente Teste",
    pacienteTelefone: "49999999999",
    status: "agendada",
    dataConsulta: new Date("2030-10-07T13:00:00.000Z"),
    lembreteEnviadoEm: null as Date | null,
    quantidadeLembretes: 0,
    save: vi.fn().mockResolvedValue(undefined),
    ...alteracoes
  };
}

describe("Envio de lembretes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("envia um lembrete para uma consulta futura não confirmada", async () => {
    const agendamento = criarAgendamentoMock();

    vi.mocked(AgendamentoModel.findById)
      .mockResolvedValue(agendamento as never);

    const resultado = await enviarLembrete("AG_TESTE");

    expect(resultado.mensagem).toBe(
      "Envio simulado de lembrete registrado com sucesso."
    );
    expect(resultado.quantidadeLembretes).toBe(1);
    expect(resultado.lembreteEnviadoEm).toBeInstanceOf(Date);
    expect(agendamento.save).toHaveBeenCalledOnce();
  });

  it("impede o reenvio dentro de 24 horas", async () => {
    const agendamento = criarAgendamentoMock({
      lembreteEnviadoEm: new Date(Date.now() - 60 * 60 * 1000),
      quantidadeLembretes: 1
    });

    vi.mocked(AgendamentoModel.findById)
      .mockResolvedValue(agendamento as never);

    await expect(
      enviarLembrete("AG_TESTE")
    ).rejects.toThrow(
      "Um lembrete já foi registrado para esta consulta nas últimas 24 horas."
    );

    expect(agendamento.save).not.toHaveBeenCalled();
  });

  it("permite enviar outro lembrete após 24 horas", async () => {
    const agendamento = criarAgendamentoMock({
      lembreteEnviadoEm: new Date(
        Date.now() - 25 * 60 * 60 * 1000
      ),
      quantidadeLembretes: 1
    });

    vi.mocked(AgendamentoModel.findById)
      .mockResolvedValue(agendamento as never);

    const resultado = await enviarLembrete("AG_TESTE");

    expect(resultado.quantidadeLembretes).toBe(2);
    expect(agendamento.save).toHaveBeenCalledOnce();
  });

  it("impede lembretes para consultas confirmadas", async () => {
    const agendamento = criarAgendamentoMock({
      status: "confirmada"
    });

    vi.mocked(AgendamentoModel.findById)
      .mockResolvedValue(agendamento as never);

    await expect(
      enviarLembrete("AG_TESTE")
    ).rejects.toThrow(
      "Somente consultas ainda não confirmadas podem receber lembretes."
    );

    expect(agendamento.save).not.toHaveBeenCalled();
  });

  it("impede lembretes para consultas canceladas", async () => {
    const agendamento = criarAgendamentoMock({
      status: "cancelada_paciente"
    });

    vi.mocked(AgendamentoModel.findById)
      .mockResolvedValue(agendamento as never);

    await expect(
      enviarLembrete("AG_TESTE")
    ).rejects.toThrow(
      "Somente consultas ainda não confirmadas podem receber lembretes."
    );

    expect(agendamento.save).not.toHaveBeenCalled();
  });

  it("impede lembretes para consultas passadas", async () => {
    const agendamento = criarAgendamentoMock({
      dataConsulta: new Date(
        Date.now() - 60 * 60 * 1000
      )
    });

    vi.mocked(AgendamentoModel.findById)
      .mockResolvedValue(agendamento as never);

    await expect(
      enviarLembrete("AG_TESTE")
    ).rejects.toThrow(
      "Não é possível enviar lembretes para consultas passadas."
    );

    expect(agendamento.save).not.toHaveBeenCalled();
  });

  it("retorna erro quando o agendamento não existe", async () => {
    vi.mocked(AgendamentoModel.findById)
      .mockResolvedValue(null);

    await expect(
      enviarLembrete("AG_INEXISTENTE")
    ).rejects.toThrow("Agendamento não encontrado.");
  });
});
