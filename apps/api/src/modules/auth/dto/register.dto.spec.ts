import { validate } from 'class-validator';

import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should fail invalid email', async () => {
    const dto = new RegisterDto();

    dto.email = 'bad-email';

    dto.password = '123456';

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
