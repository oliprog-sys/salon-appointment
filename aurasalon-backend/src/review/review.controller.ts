import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @CurrentUser('id') customerId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(customerId, dto);
  }

  @Get('salon/:salonId')
  async findReviewsBySalon(
    @Param('salonId') salonId: string,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewService.findReviewsBySalon(salonId, query);
  }

  @Get('salon/:salonId/metrics')
  async getSalonMetrics(@Param('salonId') salonId: string) {
    return this.reviewService.getSalonMetrics(salonId);
  }

  @Get('staff/:staffId')
  async findReviewsByStaff(
    @Param('staffId') staffId: string,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewService.findReviewsByStaff(staffId, query);
  }

  @Get('staff/:staffId/metrics')
  async getStaffMetrics(@Param('staffId') staffId: string) {
    return this.reviewService.getStaffMetrics(staffId);
  }

  @Get(':id')
  async findReviewById(@Param('id') id: string) {
    return this.reviewService.findReviewById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reviewService.deleteReview(id, user);
  }
}
