import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateComplianceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  driverId: string;

  // Additional fields can be added as needed
}
