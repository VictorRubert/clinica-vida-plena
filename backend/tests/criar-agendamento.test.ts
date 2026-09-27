import { beforeEach, describe, expect, it, vi } from "vitest";

import { criarAgendamento } from "../src/application/use-cases/criar-agendamento-usecase";
import { AgendamentoModel } from "../src/infra/database/models/agendamento-model";
import { MedicoModel } from "../src/infra/database/models/medico-model";
import { validarHorario } from "../src/application/use-cases/validar-horario";

vi.mock("../src/infra/database/models/agendamento-model", () => ({
  AgendamentoModel: {
    exists: vi.fn(),
    create: vi.fn()
  }
}));

vi.mock("../src/infra/database/models/medico-model", () => ({
  MedicoModel: {
    findById: vi.fn()
  }
}));

vi.mock("../src/application/use-cases/validar-horario", () => ({
  validarHorario: vi.fn()
}));

const dadosValidos = {
  pacienteId: "PAC_TESTE",
  pacienteNome: "Paciente Teste",
  pacienteTelefone: "49999999999",
  medicoId: "MED01",
  dataConsulta: new Date("2030-10-07T13:00:00.000Z"),
  tipoAtendimento: "particular" as const
};

describe("Criação de agendamentos", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(MedicoModel.findById).mockResolvedValue({
      _id: "MED01",
      grade: []
    } as never);

    vi.mocked(validarHorario).mockReturnValue(true);

    vi.mocked(AgendamentoModel.exists).mockResolvedValue(null);
  });

  it("impede agendar quando o médico já está ocupado", async () => {
    vi.mocked(AgendamentoModel.exists)
      .mockResolvedValueOnce({ _id: "AG_EXISTENTE" });

    await expect(
      criarAgendamento(dadosValidos)
    ).rejects.toThrow(
      "O médico já possui uma consulta neste horário."
    );

    expect(AgendamentoModel.create).not.toHaveBeenCalled();
  });

  it("impede agendar quando o paciente já está ocupado", async () => {
    vi.mocked(AgendamentoModel.exists)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: "AG_EXISTENTE" });

    await expect(
      criarAgendamento(dadosValidos)
    ).rejects.toThrow(
      "O paciente já possui uma consulta neste horário."
    );

    expect(AgendamentoModel.create).not.toHaveBeenCalled();
  });

  it("permite criar uma consulta quando não há conflitos", async () => {
    vi.mocked(AgendamentoModel.create).mockResolvedValue({
      _id: "AG_NOVO",
      ...dadosValidos,
      status: "agendada"
    } as never);

    const resultado = await criarAgendamento(dadosValidos);

    expect(resultado._id).toBe("AG_NOVO");

    expect(AgendamentoModel.exists).toHaveBeenCalledTimes(2);

    expect(AgendamentoModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pacienteId: "PAC_TESTE",
        medicoId: "MED01",
        status: "agendada",
        tipoAtendimento: "particular"
      })
    );
  });

  it("impede criar uma consulta com médico inexistente", async () => {
    vi.mocked(MedicoModel.findById).mockResolvedValue(null);

    await expect(
      criarAgendamento(dadosValidos)
    ).rejects.toThrow("Médico não encontrado.");

    expect(AgendamentoModel.create).not.toHaveBeenCalled();
  });

  it("impede criar uma consulta fora da grade médica", async () => {
    vi.mocked(validarHorario).mockReturnValue(false);

    await expect(
      criarAgendamento(dadosValidos)
    ).rejects.toThrow("Horário fora da grade do médico.");

    expect(AgendamentoModel.create).not.toHaveBeenCalled();
  });
});
