import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  track(
    @Body() dto: TrackEventDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.analytics.track(dto, userAgent);
  }
}
