# Análise de Requisitos — AI GitHub Issue Creator

Documento de análise funcional e não funcional do sistema de criação automática de GitHub Issues com IA, voltado para uso organizacional no GitHub.com.

---

## 1. Visão Geral

O sistema tem como objetivo auxiliar líderes técnicos (CTO, Tech Leads) na criação de GitHub Issues claras, técnicas e acionáveis, a partir de linguagem natural, utilizando IA com **contexto real do código-fonte**.

O GitHub é a **única fonte da verdade** do código.  
O sistema **não clona repositórios**, mas consome o conteúdo via GitHub API para gerar entendimento semântico temporário (embeddings).

O CTO poderá **escolher, no momento do uso**, qual provedor e modelo de IA utilizar. Para viabilizar essa flexibilidade desde o início, a integração de LLM será construída com **LangChain**.

---

## 2. Atores do Sistema

### 2.1 Usuário Principal
- CTO
- Tech Lead
- Engineering Manager

### 2.2 Sistemas Externos
- GitHub.com (organização)
- LLM Provider
- Banco de dados (vetores + metadata)

---

## 3. Requisitos Funcionais (RF)

### RF-01 — Autenticação via GitHub
O sistema deve permitir autenticação exclusivamente via GitHub OAuth (GitHub.com).

---

### RF-02 — Listagem de Repositórios
O sistema deve listar apenas os repositórios aos quais o usuário autenticado tem acesso.

---

### RF-03 — Seleção de Repositório
O usuário deve poder selecionar um repositório específico para contextualizar a demanda.

---

### RF-04 — Indexação via GitHub API
O sistema deve:
- Ler arquivos do repositório via GitHub API
- Filtrar extensões relevantes
- Ignorar diretórios irrelevantes
- Gerar embeddings a partir do conteúdo

Não deve realizar `git clone`.

---

### RF-05 — Versionamento por Commit
O sistema deve associar embeddings ao commit SHA utilizado na indexação.

---

### RF-06 — Chat Guiado de Demanda
O sistema deve fornecer uma interface de chat estruturado, com campos mínimos:
- Problema
- Resultado esperado
- Impacto
- Prazo (opcional)

---

### RF-07 — Recuperação Semântica
O sistema deve recuperar apenas os trechos de código semanticamente relevantes à demanda informada.

---

### RF-08 — Geração Estruturada de Issue
O sistema deve gerar uma Issue com os seguintes campos obrigatórios:
- Título
- Descrição
- Critérios de aceite
- Notas técnicas
- Riscos

---

### RF-09 — Validação da Saída da IA
A saída da IA deve ser validada contra um schema fixo antes de ser apresentada ao usuário.

---

### RF-10 — Revisão Humana
O usuário deve revisar e confirmar a Issue antes da criação no GitHub.

---

### RF-11 — Criação da Issue no GitHub
O sistema deve criar a Issue via GitHub API somente após confirmação explícita do usuário.

---

### RF-12 — Assignees
Os assignees devem ser selecionados pelo usuário e validados via GitHub API.

---

### RF-13 — Logs de Auditoria
O sistema deve registrar:
- input do usuário
- contexto recuperado
- saída final da IA
- usuário responsável

---

## 4. Requisitos Não Funcionais (RNF)

### RNF-01 — Performance
- O tempo médio de resposta para geração de Issue não deve exceder limites aceitáveis de UX.
- Indexação pode ser assíncrona e demorada.

---

### RNF-02 — Escalabilidade
- O sistema deve suportar múltiplos repositórios e usuários.
- O worker deve escalar independentemente da UI.

---

### RNF-03 — Segurança
- Tokens GitHub com escopo mínimo.
- Nenhum token sensível deve ser exposto ao frontend.
- Comunicação interna restrita à rede corporativa.

---

### RNF-04 — Confiabilidade
- Falhas na IA não devem indisponibilizar o sistema.
- Deve existir fallback para erro de geração.

---

### RNF-05 — Auditabilidade
- Todas as decisões da IA devem ser rastreáveis.
- O sistema deve permitir auditoria posterior.

---

### RNF-06 — Consistência
- O contexto utilizado pela IA deve ser determinístico.
- A mesma entrada deve gerar resultados semelhantes, considerando o mesmo commit.

---

### RNF-07 — Manutenibilidade
- Prompt tratado como código e versionado.
- Separação clara entre UI, orquestração e IA.

---

### RNF-08 — Observabilidade
- Logs estruturados
- Métricas de latência
- Métricas de custo por requisição

---

### RNF-09 — Governança
- Feature flag para desligar IA
- Possibilidade de bloquear repositórios sensíveis
- Controle de acesso por time

---

### RNF-10 — Compliance Organizacional
- Compatível com políticas internas de segurança
- Nenhum dado sensível enviado ao LLM sem controle

---

## 5. Restrições Técnicas

- Execução em servidor interno da empresa
- Uso de GitHub.com (organização)
- Worker implementado em Node.js
- Next.js para frontend e orquestração
- Orquestração e integração de LLM via LangChain para suportar múltiplos provedores/modelos

---

## 6. Fora de Escopo

- Execução de código
- Auto-merge
- Criação automática sem revisão
- Substituição de refinamento humano

---

## 7. Critérios de Sucesso

- Redução do tempo gasto pelo CTO criando issues
- Melhoria da clareza técnica das demandas
- Adoção contínua pela equipe
- Baixo índice de retrabalho

---

## 8. Princípios Norteadores

- Engenharia antes de hype
- IA como assistente, não autoridade
- Determinismo > autonomia
- Simplicidade operacional
