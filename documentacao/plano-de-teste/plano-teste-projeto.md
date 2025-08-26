
# Plano de Teste

**Projeto Plataforma de Divulgação de Eventos**

## 1 - Introdução

O presente sistema tem como objetivo informatizar a divulgação e o gerenciamento de eventos institucionais do IFRO. A plataforma oferece funcionalidades que abrangem o cadastro completo de eventos por parte dos administradores, controle de status (ativo/inativo), upload e gerenciamento de mídias (como capas, vídeos e imagens de carrossel), além da geração dinâmica de QR Codes para inscrição. O sistema também contempla rotas especializadas para exibição em totens, promovendo maior visibilidade institucional. Toda a estrutura foi desenvolvida com foco na organização modular e padronização profissional da API, facilitando futuras integrações com front-ends e painel administrativo.

Este plano de teste descreve os cenários, critérios de aceitação e verificações que serão aplicados sobre as principais funcionalidades do sistema, visando garantir o correto funcionamento das regras de negócio, a integridade dos dados e a experiência do usuário.


## 2 - Arquitetura da API

A aplicação adota uma arquitetura modular em camadas, implementada com as tecnologias Node.js, Express, MongoDB (via Mongoose), Zod para validação de dados, JWT para autenticação e Swagger para documentação interativa da API. O objetivo é garantir uma estrutura clara, escalável e de fácil manutenção, com separação de responsabilidades e aderência a boas práticas de desenvolvimento backend.

### Camadas;

**Routes**: Responsável por definir os endpoints da aplicação e encaminhar as requisições para os controllers correspondentes. Cada recurso do sistema possui um arquivo de rotas dedicado.

**Controllers**: Gerenciam a entrada das requisições HTTP, realizam a validação de dados com Zod e invocam os serviços adequados. Também são responsáveis por formatar e retornar as respostas.

**Services**: Esta camada centraliza as regras de negócio do sistema. Ela abstrai a lógica do domínio, orquestra operações e valida fluxos antes de interagir com a base de dados.

**Repositories**: Encapsulam o acesso aos dados por meio dos modelos do Mongoose, garantindo que a manipulação do banco esteja isolada da lógica de negócio.

**Models**: Definem os esquemas das coleções do MongoDB, com o uso de Mongoose, representando as entidades principais do sistema como usuários e eventos.

**Validations**: Utiliza Zod para garantir que os dados recebidos nas requisições estejam no formato esperado, aplicando validações personalizadas e mensagens de erro claras.

**Middlewares**: Implementam funcionalidades transversais, como autenticação de usuários com JWT, tratamento global de erros, e controle de permissões por tipo de perfil.


## 3 - Categorização  dos  Requisitos  em  Funcionais  x  Não Funcionais

| Código | Requisito Funcional                                                                                   | Regra de Negócio Associada                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **RF-001**   | Realizar Login        | Permite o administrador realizar login no sistema.   |
| **RF-002**   | Manter Eventos     | Permite o administrador criar, atualizar e remover eventos.   |
| **RF-003**   | Partilha de Permissões para Edição | Permite ao administrador compartilhar o link para edição de seus eventos cadastrados.   |
| **RF-004**   | Incorporar Imagens e Vídeos | Permite o administrador incorporar vídeos e fotos acerca dos eventos a serem cadastrados.   |
| **RF-005**   | Visualizar Eventos   | Os usuários podem visualizar eventos passados, atuais e futuros cadastrados no sistema.   |
| **RF-006**   | Incorporar QR Code de Inscrição   | Permite ao administrador inserir um link externo (ex: forms) ao cadastrar um evento, e esse link aparece em forma de QR Code no totem de visualização.   |


