import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity("voice_activity")
export class VoiceActivityEntity {
    @PrimaryGeneratedColumn()
    _id: number;

    @Column({ name: "guild_id", type: 'bigint' })
    guildId: string;

    @Column({ name: "user_id", type: 'bigint' })
    userId: string;

    @Column({ name: "user_name", type: 'varchar' })
    userName: string;

    @Column({ name: "seconds", type: 'int' })
    seconds: number;
}