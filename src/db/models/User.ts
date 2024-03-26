import { InferAttributes, InferCreationAttributes } from "sequelize";
import { AllowNull, AutoIncrement, Column, DataType, Index, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";


enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Table({ timestamps: true, underscored: true})
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @AutoIncrement
  @PrimaryKey
  @Column ({ type: DataType.NUMBER})
  id!: number | null;

  @Column ({ type: DataType.STRING})
  firstName!: string | null ;

  @Column ({ type: DataType.STRING})
  lastName!: string | null;

  @Index
  @Unique
  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  email!: string;

  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  password!: string;

  @Column ({ type: DataType.STRING })
  phone!: string | null;

  @AllowNull(false)
  @Column({ type: DataType.ENUM , values: Object.values(UserRole), defaultValue: UserRole.USER})
  role!: string | null;

  @Column ({ type: DataType.STRING })
  resetToken!: string | null;

  @Column ({ type: DataType.DATE })
  resetTokenExpiration!: Date | null;

  @Column ({ type: DataType.DATE })
  createdAt!: Date | null;

  @Column ({ type: DataType.DATE })
  updatedAt!: Date | null;
}

