import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// nodemailer 10 nao traz tipos proprios; so usamos createTransport/sendMail.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodemailer = require('nodemailer') as {
  createTransport(options: Record<string, unknown>): {
    sendMail(message: { from: string; to: string; subject: string; text: string; html: string }): Promise<unknown>;
  };
};

// Envio de e-mail por SMTP (ex.: Gmail com "senha de app", Outlook, provedor
// do hospital). Variaveis: SMTP_HOST, SMTP_PORT (587 ou 465), SMTP_USER,
// SMTP_PASS e MAIL_FROM. Sem elas o envio fica desligado e o app avisa o
// paciente — nunca finge que mandou.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(this.config.get<string>('SMTP_HOST') && this.config.get<string>('MAIL_FROM'));
  }

  async send(to: string, subject: string, text: string, html: string) {
    if (!this.isConfigured()) return false;
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const user = this.config.get<string>('SMTP_USER');
    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: user ? { user, pass: this.config.get<string>('SMTP_PASS') } : undefined,
    });
    try {
      await transporter.sendMail({ from: this.config.get<string>('MAIL_FROM') as string, to, subject, text, html });
      return true;
    } catch (error) {
      // Sem o endereco no log (dado pessoal); so o motivo.
      this.logger.error(`Falha ao enviar e-mail: ${(error as Error)?.message ?? 'erro desconhecido'}`);
      return false;
    }
  }
}
