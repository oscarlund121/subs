import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from './create-subscription.dto.js';

/** Every field optional — send only what changed. */
export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}
