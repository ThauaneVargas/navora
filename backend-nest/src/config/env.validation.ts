// Confere as variáveis de ambiente na hora em que o servidor sobe.
//
// Em produção (NODE_ENV=production) o servidor NÃO sobe se faltar uma chave
// obrigatória ou se o JWT_SECRET for fraco/de exemplo: melhor o deploy falhar
// no Render (e o serviço antigo continuar no ar) do que subir aceitando tokens
// assinados com uma chave que está no GitHub. Fora de produção só avisa, para
// não atrapalhar o desenvolvimento local.
//
// Os valores nunca aparecem nas mensagens — só o NOME da variável.

const MIN_JWT_SECRET_LENGTH = 32;

// Valores que já apareceram em arquivos do repositório (públicos).
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'replace-with-a-long-random-secret-for-local-development',
  '<STAGING_JWT_SECRET>',
  'secret',
  'changeme',
  'navora',
]);

export type EnvConfig = Record<string, unknown>;

export function findEnvProblems(env: EnvConfig): string[] {
  const problems: string[] = [];
  const read = (key: string) => {
    const value = env[key];
    return typeof value === 'string' ? value.trim() : '';
  };

  if (!read('DATABASE_URL')) {
    problems.push('DATABASE_URL não configurada.');
  }

  const jwtSecret = read('JWT_SECRET');
  if (!jwtSecret) {
    problems.push('JWT_SECRET não configurado.');
  } else if (KNOWN_PLACEHOLDER_SECRETS.has(jwtSecret)) {
    problems.push('JWT_SECRET está com o valor de exemplo do repositório — gere um novo.');
  } else if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    problems.push(`JWT_SECRET muito curto (mínimo ${MIN_JWT_SECRET_LENGTH} caracteres).`);
  }

  if (!read('CORS_ORIGINS')) {
    problems.push('CORS_ORIGINS não configurado (precisa ter o domínio do painel).');
  }

  // SMTP: se o usuário foi informado, a senha também precisa estar.
  if (read('SMTP_USER') && !read('SMTP_PASS')) {
    problems.push('SMTP_USER configurado sem SMTP_PASS.');
  }

  return problems;
}

export function validateEnv(env: EnvConfig): EnvConfig {
  const problems = findEnvProblems(env);
  if (problems.length === 0) return env;

  const isProduction = env.NODE_ENV === 'production';
  const message = `Configuração de ambiente:\n- ${problems.join('\n- ')}`;

  if (isProduction) {
    throw new Error(`${message}\nO servidor não vai subir em produção assim. Ajuste as variáveis no painel do Render.`);
  }

  console.warn(`[navora] Aviso (desenvolvimento). ${message}`);
  return env;
}
