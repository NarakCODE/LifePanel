import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Validates that a route param is a valid MongoDB ObjectId.
 * Usage: @Param('id', ParseObjectIdPipe) id: Types.ObjectId
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<
  string,
  Types.ObjectId
> {
  transform(value: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ObjectId: ${value}`);
    }
    return new Types.ObjectId(value);
  }
}
