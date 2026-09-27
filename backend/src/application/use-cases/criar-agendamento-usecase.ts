import { randomUUID } from "node:crypto";
import { AgendamentoModel } from "../../infra/database/models/agendamento-model";
import { MedicoModel } from "../../infra/database/models/medico-model";
import { validarHorario } from "./validar-horario";
import { StatusAgendamento } from "../../domain/entity/agendamento";

export type CriarAgendamentoInput = {
  pacienteId: string;
  pacienteNome: string;
  pacienteTelefone: string;
  medicoId: string;
  dataConsulta: Date;
  tipoAtendimento: "convenio" | "particular";
};

export async function criarAgendamento(
  input: CriarAgendamentoInput
) {
  const {
    pacienteId,
    pacienteNome,
    pacienteTelefone,
    medicoId,
    dataConsulta,
    tipoAtendimento
  } = input;

  if (
    !pacienteId?.trim() ||
    !pacienteNome?.trim() ||
    !pacienteTelefone?.trim()
  ) {
    throw new Error("Informe os dados do paciente.");
  }

  if (!["convenio", "particular"].includes(tipoAtendimento)) {
    throw new Error("Tipo de atendimento inválido.");
  }

  if (Number.isNaN(dataConsulta.getTime())) {
    throw new Error("Data da consulta inválida.");
  }

  if (dataConsulta <= new Date()) {
    throw new Error("A consulta deve ser agendada para uma data futura.");
  }

  const medico = await MedicoModel.findById(medicoId);

  if (!medico) {
    throw new Error("Médico não encontrado.");
  }

  if (!validarHorario(dataConsulta, medico.grade)) {
    throw new Error("Horário fora da grade do médico.");
  }

  const statusAtivos: StatusAgendamento[] = ["agendada","confirmada"];

  const conflitoMedico = await AgendamentoModel.exists({
    medicoId,
    dataConsulta,
    status: { $in: statusAtivos }
  });

  if (conflitoMedico) {
    throw new Error("O médico já possui uma consulta neste horário.");
  }

  const conflitoPaciente = await AgendamentoModel.exists({
    pacienteId,
    dataConsulta,
    status: { $in: statusAtivos }
  });

  if (conflitoPaciente) {
    throw new Error("O paciente já possui uma consulta neste horário.");
  }

  return AgendamentoModel.create({
    _id: randomUUID(),
    pacienteId,
    pacienteNome,
    pacienteTelefone,
    medicoId,
    dataAgendamento: new Date(),
    dataConsulta,
    status: "agendada",
    tipoAtendimento
  });
}