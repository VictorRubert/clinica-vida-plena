import { AgendamentoModel } from "../../infra/database/models/agendamento-model";
import { MedicoModel } from "../../infra/database/models/medico-model";
import { validarHorario } from "./validar-horario";
import { StatusAgendamento } from "../../domain/entity/agendamento";

export async function reagendarAgendamento(
  id: string,
  novaData: Date
) {
  if (Number.isNaN(novaData.getTime()) || novaData <= new Date()) {
    throw new Error("Informe uma data futura válida.");
  }

  const agendamento = await AgendamentoModel.findById(id);

  if (!agendamento) {
    throw new Error("Agendamento não encontrado.");
  }

  if (!["agendada", "confirmada"].includes(agendamento.status)) {
    throw new Error("Não é possível reagendar uma consulta finalizada.");
  }

  const medico = await MedicoModel.findById(agendamento.medicoId);

  if (!medico || !validarHorario(novaData, medico.grade)) {
    throw new Error("Horário fora da grade do médico.");
  }

  const statusOcupados: StatusAgendamento[] = [
    "agendada",
    "confirmada",
    "realizada",
    "falta"
  ];

  const conflito = await AgendamentoModel.exists({
    _id: { $ne: id },
    dataConsulta: novaData,
    status: { $in: statusOcupados },
    $or: [
      { medicoId: agendamento.medicoId },
      { pacienteId: agendamento.pacienteId }
    ]
  });

  if (conflito) {
    throw new Error("Médico ou paciente já possui consulta neste horário.");
  }

  agendamento.dataConsulta = novaData;
  agendamento.status = "agendada";

  await agendamento.save();

  return agendamento;
}