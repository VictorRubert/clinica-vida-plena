
# Clínica Vida Plena

Sistema de gerenciamento e análise de agendamentos médicos, desenvolvido como desafio técnico, com foco em regras de negócio, tratamento de dados, organização de software e proposição de uma solução para reduzir o não comparecimento de pacientes.

O projeto utiliza **Node.js, TypeScript, Express, MongoDB e React**, com execução integrada por Docker Compose.

Além das operações de agendamento, a aplicação importa e valida dados históricos, disponibiliza indicadores de faltas e implementa um fluxo de lembretes simulados para consultas ainda não confirmadas.

## 1. Contexto e objetivos

O desafio foi dividido em duas frentes complementares.

**Parte 1 — Gerenciamento e análise de agendamentos**

Desenvolvimento de uma aplicação capaz de importar os dados fornecidos, aplicar as regras de negócio de uma clínica médica e apresentar indicadores que auxiliem na compreensão dos agendamentos e das faltas.

**Parte 2 — Proposta de redução de faltas**

Análise dos dados históricos para identificar oportunidades de intervenção e implementação de uma funcionalidade prática voltada à redução do não comparecimento.

A solução escolhida foi um fluxo de lembretes simulados, integrado ao painel de consultas pendentes de confirmação.

## 2. Referência arquitetural e processo de desenvolvimento

A estrutura do projeto foi baseada em um repositório que desenvolvi anteriormente:

**Repositório de referência:**  
https://github.com/SukiDaiB/controleemprestimo

Esse projeto anterior serviu como referência para a organização do código, a separação de responsabilidades e a distribuição das funcionalidades em camadas.

Por já ter desenvolvido seu backend, eu tinha familiaridade com a estrutura utilizada. Isso reduziu a complexidade inicial do desafio, pois não foi necessário definir uma arquitetura inteiramente nova.

A organização foi adaptada ao domínio de agendamentos médicos, mantendo uma separação entre:

- **Domain:** entidades e regras de negócio.
- **Application:** casos de uso e controladores.
- **Infra:** modelos de persistência e conexão com o banco.
- **Frontend:** interface e interação com a API.

A arquitetura não foi proposta como uma solução complexa ou excessivamente abstrata. O objetivo foi reaproveitar uma estrutura conhecida, adequada ao tamanho do desafio e que permitisse desenvolver e testar cada funcionalidade de forma independente.

O desenvolvimento ocorreu de maneira incremental, começando pelas entidades e regras de negócio, passando pela importação e pelos endpoints, até chegar à interface, aos testes automatizados e à execução com Docker.

## 3. Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Backend | Node.js, TypeScript e Express |
| Persistência | MongoDB e Mongoose |
| Frontend | React, TypeScript e Vite |
| Testes | Vitest |
| Infraestrutura | Docker e Docker Compose |

O TypeScript foi utilizado tanto no backend quanto no frontend para facilitar a organização dos dados e reduzir erros relacionados aos tipos utilizados pela aplicação.

## 4. Estrutura do projeto

```text
clinica-vida-plena/
├── backend/
│   ├── src/
│   │   ├── application/
│   │   │   ├── controller/
│   │   │   └── use-cases/
│   │   ├── domain/
│   │   │   └── entity/
│   │   ├── infra/
│   │   │   └── database/
│   │   │       └── models/
│   │   ├── import.ts
│   │   └── main.ts
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── data/
│   ├── agendamentos.csv
│   └── medicos.json
├── docker-compose.yml
└── README.md
```

### Backend

O backend concentra as regras de negócio, a validação dos agendamentos, a importação, os indicadores e as operações de persistência.

As responsabilidades foram separadas em entidades, casos de uso, controladores e infraestrutura, seguindo a organização adotada no repositório de referência.

### Frontend

O frontend foi desenvolvido em React com TypeScript e consome os endpoints disponibilizados pela API.

A interface concentra os indicadores históricos e as operações relacionadas às consultas pendentes de confirmação.

## 5. Execução

### Pré-requisitos

- Docker
- Docker Compose

Com o Docker instalado e em execução, não é necessário instalar o Node.js ou o MongoDB diretamente no computador.

### Iniciar a aplicação

Na raiz do projeto, execute:

```bash
docker compose up --build
```

O Docker Compose inicializa o MongoDB, aguarda a disponibilidade do banco, executa a importação e inicia o backend e o frontend.

| Serviço | Endereço |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| Health check | http://localhost:3001/health |
| MongoDB | localhost:27017 |

Para executar os serviços em segundo plano:

```bash
docker compose up -d --build
```

Para consultar os logs do backend:

