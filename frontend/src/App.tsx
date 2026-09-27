import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:3001";

type Indicadores = {
  total: number;
  realizadas: number;
  faltas: number;
  taxaFaltas: number;
  porMedico: IndicadorMedico[];
};

type Agendamento = {
  _id: string;
  pacienteNome: string;
  pacienteTelefone: string;
  medicoId: string;
  dataConsulta: string;
  status: string;
  lembreteEnviadoEm?: string | null;
  quantidadeLembretes?: number;
};

type Medico = {
  _id: string;
  nome: string;
  especialidade: string;
};

type IndicadorMedico = {
  medicoId: string;
  realizadas: number;
  faltas: number;
  taxaFaltas: number;
};

function App() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [dataInicio, setDataInicio] = useState("2025-01-01");
  const [dataFim, setDataFim] = useState("2026-12-31");
  const [medicoSelecionado, setMedicoSelecionado] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [resIndicadores, resAgendamentos, resMedicos] = await Promise.all([
        fetch(`${API}/indicadores?inicio=${dataInicio}&fim=${dataFim}`),
        fetch(`${API}/agendamentos/pendentes-confirmacao`),
        fetch(`${API}/medicos`)
      ]);

      if (
        !resIndicadores.ok ||
        !resAgendamentos.ok ||
        !resMedicos.ok
      ) {
        throw new Error("Não foi possível consultar a API.");
      }

      setIndicadores(await resIndicadores.json());
      setAgendamentos(await resAgendamentos.json());
      setMedicos(await resMedicos.json());
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro desconhecido."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function executarAcao(
    id: string,
    acao: "lembrete" | "confirmar"
  ) {
    if (processandoId) return;

    try {
      setProcessandoId(id);
      setErro("");
      setMensagem("");

      const url =
        acao === "lembrete"
          ? `${API}/agendamentos/${id}/lembrete`
          : `${API}/agendamentos/${id}/status`;

      const resposta = await fetch(url, {
        method: acao === "lembrete" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(acao === "confirmar" && {
          body: JSON.stringify({ status: "confirmada" })
        })
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.erro ?? "Erro ao executar a ação.");
      }

      if (acao === "lembrete") {
        setAgendamentos(anteriores =>
          anteriores.map(agendamento =>
            agendamento._id === id
              ? {
                  ...agendamento,
                  quantidadeLembretes: resultado.quantidadeLembretes,
                  lembreteEnviadoEm: resultado.lembreteEnviadoEm
                }
              : agendamento
          )
        );

        setMensagem("Lembrete simulado registrado com sucesso.");
      } else {
        setAgendamentos(anteriores =>
          anteriores.filter(agendamento => agendamento._id !== id)
        );

        setMensagem("Consulta confirmada com sucesso.");
      }
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro desconhecido."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function formatarData(data: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(data));
  }

  const indicadoresFiltrados = medicoSelecionado
  ? indicadores?.porMedico.filter(
      (item) => item.medicoId === medicoSelecionado
    ) ?? []
  : indicadores?.porMedico ?? [];

  const resumoFiltrado = medicoSelecionado
    ? {
        realizadas: indicadoresFiltrados[0]?.realizadas ?? 0,
        faltas: indicadoresFiltrados[0]?.faltas ?? 0,
        total:
          (indicadoresFiltrados[0]?.realizadas ?? 0) +
          (indicadoresFiltrados[0]?.faltas ?? 0),
        taxaFaltas: indicadoresFiltrados[0]?.taxaFaltas ?? 0
      }
    : indicadores;

  const agendamentosFiltrados = medicoSelecionado
  ? agendamentos.filter(
      (agendamento) => agendamento.medicoId === medicoSelecionado
    )
  : agendamentos;

  return (
    <div className="app">
      <header className="cabecalho">
        <div>
          <span className="subtitulo">CLÍNICA VIDA PLENA</span>
          <h1>Painel da recepção</h1>
          <p>Acompanhe os atendimentos e as confirmações de consultas.</p>
        </div>

        <button onClick={carregarDados} disabled={carregando}>
          Atualizar dados
        </button>
      </header>

      <section className="filtros">
        <div>
          <label htmlFor="dataInicio">Data inicial</label>
          <input
            id="dataInicio"
            type="date"
            lang="pt-BR"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="dataFim">Data final</label>
          <input
            id="dataFim"
            type="date"
            lang="pt-BR"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="medico">Médico</label>

          <select
            id="medico"
            value={medicoSelecionado}
            onChange={(e) => setMedicoSelecionado(e.target.value)}
          >
            <option value="">Todos os médicos</option>

            {medicos.map((medico) => (
              <option key={medico._id} value={medico._id}>
                {medico.nome}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={carregarDados}
          disabled={carregando || !dataInicio || !dataFim || dataInicio > dataFim}
        >
          Aplicar filtros
        </button>
      </section>

      {erro && <div className="erro">{erro}</div>}
      {mensagem && <div className="sucesso">{mensagem}</div>}

      {carregando ? (
        <p>Carregando informações...</p>
      ) : (
        <>
          <section className="indicadores">
            <div className="cartao">
              <span>Consultas concluídas</span>
              <strong>{indicadores?.total ?? 0}</strong>
            </div>

            <div className="cartao">
              <span>Consultas realizadas</span>
              <strong>{indicadores?.realizadas ?? 0}</strong>
            </div>

            <div className="cartao">
              <span>Faltas registradas</span>
              <strong>{indicadores?.faltas ?? 0}</strong>
            </div>

            <div className="cartao destaque">
              <span>Taxa de faltas</span>
              <strong>{indicadores?.taxaFaltas ?? 0}%</strong>
            </div>
          </section>

          <section className="painel painel-medicos">
            <div className="secao-titulo">
              <div>
                <h2>Indicadores por médico</h2>
                <p>Comparativo das consultas realizadas e faltas registradas.</p>
              </div>
            </div>

            <div className="tabela-container">
              <table>
                <thead>
                  <tr>
                    <th>Médico</th>
                    <th>Especialidade</th>
                    <th>Realizadas</th>
                    <th>Faltas</th>
                    <th>Taxa de faltas</th>
                  </tr>
                </thead>

                <tbody>
                  {indicadoresFiltrados.map((item) => {
                    const medico = medicos.find(
                      (medico) => medico._id === item.medicoId
                    );

                    return (
                      <tr key={item.medicoId}>
                        <td>
                          <strong>{medico?.nome ?? item.medicoId}</strong>
                        </td>

                        <td>{medico?.especialidade ?? "—"}</td>
                        <td>{item.realizadas}</td>
                        <td>{item.faltas}</td>

                        <td>
                          <div className="taxa-medico">
                            <strong>{item.taxaFaltas.toFixed(2)}%</strong>

                            <div className="barra-taxa">
                              <div
                                className="barra-preenchimento"
                                style={{
                                  width: `${item.taxaFaltas}%`
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="painel">
            <div className="secao-titulo">
              <div>
                <h2>Pendentes de confirmação</h2>
                <p>Consultas agendadas para os próximos sete dias.</p>
              </div>

              <span className="contador">
                {agendamentosFiltrados.length} pendentes
              </span>
            </div>

            <div className="tabela-container">
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Médico</th>
                    <th>Data da consulta</th>
                    <th>Lembretes</th>
                    <th>Situação</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {agendamentosFiltrados.map((agendamento) => (
                    <tr key={agendamento._id}>
                      <td>
                        <strong>{agendamento.pacienteNome}</strong>
                        <small>{agendamento.pacienteTelefone}</small>
                      </td>

                      <td>{agendamento.medicoId}</td>

                      <td>{formatarData(agendamento.dataConsulta)}</td>

                      <td>{agendamento.quantidadeLembretes ?? 0}</td>

                      <td>
                        <span className="etiqueta">
                          Aguardando confirmação
                        </span>
                      </td>

                      <td>
                        <div className="acoes">
                          <button
                            className="botao-lembrete"
                            onClick={() =>
                              executarAcao(agendamento._id, "lembrete")
                            }
                            disabled={
                              processandoId === agendamento._id ||
                              (
                                !!agendamento.lembreteEnviadoEm &&
                                Date.now() - new Date(agendamento.lembreteEnviadoEm).getTime()
                                  < 24 * 60 * 60 * 1000
                              )
                            }
                          >
                            Enviar lembrete
                          </button>

                          <button
                            className="botao-confirmar"
                            onClick={() =>
                              executarAcao(agendamento._id, "confirmar")
                            }
                            disabled={processandoId === agendamento._id}
                          >
                            Confirmar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {agendamentosFiltrados.length === 0 && (
                <p className="vazio">Nenhuma consulta pendente encontrada.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default App;