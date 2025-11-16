import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { EntityModule } from './entity/entity.module';

@Module({
  imports: [EntityModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
