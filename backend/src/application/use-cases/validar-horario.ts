type Grade = {
  dia: string;
  inicio: string;
  fim: string;
};

const diasSemana = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado"
];

function converterMinutos(horario: string): number {
  const [hora, minuto] = horario.split(":").map(Number);
  return hora * 60 + minuto;
}

export function validarHorario(
  dataConsulta: Date,
  grade: Grade[]
): boolean {
  const dia = diasSemana[dataConsulta.getDay()];

  const inicioConsulta =
    dataConsulta.getHours() * 60 +
    dataConsulta.getMinutes();

  const fimConsulta = inicioConsulta + 30;

  return grade.some(horario => {
    if (horario.dia !== dia) return false;

    const inicioGrade = converterMinutos(horario.inicio);
    const fimGrade = converterMinutos(horario.fim);

    return (
      inicioConsulta >= inicioGrade &&
      fimConsulta <= fimGrade &&
      (inicioConsulta - inicioGrade) % 30 === 0
    );
  });
}