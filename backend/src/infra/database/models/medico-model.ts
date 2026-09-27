import mongoose from "mongoose";

const horarioSchema = new mongoose.Schema(
  {
    dia: { type: String, required: true },
    inicio: { type: String, required: true },
    fim: { type: String, required: true }
  },
  { _id: false }
);

const medicoSchema = new mongoose.Schema({
  _id: String,
  nome: { type: String, required: true },
  especialidade: { type: String, required: true },
  grade: [horarioSchema]
});

export const MedicoModel = mongoose.model(
  "Medico",
  medicoSchema
);