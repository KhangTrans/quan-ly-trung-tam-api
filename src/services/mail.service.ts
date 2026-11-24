import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env';

export interface SendOtpEmailParams {
  to: string;
  name?: string;
  otp: string;
  expiresInMinutes: number;
}

export class MailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    if (ENV.SMTP_USER && ENV.SMTP_PASS) {
      const isGmail = (ENV.SMTP_HOST || '').toLowerCase().includes('gmail');
      const transportConfig: any = isGmail
        ? {
            service: 'gmail',
            auth: {
              user: ENV.SMTP_USER,
              pass: ENV.SMTP_PASS.replace(/\s+/g, ''),
            },
          }
        : {
            host: ENV.SMTP_HOST,
            port: ENV.SMTP_PORT,
            secure: ENV.SMTP_SECURE,
            auth: {
              user: ENV.SMTP_USER,
              pass: ENV.SMTP_PASS.replace(/\s+/g, ''),
            },
          };

      this.transporter = nodemailer.createTransport(transportConfig);
      return this.transporter;
    }

    return null;
  }

  /**
   * Gửi email chứa mã OTP xác thực
   */
  static async sendOtpEmail({
    to,
    name,
    otp,
    expiresInMinutes,
  }: SendOtpEmailParams): Promise<{ success: boolean; sentViaSmtp: boolean }> {
    const transporter = this.getTransporter();
    const senderName = ENV.MAIL_SENDER_NAME; // "Minh Tu"
    const fromAddress = `"${senderName}" <${ENV.SMTP_USER || ENV.MAIL_SENDER_EMAIL}>`;

    const subject = `[Minh Tu] Mã xác thực đăng ký tài khoản: ${otp}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: #ffffff; padding: 24px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 24px; color: #2d3748; line-height: 1.6; }
          .otp-box { background-color: #fff5f5; border: 2px dashed #e53e3e; border-radius: 10px; text-align: center; padding: 18px; margin: 24px 0; }
          .otp-code { font-size: 34px; font-weight: 800; color: #c53030; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; }
          .expiry-warning { font-size: 13px; color: #718096; margin-top: 8px; }
          .footer { background: #f7fafc; padding: 16px 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MINH TU CENTER</h1>
            <p>Trung Tâm Nhật Ngữ Minh Tú</p>
          </div>
          <div class="content">
            <p>Xin chào <strong>${name || 'Quý học viên'}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của <strong>Minh Tu Center</strong>. Dưới đây là mã OTP dùng để xác thực địa chỉ email của bạn:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry-warning">⏰ Mã xác thực có hiệu lực trong vòng <strong>${expiresInMinutes} phút</strong>.</div>
            </div>

            <p>Vui lòng nhập mã này vào trang xác thực để hoàn tất quá trình đăng ký.</p>
            <p style="font-size: 13px; color: #e53e3e; margin-top: 20px;">
              ⚠️ <em>Lưu ý: Tuyệt đối không chia sẻ mã này cho bất kỳ ai để bảo vệ tài khoản của bạn.</em>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Minh Tu Center. Mọi quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html: htmlContent,
        });
        console.log(`✉️ [MailService] Đã gửi mã OTP (${otp}) từ "${senderName}" đến ${to}`);
        return { success: true, sentViaSmtp: true };
      } catch (error) {
        console.error('❌ [MailService] Lỗi khi gửi mail qua SMTP:', error);
      }
    }

    // Nếu chưa cấu hình SMTP, in mã OTP ra console để phục vụ phát triển/kiểm thử
    console.log(
      `📬 [MailService - ${senderName}] MÃ OTP GỬI TỚI [${to}]: ${otp} (Thời hạn: ${expiresInMinutes} phút)`
    );
    return { success: true, sentViaSmtp: false };
  }
}
