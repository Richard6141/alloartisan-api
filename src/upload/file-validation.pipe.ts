import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
    maxSize?: number; // en bytes
    allowedMimeTypes?: string[];
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
    private readonly maxSize: number;
    private readonly allowedMimeTypes: string[];

    constructor(options: FileValidationOptions = {}) {
        this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB par défaut
        this.allowedMimeTypes = options.allowedMimeTypes || [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
        ];
    }

    transform(file: Express.Multer.File): Express.Multer.File {
        if (!file) {
            throw new BadRequestException('Aucun fichier fourni');
        }

        if (file.size > this.maxSize) {
            const maxSizeMB = Math.round(this.maxSize / (1024 * 1024));
            throw new BadRequestException(
                `La taille du fichier dépasse la limite autorisée de ${maxSizeMB}MB`,
            );
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Type de fichier non autorisé. Types acceptés: ${this.allowedMimeTypes.join(', ')}`,
            );
        }

        return file;
    }
}

export const ImageValidationPipe = new FileValidationPipe({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
});
