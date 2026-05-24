import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { QueryBudgetDto } from './query-budget.dto';

describe('QueryBudgetDto', () => {
  it('keeps isActive undefined when the query parameter is omitted', () => {
    const dto = plainToInstance(QueryBudgetDto, {});

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.isActive).toBeUndefined();
  });

  it('parses explicit false values without treating omission as false', () => {
    const dto = plainToInstance(QueryBudgetDto, { isActive: 'false' });

    expect(validateSync(dto)).toHaveLength(0);
    expect(dto.isActive).toBe(false);
  });
});
