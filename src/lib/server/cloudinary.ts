// filepath: src/lib/server/cloudinary.ts
import {v2 as cloudinary} from 'cloudinary';
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET} from '$env/static/private';

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

export async function uploadImage(file: File): Promise<{ url: string, publicId: string } | null> {
    if (!file || file.size === 0) return null;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'proprios_plots' }, (error, result) => {
            if (error || !result) reject(error);
            else resolve({ url: result.secure_url, publicId: result.public_id });
        }).end(buffer);
    });
}

export { cloudinary };