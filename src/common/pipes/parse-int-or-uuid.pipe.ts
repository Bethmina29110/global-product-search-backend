import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { isUuid } from '../utils/uuid.util';

/**
 * Pipe that validates a parameter as either:
 * - a positive integer ID (e.g. "1"), OR
 * - a UUID (8-4-4-4-12 hex)
 *
 * Returns the trimmed string value (keeps numeric IDs and UUIDs as strings).
 */
@Injectable()
export class ParseIntOrUuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    const paramName = metadata.data || metadata.type || 'parameter';

    if (typeof value !== 'string') {
      throw new BadRequestException(
        `Invalid ${paramName}: "${value}" is not a valid string.`,
      );
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException(
        `Invalid ${paramName}: value is required.`,
      );
    }

    // Positive integer ID
    if (/^\d+$/.test(trimmed)) {
      const asNumber = Number(trimmed);
      if (!Number.isSafeInteger(asNumber) || asNumber <= 0) {
        throw new BadRequestException(
          `Invalid ${paramName}: "${value}" must be a positive integer ID.`,
        );
      }
      return trimmed;
    }

    // UUID
    if (isUuid(trimmed)) {
      return trimmed;
    }

    throw new BadRequestException(
      `Invalid ${paramName}: "${value}" must be a numeric ID or UUID.`,
    );
  }
}

