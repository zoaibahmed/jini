import { Controller, Post, Body, Headers } from '@nestjs/common';
import { CallbackService } from './callback.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Callback Requests')
@Controller('callback')
export class CallbackController {
  constructor(private readonly callbackService: CallbackService) {}

  @Post('request')
  @ApiOperation({ summary: 'Submit an outbound telephone callback request' })
  async requestCallback(
    @Headers('x-driver-id') driverIdHeader: string | undefined,
    @Body()
    body: {
      name: string;
      phone: string;
      email?: string;
      language?: string;
      notes?: string;
    },
  ) {
    return this.callbackService.requestCallback({
      ...body,
      driverId: driverIdHeader,
    });
  }
}
