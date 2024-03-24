import { AllowNull, AutoIncrement, Column, DataType, Index, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Table({ timestamps: true})
export class User extends Model<User> {
  @AutoIncrement
  @PrimaryKey
  @Column ({ type: DataType.NUMBER})
  id!: number;

  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  firstName!: string;

  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  lastName!: string;

  @Index
  @Unique
  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  email!: string;

  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  password!: string;

  @Column ({ type: DataType.STRING })
  phone!: string;

  @AllowNull(false)
  @Column({ type: DataType.ENUM , values: Object.values(UserRole), defaultValue: UserRole.USER})
  role!: string;

  @Column ({ type: DataType.STRING })
  resetToken!: string;

  @Column ({ type: DataType.DATE })
  resetTokenExpiration!: Date;

  @Column ({ type: DataType.DATE })
  createdAt!: Date;

  @Column ({ type: DataType.DATE })
  updatedAt!: Date;
}

