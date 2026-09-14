import { Controller, Post } from '@nestjs/common';
import { EmailWatcherService } from './email-watcher.service.js';

@Controller('email')
export class EmailController {
  constructor(private readonly emailWatcher: EmailWatcherService) {}

  /** Manual "scan now" — returns what the scan found. */
  @Post('poll')
  poll() {
    return this.emailWatcher.poll();
  }
}
