import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UploadService } from './upload.service';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_FOLDERS = new Set(['chat', 'profils', 'portfolio']);

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Post('image')
    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_IMAGE_SIZE },
            // Filtre LOCAL explicite : ne pas dépendre du filtre global du module
            fileFilter: (_req, file, cb) => {
                if (file.mimetype?.startsWith('image/')) cb(null, true);
                else cb(new BadRequestException('Seules les images sont acceptées'), false);
            },
        }),
    )
    @ApiOperation({
        summary: 'Uploader une image (chat, photo de profil, portfolio)',
        description:
            'Multipart form-data, champ "file". Retourne les URLs optimisées ' +
            '(miniature, moyenne, originale) hébergées sur CDN.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 201, description: 'Image uploadée (url + variantes)' })
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder?: string,
    ) {
        if (!file) {
            throw new BadRequestException('Aucun fichier reçu (champ attendu : "file")');
        }
        if (!file.mimetype?.startsWith('image/')) {
            throw new BadRequestException('Seules les images sont acceptées');
        }

        const targetFolder =
            folder && ALLOWED_FOLDERS.has(folder) ? `alloartisan/${folder}` : 'alloartisan/chat';

        const result = await this.uploadService.uploadImageBuffer(file.buffer, targetFolder);
        return {
            url: result.variants.medium,
            thumbnail: result.variants.thumbnail,
            original: result.variants.original,
            publicId: result.publicId,
        };
    }

    @Post('audio')
    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo ≈ plusieurs minutes de vocal
            // Filtre LOCAL : le filtre global du module n'accepte que les
            // images (c'était la cause du « Vocal non envoyé »)
            fileFilter: (_req, file, cb) => {
                const ok =
                    file.mimetype?.startsWith('audio/') ||
                    file.mimetype === 'video/mp4' || // m4a encapsulé (enregistreurs mobiles)
                    file.mimetype === 'application/octet-stream';
                if (ok) cb(null, true);
                else {
                    cb(
                        new BadRequestException(
                            `Seuls les fichiers audio sont acceptés (reçu : ${file.mimetype})`,
                        ),
                        false,
                    );
                }
            },
        }),
    )
    @ApiOperation({
        summary: 'Uploader un message vocal (audio)',
        description: 'Multipart form-data, champ "file". Retourne l\'URL CDN du fichier audio.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 201, description: 'Audio uploadé (url)' })
    async uploadAudio(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Aucun fichier reçu (champ attendu : "file")');
        }
        const okMime =
            file.mimetype?.startsWith('audio/') ||
            file.mimetype === 'video/mp4' || // m4a encapsulé (enregistreurs mobiles)
            file.mimetype === 'application/octet-stream';
        if (!okMime) {
            throw new BadRequestException('Seuls les fichiers audio sont acceptés');
        }
        return this.uploadService.uploadAudioBuffer(file.buffer);
    }

    @Post('video')
    @Throttle({ default: { ttl: 60000, limit: 4 } })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            // Limite stricte : les vidéos partent sur le CDN (jamais stockées
            // sur ce serveur). 50 Mo accepte le brut des téléphones — la
            // LIVRAISON est ensuite compressée (720p, qualité auto) par le CDN
            limits: { fileSize: 50 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                if (file.mimetype?.startsWith('video/')) cb(null, true);
                else {
                    cb(
                        new BadRequestException(
                            `Seuls les fichiers vidéo sont acceptés (reçu : ${file.mimetype})`,
                        ),
                        false,
                    );
                }
            },
        }),
    )
    @ApiOperation({
        summary: 'Uploader une vidéo courte (chat : filmer une panne)',
        description:
            'Multipart form-data, champ "file". Max 50 Mo en entrée — la livraison ' +
            'est automatiquement compressée (720p, qualité/codec auto) par le CDN.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    })
    @ApiResponse({ status: 201, description: 'Vidéo uploadée (url)' })
    async uploadVideo(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Aucun fichier reçu (champ attendu : "file")');
        }
        return this.uploadService.uploadVideoBuffer(file.buffer);
    }
}
