import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

// Senha forte — a MESMA regra do app (mobile/src/utils/masks.js, passwordRules):
// 8+ caracteres, com letra, numero e simbolo, e sem espaco.
// MaxLength 72: o bcrypt ignora o que passar disso.
const MESSAGE = 'A senha precisa ter pelo menos 8 caracteres, com letra, numero e simbolo, e sem espaco';

export function StrongPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8, { message: MESSAGE }),
    MaxLength(72, { message: 'A senha pode ter no maximo 72 caracteres' }),
    Matches(/[A-Za-z]/, { message: MESSAGE }),
    Matches(/\d/, { message: MESSAGE }),
    Matches(/[^A-Za-z0-9\s]/, { message: MESSAGE }),
    Matches(/^\S+$/, { message: MESSAGE }),
  );
}
