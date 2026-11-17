import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { DATABASE_UNAVAILABLE_BODY, DatabaseUnavailableFilter, isDatabaseUnavailable } from './database-unavailable.filter';

function prismaError(name: string, code?: string, message = 'falha') {
  const error = new Error(message) as Error & { code?: string };
  error.name = name;
  if (code) error.code = code;
  return error;
}

function run() {
  // Banco fora / lento / pool cheio -> 503.
  assert.ok(isDatabaseUnavailable(prismaError('PrismaClientInitializationError')));
  for (const code of ['P1001', 'P1002', 'P1008', 'P1017', 'P2024']) {
    assert.ok(isDatabaseUnavailable(prismaError('PrismaClientKnownRequestError', code)), code);
  }
  assert.ok(isDatabaseUnavailable(prismaError('PrismaClientUnknownRequestError', undefined, "Can't reach database server")));

  // Erro de dado (ex.: e-mail duplicado P2002, registro inexistente P2025) NÃO é queda.
  assert.ok(!isDatabaseUnavailable(prismaError('PrismaClientKnownRequestError', 'P2002')));
  assert.ok(!isDatabaseUnavailable(prismaError('PrismaClientKnownRequestError', 'P2025')));
  assert.ok(!isDatabaseUnavailable(new BadRequestException('x')));
  assert.ok(!isDatabaseUnavailable(new Error('qualquer')));
  assert.ok(!isDatabaseUnavailable(undefined));

  // Resposta 503 com mensagem amigável e Retry-After; sem detalhes internos.
  const sent: { status?: number; headers: Record<string, string>; body?: unknown } = { headers: {} };
  const response = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    set(key: string, value: string) {
      sent.headers[key] = value;
      return this;
    },
    json(body: unknown) {
      sent.body = body;
      return this;
    },
  };
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as any;
  const filter = new DatabaseUnavailableFilter({} as any);
  const originalError = console.error;
  const logged: string[] = [];
  (filter as any).logger = { error: (msg: string) => logged.push(msg) };
  try {
    filter.catch(prismaError('PrismaClientKnownRequestError', 'P1001', 'senha=segredo host=db'), host);
  } finally {
    console.error = originalError;
  }
  assert.equal(sent.status, 503);
  assert.equal(sent.headers['Retry-After'], '5');
  assert.deepEqual(sent.body, DATABASE_UNAVAILABLE_BODY);
  assert.ok(!JSON.stringify(sent.body).includes('segredo'), 'detalhe do erro não vai para o cliente');
  assert.ok(logged.length === 1 && !logged[0].includes('segredo'), 'detalhe do erro não vai para o log');

  console.log('database unavailable filter tests passed');
}

run();
