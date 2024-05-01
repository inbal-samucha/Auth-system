import { InferAttributes, InferCreationAttributes } from "sequelize";
import {  AutoIncrement, Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";


@Table({ timestamps: true, underscored: true})
export class Metadata extends Model<InferAttributes<Metadata>, InferCreationAttributes<Metadata>> {
  @AutoIncrement
  @PrimaryKey
  @Column ({ type: DataType.NUMBER})
  id!: number | null;

  @Column ({ type: DataType.STRING })
  key!: string;

  @Column ({ type: DataType.STRING || DataType.NUMBER})
  value!: string;

}

