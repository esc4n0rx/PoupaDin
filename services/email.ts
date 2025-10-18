/**
 * Email Service - Resend Integration
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface SendRecoveryEmailParams {
  to: string;
  code: string;
  userName: string;
}

export const EmailService = {
  /**
   * Enviar e-mail de recuperação de senha via Supabase Edge Function
   */
  sendRecoveryEmail: async ({ to, code, userName }: SendRecoveryEmailParams): Promise<boolean> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-recovery-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ to, code, userName }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error sending recovery email:', errorText);
        return false;
      }

      const result = await response.json();
      console.log('Recovery email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Error calling Edge Function:', error);
      return false;
    }
  },
};

/**
 * Template HTML do e-mail de recuperação
 */
function getRecoveryEmailTemplate(code: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - PoupaDin</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FEF3E2;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3E2; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 500px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background-color: #2D2D2D; padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold;">PoupaDin</h1>
                  <p style="margin: 8px 0 0; color: #FEF3E2; font-size: 14px;">Seu gerenciador financeiro pessoal</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 32px;">
                  <h2 style="margin: 0 0 16px; color: #1A1A1A; font-size: 24px; font-weight: 600;">Olá, ${userName}!</h2>
                  <p style="margin: 0 0 24px; color: #6B6B6B; font-size: 16px; line-height: 24px;">
                    Recebemos uma solicitação para recuperar a senha da sua conta. Use o código abaixo para continuar:
                  </p>
                  
                  <!-- Code Box -->
                  <div style="background-color: #FEF3E2; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
                    <p style="margin: 0 0 8px; color: #6B6B6B; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Código de Verificação</p>
                    <p style="margin: 0; color: #2D2D2D; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${code}</p>
                  </div>
                  
                  <p style="margin: 0 0 16px; color: #6B6B6B; font-size: 14px; line-height: 20px;">
                    ⏱️ Este código expira em <strong>10 minutos</strong>.
                  </p>
                  
                  <p style="margin: 0 0 24px; color: #6B6B6B; font-size: 14px; line-height: 20px;">
                    Se você não solicitou esta recuperação, ignore este e-mail. Sua senha permanecerá segura.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;">
                  
                  <p style="margin: 0; color: #9E9E9E; font-size: 12px; line-height: 18px;">
                    Precisa de ajuda? Entre em contato conosco em <a href="mailto:suporte@poupadin.com" style="color: #2D2D2D; text-decoration: none;">suporte@poupadin.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8F8F8; padding: 24px 32px; text-align: center; border-top: 1px solid #E0E0E0;">
                  <p style="margin: 0 0 8px; color: #9E9E9E; font-size: 12px;">
                    © ${new Date().getFullYear()} PoupaDin. Todos os direitos reservados.
                  </p>
                  <p style="margin: 0; color: #9E9E9E; font-size: 12px;">
                    Este é um e-mail automático. Por favor, não responda.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}