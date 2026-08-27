import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'info@safedsheri.com',
        pass: process.env.SMTP_PASS || 'SafedSheri@2026###',
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP Connection Error: ' + error.message);
      } else {
        this.logger.log('SMTP Connection Ready (info@safedsheri.com)');
      }
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    if (!to) return;
    try {
      const info = await this.transporter.sendMail({
        from: '"Safed Sheri Registration" <info@safedsheri.com>',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendRegistrationSubmitted(email: string, registrationNumber: string) {
    const subject = `Application Received: ${registrationNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EAD9B8; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2D1F0E; padding: 20px; text-align: center;">
          <h1 style="color: #D99427; margin: 0; font-size: 24px;">Safed Sheri 2026</h1>
        </div>
        <div style="padding: 20px; background-color: #FAFAFA; color: #2D1F0E;">
          <h2 style="margin-top: 0;">Application Received</h2>
          <p>Thank you for submitting your entry application for Safed Sheri 2026!</p>
          <p>Your Application ID is: <strong>${registrationNumber}</strong></p>
          <p>Our executive team is currently reviewing your application. You will receive another email within 24-48 hours once your application is approved.</p>
          <p>Please note that submission of this application does not guarantee entry. Passes will be issued upon successful review and payment.</p>
        </div>
        <div style="background-color: #2D1F0E; color: white; padding: 10px; text-align: center; font-size: 12px;">
          &copy; 2026 Safed Sheri. All Rights Reserved.
        </div>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendRegistrationApproved(email: string, registrationNumber: string, paymentLink: string) {
    const subject = `Application Approved - Payment Required: ${registrationNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EAD9B8; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2D1F0E; padding: 20px; text-align: center;">
          <h1 style="color: #D99427; margin: 0; font-size: 24px;">Safed Sheri 2026</h1>
        </div>
        <div style="padding: 20px; background-color: #FAFAFA; color: #2D1F0E;">
          <h2 style="margin-top: 0; color: #278A22;">Application Approved!</h2>
          <p>Congratulations! Your application <strong>${registrationNumber}</strong> for Safed Sheri 2026 has been approved by our executive team.</p>
          <p>To finalize your registration and receive your digital passes, please complete your payment using the secure link below.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="background-color: #D99427; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Pay Now to Issue Passes</a>
          </div>
          <p style="font-size: 13px; color: #666;">This link is unique to your application. Do not share it with others. The payment must be completed before the current pricing phase expires.</p>
        </div>
        <div style="background-color: #2D1F0E; color: white; padding: 10px; text-align: center; font-size: 12px;">
          &copy; 2026 Safed Sheri. All Rights Reserved.
        </div>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendPaymentSuccess(email: string, registrationNumber: string, receiptNumber: string) {
    const subject = `Payment Successful - Passes Issued: ${registrationNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EAD9B8; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2D1F0E; padding: 20px; text-align: center;">
          <h1 style="color: #D99427; margin: 0; font-size: 24px;">Safed Sheri 2026</h1>
        </div>
        <div style="padding: 20px; background-color: #FAFAFA; color: #2D1F0E;">
          <h2 style="margin-top: 0; color: #278A22;">Payment Confirmed</h2>
          <p>We have successfully received your payment (Receipt: <strong>${receiptNumber}</strong>) for application <strong>${registrationNumber}</strong>.</p>
          <p>Your digital entry passes have been securely minted. Please view your pass at <a href="https://safedsheri.com/#passes" style="color: #D99427; font-weight: bold; text-decoration: underline;">https://safedsheri.com/#passes</a></p>
          <p>You will also receive your passes via WhatsApp shortly.</p>
          <p>Please keep your digital passes secure and bring them to the gate on the day of the event along with your original Aadhaar ID.</p>
        </div>
        <div style="background-color: #2D1F0E; color: white; padding: 10px; text-align: center; font-size: 12px;">
          &copy; 2026 Safed Sheri. All Rights Reserved.
        </div>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }
}
