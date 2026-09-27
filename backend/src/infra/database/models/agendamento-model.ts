import mongoose from "mongoose";

const agendamentoSchema = new mongoose.Schema({
  _id: String,
  pacienteId: { type: String, required: true },
  pacienteNome: String,
  pacienteTelefone: String,
  medicoId: { type: String, required: true },
  dataAgendamento: { type: Date, required: true },
  dataConsulta: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: [
      "agendada",
      "confirmada",
      "realizada",
      "falta",
      "cancelada_paciente",
      "cancelada_clinica"
    ]
  },
  tipoAtendimento: {
    type: String,
    enum: ["convenio", "particular"]
  }
});

export const AgendamentoModel = mongoose.model(
  "Agendamento",
  agendamentoSchema
);