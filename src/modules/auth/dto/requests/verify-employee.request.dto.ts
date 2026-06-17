import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Request DTO for employee verify endpoint.
 * Extend with fields as needed when implementing verification logic.
 */
export class VerifyEmployeeRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  employeeId?: string;
}
