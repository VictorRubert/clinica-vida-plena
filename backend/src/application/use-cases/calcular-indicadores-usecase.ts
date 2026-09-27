import { AgendamentoModel } from "../../infra/database/models/agendamento-model";

export async function calcularIndicadores(
  inicio: Date,
  fim: Date
) {
  const resultado = await AgendamentoModel.aggregate([
    {
      $match: {
        dataConsulta: { $gte: inicio, $lte: fim },
        status: { $in: ["realizada", "falta"] }
      }
    },
    {
      $group: {
        _id: "$medicoId",
        realizadas: {
          $sum: { $cond: [{ $eq: ["$status", "realizada"] }, 1, 0] }
        },
        faltas: {
          $sum: { $cond: [{ $eq: ["$status", "falta"] }, 1, 0] }
        }
      }
    }
  ]);

  const porMedico = resultado.map(item => ({
    medicoId: item._id,
    realizadas: item.realizadas,
    faltas: item.faltas,
    taxaFaltas: Number(
      ((item.faltas / (item.realizadas + item.faltas)) * 100).toFixed(2)
    )
  }));

  const realizadas = porMedico.reduce(
    (total, medico) => total + medico.realizadas, 0
  );

  const faltas = porMedico.reduce(
    (total, medico) => total + medico.faltas, 0
  );

  return {
    total: realizadas + faltas,
    realizadas,
    faltas,
    taxaFaltas: realizadas + faltas > 0
      ? Number(((faltas / (realizadas + faltas)) * 100).toFixed(2))
      : 0,
    porMedico
  };
}