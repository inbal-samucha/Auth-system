import bcrypt from 'bcryptjs';
import parsePhoneNumber  from 'libphonenumber-js';
import { InferAttributes, InferCreationAttributes } from "sequelize";
import { AllowNull, AutoIncrement, BeforeCreate, BeforeUpdate, Column, DataType, Index, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";
import BadRequestError from '../../errors/BadRequestError';


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

  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  firstName!: string | null ;

  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  lastName!: string | null;

  @Column ({ type: DataType.VIRTUAL})
  get fullName(): string | null {
    return this.getDataValue('firstName') + ' ' + this.getDataValue('lastName')
  }

  @Index
  @Unique
  @AllowNull(false)
  @Column ({ type: DataType.STRING}) //TODO: validate it is right syntax of email
  email!: string;

  @AllowNull(false)
  @Column ({ type: DataType.STRING})
  password!: string;

  @Column ({ type: DataType.STRING }) //TODO: change the phone to universal like +972 948484
  phone!: string | null;

  @AllowNull(false)
  @Column({ type: DataType.ENUM , values: Object.values(UserRole), defaultValue: UserRole.USER})
  role!: string | null;

  @Column ({ type: DataType.STRING })
  resetToken!: string | null;

  @Column ({ type: DataType.DATE })
  resetTokenExpiration!: Date | null;

  @Column({ type: DataType.ARRAY(DataType.TEXT)})
  refreshToken!: string[] | null;

  @Column ({ type: DataType.DATE })
  createdAt!: Date | null;

  @Column ({ type: DataType.DATE })
  updatedAt!: Date | null;

  @BeforeCreate({})
  static async hashPassword(instance: User){
    instance.password = await bcrypt.hash(instance.password, 12);
  }

  @BeforeUpdate({})
  static async formatPhone (instance: User){
    const updatedAttributes = instance.changed();

    if(updatedAttributes && Array.isArray(updatedAttributes) && updatedAttributes.includes('phone')){
      const phoneNumber = parsePhoneNumber(instance.phone!, 'IL');

      if(!phoneNumber){
        throw new BadRequestError({ code: 400, message: "Cannot update phone number", logging: true })
      }

      instance.phone = phoneNumber!.number;
    }
  }

  static async comparePasswords(password: string, hashedPassword: string){
    return await bcrypt.compare(password, hashedPassword);
  }
}

