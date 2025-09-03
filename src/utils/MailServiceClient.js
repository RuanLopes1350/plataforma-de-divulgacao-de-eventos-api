// src/utils/MailServiceClient.js

import { CustomError, HttpStatusCodes } from './helpers/index.js';

/**
 * Cliente para comunicação com o microserviço de email
 */
class MailServiceClient {
    constructor() {
        this.baseURL = process.env.MAIL_API_URL;
        this.apiKey = process.env.MAIL_API_KEY;
        this.timeout = parseInt(process.env.MAIL_API_TIMEOUT) || 30000;
    }

    /**
     * Envia um email usando o microserviço
     * @param {Object} emailData - Dados do email
     * @param {string} emailData.to - Email do destinatário
     * @param {string} emailData.subject - Assunto do email
     * @param {string} emailData.template - Nome do template MJML
     * @param {Object} emailData.data - Dados para o template
     * @returns {Promise<Object>} Resposta do microserviço
     */
    async sendEmail(emailData) {
        console.log('Enviando e-mail via microserviço para:', emailData.to);
        
        // Verificar se o serviço está desabilitado
        if (process.env.DISABLED_EMAIL === 'true') {
            console.log('Serviço de email está desabilitado');
            return { message: 'Email service disabled' };
        }

        // Validar configurações
        if (!this.baseURL || !this.apiKey) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                field: 'Configuração',
                details: [],
                customMessage: 'Microserviço de email não configurado corretamente.'
            });
        }

        // Implementar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(`${this.baseURL}/emails/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify(emailData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const responseData = await response.json();
            console.log('E-mail enviado com sucesso:', responseData);
            return responseData;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Erro ao enviar e-mail:', error);
            
            if (error.name === 'AbortError') {
                throw new CustomError({
                    statusCode: HttpStatusCodes.REQUEST_TIMEOUT.code,
                    field: 'E-mail',
                    details: [],
                    customMessage: 'Timeout: Serviço de e-mail não respondeu em tempo hábil.'
                });
            }
            
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                field: 'E-mail',
                details: [],
                customMessage: `Erro ao enviar e-mail: ${error.message}`
            });
        }
    }

    /**
     * Envia email de recuperação de senha
     * @param {string} to - Email do destinatário
     * @param {string} userName - Nome do usuário
     * @param {string} resetUrl - URL de reset
     * @param {number} expirationMinutes - Minutos para expiração
     * @returns {Promise<Object>} Resposta do microserviço
     */
    async sendPasswordReset(to, userName, resetUrl, expirationMinutes = 60) {
        return this.sendEmail({
            to,
            subject: 'Redefinir senha',
            template: 'password-reset',
            data: {
                name: userName,
                resetUrl,
                expirationMinutes,
                year: new Date().getFullYear(),
                company: process.env.COMPANY_NAME || 'Plataforma de Eventos'
            }
        });
    }

    /**
     * Envia email de boas-vindas
     * @param {string} to - Email do destinatário
     * @param {string} userName - Nome do usuário
     * @param {string} loginUrl - URL de login
     * @returns {Promise<Object>} Resposta do microserviço
     */
    async sendWelcome(to, userName, loginUrl) {
        return this.sendEmail({
            to,
            subject: 'Bem-vindo!',
            template: 'welcome',
            data: {
                name: userName,
                loginUrl,
                year: new Date().getFullYear(),
                company: process.env.COMPANY_NAME || 'Plataforma de Eventos'
            }
        });
    }
}

export default new MailServiceClient();
