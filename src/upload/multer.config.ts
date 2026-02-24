import { Injectable, BadRequestException } from '@nestjs/common';
import { MulterModuleOptions, MulterOptionsFactory } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Configuration Multer pour stockage disque temporaire
 * Avantages:
 * - Pas de surcharge mémoire (fichiers sur disque)
 * - Possibilité de traitement asynchrone
 * - Nettoyage automatique possible
 */
@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
    private readonly uploadDir: string;
    private readonly maxFileSize: number;

    constructor(private configService: ConfigService) {
        this.uploadDir = this.configService.get<string>('UPLOAD_TEMP_DIR', './temp-uploads');
        this.maxFileSize = this.configService.get<number>('UPLOAD_MAX_SIZE', 10 * 1024 * 1024); // 10MB

        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    createMulterOptions(): MulterModuleOptions {
        return {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    cb(null, this.uploadDir);
                },
                filename: (req, file, cb) => {
                    // Nom unique pour éviter les collisions et attaques
                    const uniqueId = uuidv4();
                    const ext = path.extname(file.originalname).toLowerCase();
                    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.tmp';
                    cb(null, `${uniqueId}${safeExt}`);
                },
            }),
            limits: {
                fileSize: this.maxFileSize,
                files: 1, // Un seul fichier par requête
            },
            fileFilter: (req, file, cb) => {
                // Vérification préliminaire du MIME type
                const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

                if (!allowedMimes.includes(file.mimetype)) {
                    return cb(
                        new BadRequestException(
                            `Type de fichier non autorisé: ${file.mimetype}. Autorisés: JPEG, PNG, WebP`,
                        ),
                        false,
                    );
                }

                // Vérification de l'extension
                const ext = path.extname(file.originalname).toLowerCase();
                const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

                if (!allowedExts.includes(ext)) {
                    return cb(
                        new BadRequestException(
                            `Extension de fichier non autorisée: ${ext}. Autorisées: ${allowedExts.join(', ')}`,
                        ),
                        false,
                    );
                }

                cb(null, true);
            },
        };
    }
}

/**
 * Configuration Multer pour upload multiple (portfolio)
 */
export const multerPortfolioConfig = (configService: ConfigService): MulterModuleOptions => {
    const uploadDir = configService.get<string>('UPLOAD_TEMP_DIR', './temp-uploads');
    const maxFileSize = configService.get<number>('UPLOAD_MAX_SIZE', 10 * 1024 * 1024);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    return {
        storage: diskStorage({
            destination: uploadDir,
            filename: (req, file, cb) => {
                const uniqueId = uuidv4();
                const ext = path.extname(file.originalname).toLowerCase();
                const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.tmp';
                cb(null, `${uniqueId}${safeExt}`);
            },
        }),
        limits: {
            fileSize: maxFileSize,
            files: 10, // Max 10 fichiers pour portfolio
        },
        fileFilter: (req, file, cb) => {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedMimes.includes(file.mimetype)) {
                return cb(new BadRequestException(`Type non autorisé: ${file.mimetype}`), false);
            }
            cb(null, true);
        },
    };
};

/**
 * Configuration Multer pour les documents de certification
 * Accepte images (JPEG, PNG, WebP) ET PDF jusqu'à 10MB
 */
export const multerCertificationConfig: MulterModuleOptions = {
    storage: diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = './temp-uploads';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueId = uuidv4();
            const ext = path.extname(file.originalname).toLowerCase();
            const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
            const safeExt = allowedExts.includes(ext) ? ext : '.tmp';
            cb(null, `${uniqueId}${safeExt}`);
        },
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(
                new BadRequestException(
                    `Type de fichier non autorisé: ${file.mimetype}. Autorisés: JPEG, PNG, WebP, PDF`,
                ),
                false,
            );
        }
        cb(null, true);
    },
};
