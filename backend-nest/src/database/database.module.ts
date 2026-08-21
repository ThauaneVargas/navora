import { Module } from '@nestjs/common';
import { MemoryStoreService } from './memory-store.service';
import { PrismaService } from './prisma.service';

@Module({
  providers: [MemoryStoreService, PrismaService],
  exports: [MemoryStoreService, PrismaService],
})
export class DatabaseModule {}
