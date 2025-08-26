## REQUISITOS FUNCIONAIS
A tabela a seguir contém a relação dos Requisitos Funcionais elicitados, com as colunas: identificador, nome e descrição:

| IDENTIFICADOR | NOME                    | DESCRIÇÃO                                                                                                       |  
|:-------------|:------------------------|:-----------------------------------------------------------------------------------------------------------------|  
| **RF-001**   | Realizar Login        | Permite o administrador realizar login no sistema.   |
| **RF-002**   | Manter Eventos     | Permite o administrador criar, atualizar e remover eventos.   |
| **RF-003**   | Partilha de Permissões para Edição | Permite ao administrador compartilhar o link para edição de seus eventos cadastrados.   |
| **RF-004**   | Incorporar Imagens e Vídeos | Permite o administrador incorporar vídeos e fotos acerca dos eventos a serem cadastrados.   |
| **RF-005**   | Visualizar Eventos   | Os usuários podem visualizar eventos passados, atuais e futuros cadastrados no sistema.   |
| **RF-006**   | Incorporar QR Code de Inscrição   | Permite ao administrador inserir um link externo (ex: forms) ao cadastrar um evento, e esse link aparece em forma de QR Code no totem de visualização.   |


## REQUISITOS NÃO FUNCIONAIS
A tabela a seguir contém a relação com os Requisitos Não Funcionais identificados, contendo identificador, nome e descrição:

| IDENTIFICADOR | NOME                           | DESCRIÇÃO                                                                                                |  
|:-------------|:-------------------------------|:----------------------------------------------------------------------------------------------------------|  
| **RNF-001**  | Interface Simples e Intuitiva   | A interface deve ser intuitiva e clara tanto para administradores quanto para usuários.   |  
| **RNF-002**  | Layout Pré-Definido na Criação de Eventos   | A plataforma deve oferecer layouts prontos para cadastro de eventos.   |  
| **RNF-003**  | Compatível com Telas Sensíveis ao Toque e Mouse   | O sistema deve ser compatível e adequado tanto para telas touch screen, quanto telas de computador. |
| **RNF-004**  | Sistema Leve e Rápido para Carregar Eventos e Interações   | O sistema deve suportar as interações com as telas sem degradação perceptível de desempenho, garantindo um tempo de resposta de no máximo 1 segundo.   |
| **RNF-005**  | Seguir a Identidade Visual do IFRO   | O design do sistema deve conter as logos de indêntidade do instituto. |  
| **RNF-006**  | Elementos Interativos   | A interface deve conter elementos interativos como, botões para visualizar fotos, inscrições e informações sobre os eventos. |
---  


# Milestone 1

- Reuniões com o cliente
- Elicitação de requisitos
- Requisitos funcionais
- Requisitos não funcionais
- Prototipação do figma do 0
- Documentação simples do projeto
- Modelagem do Banco de Dados não relacional (MongoDB)
- Documentar cada rota (incluindo regras de negócio)
- Métricas Scrum


# Milestone 2

- Revisão dos requisitos a serem implementados na API (Entre a milestone 2 e os que poderão ficar para a milestone 3)
- Revisão do banco de dados e atributos a serem implementados na API
- Implementação das rotas na API (Documentar incluindo regras de negócio)
- Plano de teste da API com os cenários a serem implemtentados (Envolvendo regras de negócio)
- Testes unitários das funcionalidades da API (Envolvendo regras de negócio)
- Implementação prática da API com Postman
- Fluxos de Branchs e commits (GitLab)
- Métricas Scrum

# Milestone 3

- Finalização da autenticação com recuperação de senha e proteção de rotas
- Implementação da partilha de permissões para edição de eventos
- Implementação da geração de QR Code dinâmico com link de inscrição
- Criação da documentação interativa com Swagger
- Testes unitários atualizados com as novas funcionalidades e métodos
- Cobertura de testes de endpoints com Supertest
- Atualização da documentação final do projeto
- Preparação para execução com Docker (api + banco)
- Finalização do plano de testes e documentação das Sprints
- Fluxos de Branchs e commits (GitLab)
- Métricas Scrum