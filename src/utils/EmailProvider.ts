import ejs from 'ejs';
import path from 'path';
import nodemailer, { SendMailOptions } from 'nodemailer';

interface EmailOptions {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean,
  auth: {
      user: string;
      pass: string;
  };
}

interface Attachment {
  filename: string;
  path?: string;      // Path is optional because you can also use content
  content?: Buffer | string;  // Content can be a Buffer or a string
  cid?: string;       // Content-ID for inline images
}

class EmailProvider {
  private transporter: any;

  constructor(private options: EmailOptions) {
      this.transporter = nodemailer.createTransport(options);
  }

  public async sendMail(mailOptions: SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
    } catch (err) {
      console.error('Error sending email:', err);
    }
}
  
}

const getEmailService = (): EmailProvider => {
  const emailProviders: { [key: string]: () => EmailProvider } = {
      gmail: () =>
          new EmailProvider({
              service: 'gmail',
              port: 587,
              secure: false, 
              auth: {
                  user: process.env.GOOGLE_USER!,
                  pass: process.env.GOOGLE_PASSWORD!,
              },
          })
  };

  const defaultEmailProvider = 'gmail';

  if (!emailProviders[defaultEmailProvider]) {
      throw new Error(
          `Invalid email provider '${defaultEmailProvider}'`
      );
  }

  return emailProviders[defaultEmailProvider]();
};

const sendMail = async (to: string, subject: string, template: string, data: object, attachments?: Attachment[]): Promise<void> => {
  try{
    const emailProvider = getEmailService();

    const templatePath = path.join(__dirname, `../views/${template}.ejs`);

    const ejsTemplate = await ejs.renderFile(templatePath, data, { async: true });

    const mailOptions = {
      from: 'inbalsam2014@gmail.com',
      to: to,
      subject: subject,
      html: ejsTemplate,
      attachments
    };

    await emailProvider.sendMail(mailOptions);

  } catch (err){
    console.log(err);
  }
}

export default sendMail;

    