import cron from 'node-cron'; // Biblioteca para agendamento de tarefas
import 'dotenv/config'; // Garante que as variáveis de ambiente (DB_URL) sejam lidas

// Importa o logger e o DbConnect do seu projeto
import logger from '../logger.js';
import DbConnect from '../../config/DbConnect.js';

// Importa o modelo Mongoose
import Usuario from '../../models/Usuario.js';

// Função principal que se conecta, executa a limpeza e desconecta.
async function executarLimpezaUsuariosPendentes() {
    logger.info('[CRON] Iniciando job: "Limpar Usuários Pendentes" (sem senha e token expirado)...');

    try {
        // 1. Conectar ao banco
        await DbConnect.conectar();
        logger.info('[CRON] Conectado ao MongoDB para limpeza.');

        const agora = new Date();

        // 2. Definir a query
        // A lógica é:
        // 1. O campo 'senha' NÃO EXISTE ou é NULL (usuário não completou o cadastro)
        // 2. E o campo 'exp_tokenUnico_recuperacao' EXISTE
        // 3. E o campo 'exp_tokenUnico_recuperacao' é Menor ou Igual a data/hora atual (token expirou)
        const query = {
            '$or': [
                { 'senha': { '$exists': false } },
                { 'senha': null }
            ],
            'exp_tokenUnico_recuperacao': {
                '$exists': true, // Garante que um token foi gerado
                '$lte': agora     // Garante que o token está expirado
            }
        };

        // 3. Executar a deleção
        const result = await Usuario.deleteMany(query);

        if (result.deletedCount > 0) {
            logger.info(`[CRON] Limpeza concluída: ${result.deletedCount} usuários pendentes removidos.`);
        } else {
            logger.info('[CRON] Nenhum usuário pendente com token expirado encontrado.');
        }

    } catch (err) {
        logger.error('[CRON] Erro ao executar a limpeza de usuários pendentes:', err);
    } finally {
        // 4. Desconectar do banco
        if (DbConnect.desconectar) {
            await DbConnect.desconectar();
            logger.info('[CRON] Conexão com o MongoDB fechada.');
        }
    }
}

// --- Agendamento (Cron Job) ---

logger.info('[CRON] Configurando agendador de limpeza de usuários pendentes...');

// Expressão cron: '0 3 * * *' = "Às 03:00 (3 da manhã), todos os dias"
// '0 * * * *' = A cada hora
// Para TESTAR a cada minuto, mude a string para: '* * * * *'

const job = cron.schedule(
    '0 * * * *',                   // Agendamento (a cada hora)
    executarLimpezaUsuariosPendentes, // Função a ser executada
    {
        scheduled: true,              // Inicia automaticamente
        timezone: 'America/Manaus'   // Fuso horário
    }
);

logger.info('[CRON] Agendador "Limpar Usuários Pendentes" iniciado. Executará a cada hora.');

// Listeners para parar o job elegantemente (se rodado via 'node')
process.on('SIGINT', () => {
    logger.info('[CRON] Parando agendador (SIGINT)...');
    job.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('[CRON] Parando agendador (SIGTERM)...');
    job.stop();
    process.exit(0);
});