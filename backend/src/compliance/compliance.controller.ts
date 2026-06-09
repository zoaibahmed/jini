import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { CreateComplianceDto } from './dto/create-compliance.dto';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  async create(@Body() dto: CreateComplianceDto) {
    return this.complianceService.createCompliance(dto);
  }

  @Get('ocr/:id')
  async getOcrResult(@Param('id') id: string) {
    return this.complianceService.getOcrResult(id);
  }
}
