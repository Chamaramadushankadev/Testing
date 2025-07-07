import nodemailer from 'nodemailer';

export const verifySMTP = async (smtpSettings) => {
  const isSecurePort = smtpSettings.port === 465;

  const transporter = nodemailer.createTransport({
    host: smtpSettings.host || 'mail.privateemail.com',
    port: smtpSettings.port || 587,
    secure: isSecurePort,
    auth: {
      user: smtpSettings.username,
      pass: smtpSettings.password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

try {
  await transporter.verify();
  console.log('✅ SMTP credentials verified successfully.');
  return {
    success: true,
    message: 'SMTP credentials verified successfully.'
  };
} catch (error) {
  console.error('❌ SMTP verification failed:', error);
  return {
    success: false,
    message: error.message
  };
}
};
