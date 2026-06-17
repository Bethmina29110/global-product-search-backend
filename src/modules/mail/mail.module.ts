import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import mailConfig from '../../config/mail.config';
import * as path from 'path';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('mail.mailHost'),
          port: config.get('mail.mailPort'),
          secure: false, // 587 -> false
          auth: {
            user: config.get('mail.mailUser'),
            pass: config.get('mail.mailPassword'),
          },
        },
        defaults: {
          from: `"${config.get('mail.mailFromName')}" <${config.get('mail.mailFrom')}>`,
        },
        template: {

          dir: path.join(process.cwd(), 'src/modules/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}