```bash
docker compose logs backend --tail=100
```

Para encerrar:

```bash
docker compose down
```

Os dados do MongoDB são armazenados em um volume persistente e não são apagados pelo comando de encerramento acima.

### Importação automática

A inicialização do backend executa o script de importação antes de iniciar a API.

O procedimento importa os médicos e, posteriormente, os agendamentos, pois a validação das consultas depende da grade de horários de cada profissional.

A importação dos agendamentos utiliza inserção condicional. Dessa forma, reiniciar os serviços não duplica os registros nem sobrescreve alterações já realizadas nesses agendamentos.

Os dados dos médicos são atualizados a partir do arquivo JSON a cada execução da importação.

## 6. Funcionalidades

### Importação e tratamento de dados

O sistema recebe dois arquivos:

- `medicos.json`: dados dos médicos e suas grades de atendimento.
- `agendamentos.csv`: histórico de consultas.

Os dados são normalizados e validados antes da inserção no MongoDB.

O relatório de importação apresenta a quantidade de registros processados, válidos, descartados e corrigidos, além dos motivos de descarte.

### Gerenciamento de consultas

A API disponibiliza operações para criação, listagem, edição, reagendamento e atualização do status dos agendamentos.

As principais regras implementadas são:

- Consultas com duração de 30 minutos.
- Agendamentos somente em horários pertencentes à grade do médico.
- Impedimento de conflitos de horário para médicos e pacientes.
- Validação de datas e informações obrigatórias.
- Controle das transições de status.
- Bloqueio de alterações em consultas finalizadas.

Para a verificação de conflitos, são consideradas as consultas com status `agendada` ou `confirmada`.

Uma consulta confirmada não pode voltar ao estado de agendada. O registro de realização ou falta somente é permitido após o horário da consulta.

### Indicadores

A aplicação apresenta indicadores gerais e separados por médico, com filtros de período.

A taxa de faltas é calculada utilizando apenas consultas realizadas e consultas com falta registrada:

**Taxa de faltas = faltas / (realizadas + faltas) × 100**

Consultas canceladas não fazem parte desse cálculo.

### Painel de confirmação

O frontend permite visualizar consultas futuras ainda não confirmadas, registrar lembretes simulados e confirmar agendamentos.

O registro de um novo lembrete para a mesma consulta fica bloqueado por 24 horas após o último envio simulado.

