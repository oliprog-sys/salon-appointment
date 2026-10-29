import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';

// Custom disk storage engine to avoid multer import dependency
const multer = require('multer');
const customDiskStorage = multer.diskStorage({
  destination: './uploads',
  filename: (req: any, file: any, callback: any) => {
    const ext = path.extname(file.originalname);
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const filename = `kyc_${uniqueId}${ext}`;
    callback(null, filename);
  },
});

@Controller('uploads')
export class UploadController {
  constructor() {}

  @Post('kyc')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: customDiskStorage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req: any, file: any, callback: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
          return callback(
            new BadRequestException('Only JPG, PNG, and PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadKycDocument(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    };
  }
}
