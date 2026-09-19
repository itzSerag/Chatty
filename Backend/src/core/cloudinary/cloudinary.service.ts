import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {

    async uploadProfileImg(userId: string, base64Img: string): Promise<string> {
        const res = await cloudinary.uploader.upload(base64Img, {
            folder: 'Profile-Img',
            resource_type: 'image',
            overwrite: true,
            public_id: `${userId}_profileImg`
        });

        return res.secure_url;
    }

    async uploadChatImg(base64Img: string, senderId: string, receiverId: string): Promise<string | null> {
        if (!base64Img) return null;

        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const res = await cloudinary.uploader.upload(base64Img, {
            folder: 'Chat-Img',
            resource_type: 'image',
            public_id: `${senderId}_chat_${uniqueSuffix}`,
            fetch_format: 'auto',
            quality: 'auto',
        });

        return res.secure_url;
    }
}