## 7. Endpoints

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/health` | Verificar a disponibilidade da API |
| GET | `/medicos` | Listar médicos |
| GET | `/agendamentos` | Listar consultas |
| POST | `/agendamentos` | Criar consulta |
| PATCH | `/agendamentos/:id` | Editar consulta |
| PATCH | `/agendamentos/:id/reagendar` | Reagendar consulta |
| PATCH | `/agendamentos/:id/status` | Atualizar status |
| GET | `/indicadores` | Consultar indicadores |
| GET | `/agendamentos/pendentes-confirmacao` | Consultar pendências |
| POST | `/agendamentos/:id/lembrete` | Registrar lembrete simulado |

## 8. Relatório de importação

A importação dos arquivos fornecidos apresentou os seguintes resultados:

| Indicador | Quantidade |
|---|---:|
| Registros processados | 7.359 |
| Registros válidos | 6.931 |
| Registros descartados | 428 |
| Operações de normalização | 2.063 |
| Médicos processados | 6 |

### Normalizações

| Operação | Quantidade |
|---|---:|
| Normalização de status | 1.369 |
| Normalização do tipo de atendimento | 694 |
| Total | 2.063 |

O total representa operações de normalização. Um mesmo registro pode passar por mais de uma correção.

### Motivos dos descartes

| Motivo | Quantidade |
|---|---:|
| Status desconhecido | 249 |
| Agendamento posterior à consulta | 9 |
| Conflito de horário do médico | 87 |
| ID duplicado | 64 |
| Consulta fora da grade médica | 19 |
| **Total** | **428** |

Valores ambíguos foram descartados quando não havia informação suficiente para determinar uma normalização segura.

A importação também foi executada sobre uma base já preenchida. Nessa verificação, os 6.931 registros válidos foram reconhecidos como existentes, sem novas inserções.

## 9. Análise histórica das faltas

A análise considerou exclusivamente consultas realizadas e consultas com falta registrada.

### Indicadores gerais

| Indicador | Resultado |
|---|---:|
| Consultas consideradas | 6.267 |
| Realizadas | 4.283 |
| Faltas | 1.984 |
| Taxa geral de faltas | 31,66% |

### Faltas por médico

| Médico | Realizadas | Faltas | Taxa |
|---|---:|---:|---:|
| MED01 | 701 | 487 | 40,99% |
| MED02 | 698 | 285 | 28,99% |
| MED03 | 665 | 271 | 28,95% |
| MED04 | 1.080 | 421 | 28,05% |
| MED05 | 709 | 312 | 30,56% |
| MED06 | 430 | 208 | 32,60% |

As taxas apresentam variações entre os profissionais. Entretanto, esses dados não permitem atribuir as faltas diretamente aos médicos, pois outros fatores podem influenciar o comparecimento.

### Faltas por tipo de atendimento

| Tipo | Consultas | Faltas | Taxa |
|---|---:|---:|---:|
| Particular | 2.211 | 686 | 31,03% |
| Convênio | 4.056 | 1.298 | 32,00% |

A diferença observada entre os tipos de atendimento foi relativamente pequena.

### Faltas por antecedência

| Antecedência | Consultas | Faltas | Taxa |
|---|---:|---:|---:|
| Menos de 1 dia | 709 | 57 | 8,04% |
| 1 a 3 dias | 532 | 96 | 18,05% |
| 3 a 7 dias | 1.053 | 274 | 26,02% |
| 7 a 14 dias | 1.517 | 512 | 33,75% |
| 14 a 30 dias | 1.338 | 539 | 40,28% |
| 30 a 365 dias | 1.118 | 506 | 45,26% |

O principal padrão identificado foi a associação entre maior antecedência do agendamento e maior taxa de faltas.

Esse resultado não comprova uma relação causal, mas oferece uma referência para definir e avaliar uma intervenção.

## 10. Segunda parte — Redução de faltas

### Problema e hipótese

A análise histórica identificou taxas mais elevadas de faltas entre consultas agendadas com maior antecedência.

A hipótese adotada é que o contato prévio com pacientes que ainda não confirmaram suas consultas pode contribuir para reduzir o não comparecimento.

### Solução implementada

Foi desenvolvido um fluxo de lembretes simulados, integrado ao painel de consultas pendentes.

A funcionalidade permite identificar consultas futuras não confirmadas, registrar um lembrete, acompanhar a quantidade de lembretes e confirmar o agendamento.

Para evitar registros excessivos, existe um intervalo mínimo de 24 horas entre lembretes para a mesma consulta.

O envio é simulado: o sistema registra a operação, mas não envia mensagens reais por WhatsApp, SMS ou e-mail.

### Possível evolução

Uma evolução da funcionalidade seria priorizar visualmente consultas marcadas com 14 dias ou mais de antecedência, considerando o padrão observado na análise histórica.

Essa priorização automática não faz parte da implementação atual.

## 11. Estimativa de impacto

Para calcular o volume mensal, foram considerados 11 meses completos, entre outubro de 2025 e agosto de 2026.

| Indicador | Resultado |
|---|---:|
| Consultas consideradas | 5.711 |
| Faltas registradas | 1.824 |
| Média mensal de consultas | 519,2 |
| Média mensal de faltas | 165,8 |
| Taxa de faltas | 31,94% |

A clínica apresentou aproximadamente 166 faltas mensais no período analisado.

Como a funcionalidade ainda não possui resultados reais de eficácia, foram definidos cenários hipotéticos de redução relativa:

| Cenário | Redução assumida | Faltas potencialmente evitadas por mês |
|---|---:|---:|
| Conservador | 5% | 8 |
| Intermediário | 10% | 17 |
| Otimista | 15% | 25 |

O cenário intermediário representa aproximadamente 17 faltas potencialmente evitadas por mês, caso a intervenção alcance toda a população considerada e produza a redução assumida.

Os cenários são estimativas para planejamento, não resultados observados.

## 12. Plano de avaliação

A proposta é acompanhar a funcionalidade durante três meses.

**Primeiro mês — Implantação**

Verificar o funcionamento do fluxo, a cobertura dos lembretes e a quantidade de consultas confirmadas após o contato.

**Segundo mês — Acompanhamento**

Analisar a evolução dos indicadores e comparar, quando possível, consultas elegíveis que receberam lembretes com um grupo comparável sem lembretes.

**Terceiro mês — Consolidação**

Consolidar os resultados, verificar diferenças nas taxas de faltas e avaliar se existem evidências suficientes para manter ou ajustar a intervenção.

A avaliação deverá considerar possíveis diferenças entre médicos, tipos de atendimento e faixas de antecedência.

Sempre que operacionalmente viável, a comparação deverá utilizar grupos distribuídos aleatoriamente, reduzindo o risco de atribuir aos lembretes efeitos provocados por outras características dos pacientes.

## 13. Testes automatizados

Os testes foram implementados com Vitest e podem ser executados na pasta `backend`:

```bash
npm test
```

| Conjunto de testes | Quantidade |
|---|---:|
| Regras de status | 8 |
| Validação da grade médica | 6 |
| Criação e conflitos | 5 |
| Envio de lembretes | 7 |
| **Total** | **26** |

Os 26 testes foram aprovados na última execução.

Os testes utilizam dependências simuladas quando necessário, permitindo verificar as regras de negócio sem modificar os dados armazenados no MongoDB.

## 14. Uso de inteligência artificial

A inteligência artificial foi utilizada como uma ferramenta de apoio ao desenvolvimento, principalmente nas etapas em que eu tinha menos experiência prática com as tecnologias envolvidas.

A maior utilização ocorreu no **frontend com React**, tecnologia com a qual eu ainda não havia trabalhado extensivamente, e na **configuração do Docker**, especialmente durante a criação dos Dockerfiles, integração dos serviços e investigação de problemas de inicialização.

Também utilizei a IA para discutir a organização de funcionalidades, esclarecer dúvidas, auxiliar na elaboração de testes automatizados, investigar mensagens de erro e estruturar a documentação.

### Forma de utilização

A dinâmica adotada foi semelhante à colaboração entre um desenvolvedor júnior e um desenvolvedor pleno ou sênior.

A IA desempenhou o papel de apoio técnico mais experiente: sugeriu caminhos de implementação, explicou conceitos, auxiliou na organização do trabalho e orientou a investigação de problemas encontrados durante o desenvolvimento.

Minha participação concentrou-se na condução do projeto, na definição e adaptação das funcionalidades, na aplicação das soluções, na execução dos testes e na validação do comportamento da aplicação.

O desenvolvimento ocorreu de maneira iterativa. As implementações eram executadas e verificadas, e os erros encontrados eram analisados e corrigidos antes de avançar para as próximas etapas.

### Arquitetura e decisões

A estrutura principal não foi gerada do zero pela IA. Ela foi baseada no repositório `controleemprestimo`, desenvolvido anteriormente por mim.

Por esse motivo, a organização do backend e a separação de responsabilidades já eram familiares, o que simplificou essa parte do desafio.

A IA contribuiu principalmente para adaptar essa organização ao novo domínio, apoiar a implementação do React, orientar a configuração do Docker e auxiliar na resolução de problemas específicos.

### Validação

As sugestões da IA não foram tratadas como garantia de funcionamento.

A aplicação foi verificada por meio de testes manuais, execução dos endpoints, inspeção dos logs, consultas ao MongoDB e 26 testes automatizados.

Os indicadores e as estatísticas apresentados neste documento foram obtidos por consultas à base de dados importada.

O uso da IA foi, portanto, uma forma de orientação técnica e aceleração do aprendizado, e não uma substituição da verificação e da participação no desenvolvimento.

## 15. Limitações e melhorias futuras

A solução foi desenvolvida para atender ao escopo do desafio técnico e possui limitações que precisariam ser tratadas antes de uma utilização em produção.

Entre elas:

- Integração com um serviço real de envio de mensagens.
- Priorização automática dos lembretes conforme os padrões identificados.
- Autenticação e controle de acesso.
- Padronização e validação adicional de fusos horários.
- Testes de integração e de concorrência.
- Proteção adicional contra agendamentos simultâneos, por meio de mecanismos apropriados no banco de dados.
- Avaliação prática da eficácia dos lembretes.

A verificação atual de conflitos ocorre antes da inserção. Por isso, requisições estritamente simultâneas ainda podem exigir mecanismos adicionais para evitar condições de corrida.

## 16. Considerações finais

O desenvolvimento da Clínica Vida Plena permitiu aplicar uma arquitetura já conhecida a um novo domínio de negócio, integrando tratamento de dados, regras de agendamento, indicadores, interface web e infraestrutura de execução.

O reaproveitamento da estrutura de um projeto anterior reduziu a complexidade inicial da organização do código, permitindo concentrar mais esforço nas regras específicas do desafio e nas tecnologias com as quais eu tinha menos familiaridade.

A utilização da inteligência artificial como apoio técnico também fez parte desse processo, especialmente no aprendizado prático de React, na configuração do Docker e na resolução de problemas durante a implementação.

A análise dos dados identificou uma associação entre maior antecedência do agendamento e maior taxa de faltas. A partir desse resultado, foi implementado um fluxo de lembretes simulados e definido um plano para avaliar seu possível impacto ao longo de três meses.