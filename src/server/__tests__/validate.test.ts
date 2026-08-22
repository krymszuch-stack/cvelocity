import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';

function fakeResponse() {
  const res = {
    statusCode: 0,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.payload = body;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; payload: any };
}

const schema = z.object({ name: z.string().trim().min(1).max(10) });

describe('validateBody', () => {
  it('podmienia ciało żądania na wartość po parsowaniu', () => {
    // Trasa dostaje dane już przycięte, więc nie musi tego robić sama —
    // i nie może o tym zapomnieć.
    const req = { body: { name: '  Jan  ' } } as Request;
    const res = fakeResponse();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'Jan' });
  });

  it('odrzuca niepoprawne ciało kodem 400 i nie woła trasy', () => {
    const req = { body: { name: '' } } as Request;
    const res = fakeResponse();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.payload.success).toBe(false);
  });

  it('nie wpuszcza pól spoza schematu', () => {
    // Bez tego pole `role: "admin"` doleciałoby do zapytania do bazy.
    const req = { body: { name: 'Jan', role: 'admin' } } as Request;
    const res = fakeResponse();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(req.body).toEqual({ name: 'Jan' });
    expect(req.body).not.toHaveProperty('role');
  });

  it('opisuje w komunikacie, które pole jest nie tak', () => {
    const req = { body: { name: 'x'.repeat(50) } } as Request;
    const res = fakeResponse();

    validateBody(schema)(req, res, vi.fn());

    expect(res.payload.error).toContain('name');
  });
});
