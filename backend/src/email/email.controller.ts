import { Controller, Post } from '@nestjs/common';
import { EmailWatcherService } from './email-watcher.service.js';

@Controller('email')
export class EmailController {
  constructor(private readonly emailWatcher: EmailWatcherService) {}

  @Post('poll')
  async poll() {
    await this.emailWatcher.poll();
    return { polled: true };
  }
}
