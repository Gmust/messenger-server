import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SentResetUrlDto } from './dto/sentResetUrl.dto';

@Injectable()
export class EmailService {

  constructor(private readonly mailerService: MailerService) {

  }

  async sendEmail(sentResetUrlDto: SentResetUrlDto): Promise<void> {
    await this.mailerService.sendMail({
      to: sentResetUrlDto.emailTo,
      from: sentResetUrlDto.emailFrom,
      subject: sentResetUrlDto.subject,
      text: sentResetUrlDto.text,
      html: sentResetUrlDto.html
    });
  }

}
