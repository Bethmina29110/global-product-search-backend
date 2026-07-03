import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetOtp(email: string, otp: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset OTP - Semantix',
        template: 'password-reset',
        context: {
          otp: otp,
          resetUrl: `http://localhost:5173/reset-password?email=${encodeURIComponent(email)}`,
        },
      });
      this.logger.log(`OTP Email successfully sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error);
      return false;
    }
  }

  /**
   * Sends email verification OTP to the given email.
   * No database save; used for public email verify flow.
   * @param email - Recipient email address
   * @param otp - 4-digit OTP code
   */
  async sendEmailVerifyOtp(email: string, otp: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Email Verification Code - Semantix',
        template: 'email-verify',
        context: { otp },
      });
      this.logger.log(`Email verification OTP sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email verification OTP to ${email}`, error);
      return false;
    }
  }

  /**
   * Sends a welcome email to the newly registered user.
   * @param email - Recipient email address
   * @param fullName - Registered user's full name for personalization
   */
  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Semantix',
        template: 'welcome',
        context: {
          fullName: fullName || 'there',
        },
      });
      this.logger.log(`Welcome email successfully sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      return false;
    }
  }
}

        