import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from '../ai/ai.service';
import * as sharp from 'sharp';

@Controller('reports')
export class ReportsController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  async analyze(@UploadedFile() file: Express.Multer.File) {
    console.log('📸 Imagem recebida do celular. Tamanho original:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    try {
      // O BACKEND faz a compressão de forma segura, sem estourar a memória do celular
      const compressedBuffer = await sharp(file.buffer)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
      
      console.log('✅ Comprimida no servidor para:', (compressedBuffer.length / 1024).toFixed(2), 'KB');
      
      const imageBase64 = compressedBuffer.toString('base64');
      const analysis = await this.aiService.analisarProblema(imageBase64, 'image/jpeg');
      
      return {
        ...analysis,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9).toUpperCase()
      };
    } catch (error: any) {
      console.error('❌ Erro no backend:', error.message);
      throw error;
    }
  }
}