/**
 * Cadastra um hospital novo e o primeiro administrador dele.
 *
 *   npm run hospital:create -- --code hsl --name "Hospital Sao Lucas" \
 *     --admin-email ti@hsl.com.br --admin-name "Fulana de Tal"
 *
 * A senha do admin vem de HOSPITAL_ADMIN_PASSWORD (nunca pela linha de
 * comando, que fica no historico do terminal) e segue a regra de senha forte.
 * Depois disso, o admin entra no painel e cadastra a propria equipe — que so
 * enxerga este hospital. O mapa (areas, setores, destinos, beacons) do
 * hospital novo e cadastrado a parte; o app desse hospital manda
 * EXPO_PUBLIC_HOSPITAL_CODE com o mesmo codigo.
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { isStrongPassword } from '../src/common/strong-password';

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

async function main() {
  const code = arg('code')?.toLowerCase();
  const name = arg('name');
  const adminEmail = arg('admin-email')?.toLowerCase();
  const adminName = arg('admin-name');
  const password = process.env.HOSPITAL_ADMIN_PASSWORD ?? '';

  if (!code || !/^[a-z0-9-]{1,40}$/.test(code)) throw new Error('--code obrigatorio (letras minusculas, numeros e hifen)');
  if (!name) throw new Error('--name obrigatorio');
  if (!adminEmail || !adminName) throw new Error('--admin-email e --admin-name obrigatorios');
  if (!isStrongPassword(password)) {
    throw new Error('Defina HOSPITAL_ADMIN_PASSWORD com senha forte (8+, letra, numero, simbolo, sem espaco)');
  }

  const prisma = new PrismaClient();
  try {
    if (await prisma.hospital.findUnique({ where: { code } })) throw new Error(`Ja existe hospital com o codigo ${code}`);
    if (await prisma.user.findUnique({ where: { email: adminEmail } })) throw new Error(`Ja existe conta com o e-mail ${adminEmail}`);

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({ data: { code, name } });
      const admin = await tx.user.create({
        data: { email: adminEmail, name: adminName, passwordHash, role: UserRole.ADMIN, hospitalId: hospital.id, active: true },
      });
      await tx.staffProfile.create({ data: { userId: admin.id, jobTitle: 'Administrador', active: true } });
      return { hospital, admin };
    });

    console.log(`Hospital criado: #${result.hospital.id} ${result.hospital.code} (${result.hospital.name})`);
    console.log(`Admin: ${result.admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
