import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { MessageType } from "@prisma/client";

export class CreateMessageDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    imageBase64?: string;

    @IsOptional()
    @IsString()
    mediaUrl?: string;

    @IsOptional()
    @IsString()
    fileName?: string;

    @IsOptional()
    @IsNumber()
    fileSize?: number;

    @IsOptional()
    @IsString()
    mimeType?: string;

    @IsOptional()
    @IsEnum(MessageType)
    type?: MessageType;
}
