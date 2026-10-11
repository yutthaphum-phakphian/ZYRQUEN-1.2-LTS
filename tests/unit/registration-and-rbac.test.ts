import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRegistrationInput,
  sessionService,
  DEFAULT_ROLE_PERMISSIONS,
  requireRole as sessionRequireRole,
} from '../../src/services/sessionService';
import { checkRole, requireRole } from '../../server';

test('Registration Input Validation & Password Complexity Matrix', async (t) => {
  const existingUsers = [
    { username: 'admin_sentinel', email: 'admin@zyrquen.court' },
    { username: 'operator_deca', email: 'deca@zyrquen.court' },
  ];

  await t.test('accepts valid registration input with compliant password', () => {
    const outcome = validateRegistrationInput(
      {
        username: 'new_operator',
        email: 'operator@zyrquen.court',
        password: 'ValidPassword123!',
      },
      existingUsers
    );

    assert.equal(outcome.valid, true);
    assert.equal(outcome.errors.length, 0);
  });

  await t.test('rejects duplicate username (case-insensitive)', () => {
    const outcome = validateRegistrationInput(
      {
        username: 'ADMIN_SENTINEL',
        email: 'different@zyrquen.court',
        password: 'ValidPassword123!',
      },
      existingUsers
    );

    assert.equal(outcome.valid, false);
    assert.ok(outcome.errors.some((e) => e.includes('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว')));
  });

  await t.test('rejects duplicate email (case-insensitive)', () => {
    const outcome = validateRegistrationInput(
      {
        username: 'brand_new_user',
        email: 'ADMIN@zyrquen.court',
        password: 'ValidPassword123!',
      },
      existingUsers
    );

    assert.equal(outcome.valid, false);
    assert.ok(outcome.errors.some((e) => e.includes('อีเมลนี้ถูกใช้งานแล้วในระบบ')));
  });

  await t.test('rejects missing or invalid username & email format', () => {
    const outcome = validateRegistrationInput(
      {
        username: 'a', // too short (< 3)
        email: 'invalid-email-string',
      },
      existingUsers
    );

    assert.equal(outcome.valid, false);
    assert.ok(outcome.errors.some((e) => e.includes('อย่างน้อย 3 ตัวอักษร')));
    assert.ok(outcome.errors.some((e) => e.includes('รูปแบบอีเมลไม่ถูกต้อง')));
  });

  await t.test('enforces password complexity rules', () => {
    // 1. Too short (< 8 chars)
    const resShort = validateRegistrationInput({
      username: 'user_01',
      email: 'user01@zyrquen.court',
      password: 'Pass1!',
    });
    assert.equal(resShort.valid, false);
    assert.ok(resShort.errors.some((e) => e.includes('อย่างน้อย 8 ตัวอักษร')));

    // 2. Missing uppercase
    const resNoUpper = validateRegistrationInput({
      username: 'user_01',
      email: 'user01@zyrquen.court',
      password: 'validpassword123!',
    });
    assert.equal(resNoUpper.valid, false);
    assert.ok(resNoUpper.errors.some((e) => e.includes('ตัวอักษรพิมพ์ใหญ่')));

    // 3. Missing lowercase
    const resNoLower = validateRegistrationInput({
      username: 'user_01',
      email: 'user01@zyrquen.court',
      password: 'VALIDPASSWORD123!',
    });
    assert.equal(resNoLower.valid, false);
    assert.ok(resNoLower.errors.some((e) => e.includes('ตัวอักษรพิมพ์เล็ก')));

    // 4. Missing number
    const resNoNum = validateRegistrationInput({
      username: 'user_01',
      email: 'user01@zyrquen.court',
      password: 'ValidPasswordSpecial!',
    });
    assert.equal(resNoNum.valid, false);
    assert.ok(resNoNum.errors.some((e) => e.includes('ตัวเลขอย่างน้อย 1 ตัว')));

    // 5. Missing special character
    const resNoSpecial = validateRegistrationInput({
      username: 'user_01',
      email: 'user01@zyrquen.court',
      password: 'ValidPassword123',
    });
    assert.equal(resNoSpecial.valid, false);
    assert.ok(resNoSpecial.errors.some((e) => e.includes('อักขระพิเศษ')));
  });
});

test('Server RBAC Middleware requireRole & checkRole Enforcement', async (t) => {
  const mockResponse = () => {
    const res: any = {
      statusCode: 200,
      jsonPayload: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.jsonPayload = data;
        return this;
      },
    };
    return res;
  };

  await t.test('checkRole evaluates permissions and session validity correctly', () => {
    assert.equal(checkRole(null, ['admin', 'owner']), false);
    assert.equal(
      checkRole({ role: 'user', status: 'ACTIVE' }, ['admin', 'owner']),
      false
    );
    assert.equal(
      checkRole({ role: 'admin', status: 'ACTIVE' }, ['admin', 'owner']),
      true
    );
    assert.equal(
      checkRole({ role: 'owner', status: 'ACTIVE' }, ['admin', 'owner']),
      true
    );
    assert.equal(
      checkRole({ role: 'admin', status: 'REVOKED' }, ['admin', 'owner']),
      false
    );
    assert.equal(
      checkRole(
        {
          role: 'admin',
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        },
        ['admin', 'owner']
      ),
      false
    );
  });

  await t.test('requireRole rejects unauthenticated request with 401', () => {
    const middleware = requireRole(['owner', 'admin']);
    const req: any = {};
    const res = mockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonPayload.error, 'AUTHENTICATION_REQUIRED');
  });

  await t.test('requireRole explicitly blocks user role with 403', () => {
    const middleware = requireRole(['owner', 'admin']);
    const req: any = {
      user: { id: 'usr_reg_01', username: 'standard_user', role: 'user' },
    };
    const res = mockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    middleware(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonPayload.error, 'FORBIDDEN_ROLE');
    assert.ok(res.jsonPayload.message.includes('Caller role \'user\' is explicitly blocked'));
  });

  await t.test('requireRole authorizes admin and owner callers and attaches context', () => {
    const middleware = requireRole(['owner', 'admin']);
    const reqAdmin: any = {
      user: { id: 'usr_adm_01', username: 'sentinel_admin', role: 'admin' },
    };
    const res = mockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    middleware(reqAdmin, res, next);

    assert.equal(nextCalled, true);
    assert.ok(reqAdmin.session);
    assert.equal(reqAdmin.session.role, 'admin');
  });

  await t.test('sessionRequireRole from sessionService blocks user with 403', () => {
    const middleware = sessionRequireRole(['owner', 'admin']);
    const reqUser: any = {
      user: { id: 'usr_reg_02', username: 'user_02', role: 'user' },
    };
    const res = mockResponse();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    middleware(reqUser, res, next);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonPayload.error, 'FORBIDDEN_ROLE');
    assert.ok(res.jsonPayload.message.includes('Caller role \'user\' is explicitly blocked'));
  });
});
