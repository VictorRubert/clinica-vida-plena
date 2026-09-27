import { StatusAgendamento } from "../../domain/entity/agendamento";

export function normalizarStatus(
  valor: string
): StatusAgendamento | null {
  const status = valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const equivalencias: Record<string, StatusAgendamento> = {
    agendada: "agendada",
    agendado: "agendada",
    confirmada: "confirmada",
    confirmado: "confirmada",

    realizada: "realizada",
    realizado: "realizada",
    atendido: "realizada",
    atendida: "realizada",

    falta: "falta",
    faltou: "falta",
    no_show: "falta",
    ausente: "falta",

    cancelada_paciente: "cancelada_paciente",
    "cancelado pelo paciente": "cancelada_paciente",
    "cancelada pelo paciente": "cancelada_paciente",

    cancelada_clinica: "cancelada_clinica",
    "cancelado clinica": "cancelada_clinica",
    "cancelado pela clinica": "cancelada_clinica",
    "cancelada pela clinica": "cancelada_clinica"
  };

  return equivalencias[status] ?? null;
}

export function normalizarData(valor: string): Date | null {
  const texto = valor?.trim();

  if (!texto) return null;

  let ano: number;
  let mes: number;
  let dia: number;
  let hora: number;
  let minuto: number;

  const brasileiro = texto.match(
    /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/
  );

  const iso = texto.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/
  );

  if (brasileiro) {
    [, dia, mes, ano, hora, minuto] =
      brasileiro.map(Number);
  } else if (iso) {
    [, ano, mes, dia, hora, minuto] =
      iso.map(Number);
  } else {
    return null;
  }

  const data = new Date(
    ano,
    mes - 1,
    dia,
    hora,
    minuto
  );

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia ||
    data.getHours() !== hora ||
    data.getMinutes() !== minuto
  ) {
    return null;
  }

  return data;
}