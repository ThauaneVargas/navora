import * as assert from 'node:assert/strict';
import { findEnvProblems, validateEnv } from './env.validation';

const strongSecret = 'k3J9x!vQ2mZ8pL0rT6wY4uB1nC7sD5fG-extra';
const valid = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@host/db',
  JWT_SECRET: strongSecret,
  CORS_ORIGINS: 'https://navora-nine.vercel.app',
};

function run() {
  assert.deepEqual(findEnvProblems(valid), [], 'config completa não tem problema');
  assert.equal(validateEnv(valid), valid, 'config completa passa');

  // Produção: falta de chave derruba a subida.
  assert.throws(() => validateEnv({ ...valid, JWT_SECRET: '' }), /JWT_SECRET não configurado/);
  assert.throws(() => validateEnv({ ...valid, DATABASE_URL: undefined }), /DATABASE_URL/);
  assert.throws(() => validateEnv({ ...valid, CORS_ORIGINS: '  ' }), /CORS_ORIGINS/);

  // Segredo de exemplo (está no GitHub) ou curto não serve.
  assert.throws(
    () => validateEnv({ ...valid, JWT_SECRET: 'replace-with-a-long-random-secret-for-local-development' }),
    /valor de exemplo/,
  );
  assert.throws(() => validateEnv({ ...valid, JWT_SECRET: 'curto123' }), /muito curto/);

  // SMTP com usuário e sem senha.
  assert.throws(() => validateEnv({ ...valid, SMTP_USER: 'a@b.com' }), /SMTP_PASS/);

  // A mensagem de erro nunca mostra o valor do segredo.
  try {
    validateEnv({ ...valid, JWT_SECRET: 'curto123' });
  } catch (error) {
    assert.ok(!String((error as Error).message).includes('curto123'), 'valor do segredo não vaza');
  }

  // Desenvolvimento: só avisa, não derruba.
  const originalWarn = console.warn;
  let warned = false;
  console.warn = () => {
    warned = true;
  };
  try {
    const dev = { NODE_ENV: 'development' };
    assert.equal(validateEnv(dev), dev);
    assert.ok(warned, 'avisa no desenvolvimento');
  } finally {
    console.warn = originalWarn;
  }

  console.log('env validation tests passed');
}

run();
