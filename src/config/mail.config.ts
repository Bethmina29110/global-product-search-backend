import { registerAs } from '@nestjs/config';

/**
 * Mail configuration interface.
 * 
 * Defines the structure of SMTP email service configuration settings.
 */
export interface MailConfig {
  /** SMTP server hostname (optional) */
  mailHost?: string;
  /** SMTP server port (default: 587) */
  mailPort: number;
  /** SMTP username (optional) */
  mailUser?: string;
  /** SMTP password (optional) */
  mailPassword?: string;
  /** Email sender address (default: 'noreply@example.com') */
  mailFrom: string;
  /** Email sender name (default: 'Support') */
  mailFromName: string;
}

/**
 * Mail/SMTP configuration factory.
 * 
 * Provides email service configuration including SMTP server settings
 * and sender information. Used by @nestjs-modules/mailer.
 * 
 * **Environment Variables:**
 * - `MAIL_HOST`: SMTP server hostname (optional)
 * - `MAIL_PORT`: SMTP server port (default: 587)
 * - `MAIL_USERNAME`: SMTP username (optional)
 * - `MAIL_PASSWORD`: SMTP password (optional)
 * - `MAIL_FROM_ADDRESS`: Sender email address (default: 'noreply@example.com')
 * - `MAIL_FROM_NAME`: Sender display name (default: 'Support')
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [mailConfig],
 * })
 * 
 * // In MailModule
 * MailerModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     transport: {
 *       host: config.get<string>('mail.mailHost'),
 *       port: config.get<number>('mail.mailPort'),
 *       auth: {
 *         user: config.get<string>('mail.mailUser'),
 *         pass: config.get<string>('mail.mailPassword'),
 *       },
 *     },
 *     defaults: {
 *       from: `"${config.get<string>('mail.mailFromName')}" <${config.get<string>('mail.mailFrom')}>`,
 *     },
 *   }),
 * })
 * ```
 * 
 * @returns Mail configuration object
 */
export default registerAs('mail', (): MailConfig => ({
  mailHost: process.env.MAIL_HOST,
  mailPort: parseInt(process.env.MAIL_PORT ?? '587', 10) || 587,
  mailUser: process.env.MAIL_USERNAME,
  mailPassword: process.env.MAIL_PASSWORD,
  mailFrom: process.env.MAIL_FROM_ADDRESS ?? 'noreply@example.com',
  mailFromName: process.env.MAIL_FROM_NAME ?? 'Support',
}));