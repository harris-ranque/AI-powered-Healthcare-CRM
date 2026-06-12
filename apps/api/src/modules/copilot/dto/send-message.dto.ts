import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { MAX_USER_MESSAGE_LENGTH } from '../copilot.constants';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_USER_MESSAGE_LENGTH)
  content: string;
}