| Código | Requisito Não Funcional                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| **RNF-001**  | Interface Simples e Intuitiva   | A interface deve ser intuitiva e clara tanto para administradores quanto para usuários.   |  
| **RNF-002**  | Layout Pré-Definido na Criação de Eventos   | A plataforma deve oferecer layouts prontos para cadastro de eventos.   |  
| **RNF-003**  | Compatível com Telas Sensíveis ao Toque e Mouse   | O sistema deve ser compatível e adequado tanto para telas touch screen, quanto telas de computador. |
| **RNF-004**  | Sistema Leve e Rápido para Carregar Eventos e Interações   | O sistema deve suportar as interações com as telas sem degradação perceptível de desempenho, garantindo um tempo de resposta de no máximo 1 segundo.   |
| **RNF-005**  | Seguir a Identidade Visual do IFRO   | O design do sistema deve conter as logos de indêntidade do instituto. |  
| **RNF-006**  | Elementos Interativos   | A interface deve conter elementos interativos como, botões para visualizar fotos, inscrições e informações sobre os eventos. |


## 4 - Casos de Teste
Os casos de teste serão implementados ao longo do desenvolvimento, organizados em arquivos complementares. De forma geral, serão considerados cenários de sucesso, cenários de falha e as regras de negócio associadas a cada funcionalidade.


## 5 - Estratégia de Teste

A estratégia de teste adotada neste projeto busca garantir a qualidade funcional e estrutural do sistema da plataforma por meio da aplicação de testes em múltiplos níveis, alinhados ao ciclo de desenvolvimento.

Serão executados testes em todos os níveis conforme a descrição abaixo.

**Testes Unitários**: Focados em verificar o comportamento isolado das funções, serviços e regras de negócio, o código terá uma cobertura de 70% de testes unitários, que são de responsabilidade dos desenvolvedores.

**Testes de Integração**: Verificarão a interação entre diferentes camadas (ex: controller + service + repository) e a integração com o banco de dados, serão executados testes de integração em todos os endpoints, e esses testes serão dos desenvolvedores.

**Testes Manuais**: Realizados pontualmente na API por meio do Swagger ou Postman, com o objetivo de validar diferentes fluxos de uso e identificar comportamentos inesperados durante o desenvolvimento. A execução desses testes é de responsabilidade dos desenvolvedores, tanto durante quanto após a implementação das funcionalidades.

Os testes serão implementados de forma incremental, acompanhando o desenvolvimento das funcionalidades. Cada funcionalidade terá seu próprio plano de teste específico, com os casos detalhados, critérios de aceitação e cenários de sucesso e falha.


## 6 -	Ambiente e Ferramentas

Os testes serão feitos do ambiente de desenvolvimento, e contém as mesmas configurações do ambiente de produção.

As seguintes ferramentas serão utilizadas no teste:

Ferramenta | 	Time |	Descrição 
-----------|--------|--------
POSTMAN, Swagger UI 	| Desenvolvimento|	Ferramenta para realização de testes manuais de API
Jest|	Desenvolvimento |Framework utilizada para testes unitários e integração
Supertest|	Desenvolvimento|	Framework utilizada para testes de endpoints REST
MongoDB Memory Server|	Desenvolvimento|	Para testes com banco em memória, garantindo isolamento dos dados


## 7 - Classificação de Bugs

Os Bugs serão classificados com as seguintes severidades:

ID 	|Nivel de Severidade |	Descrição 
-----------|--------|--------
1	|Blocker |	●	Bug que bloqueia o teste de uma função ou feature causa crash na aplicação. <br>●	Botão não funciona impedindo o uso completo da funcionalidade. <br>●	Bloqueia a entrega. 
2	|Grave |	●	Funcionalidade não funciona como o esperado <br>●	Input incomum causa efeitos irreversíveis
3	|Moderada |	●	Funcionalidade não atinge certos critérios de aceitação, mas sua funcionalidade em geral não é afetada <br>●	Mensagem de erro ou sucesso não é exibida
4	|Pequena |	●	Quase nenhum impacto na funcionalidade porém atrapalha a experiência  <br>●	Erro ortográfico<br>● Pequenos erros de UI


### 8 - 	Definição de Pronto 
Será considerada pronta as funcionalidades que passarem pelas verificações e testes descritas nos casos de teste, não apresentarem bugs com a severidade acima de moderada, e passarem por uma validação da equipe.