import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('interchanges')
export class Interchange{
  @PrimaryColumn()
  id!: number;

  @Column()
  invoice!: string;

  @Column()
  isImpreso!: boolean;

}