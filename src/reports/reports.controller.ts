import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from '../ai/ai.service';

@Controller('reports')
export class ReportsController {
  constructor(private aiService: AiService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  // 👇 TROQUE 'File' por 'any' aqui
  async analyze(@UploadedFile() file: any) { 
    if (!file) {
      throw new Error('Nenhuma imagem enviada');
    }
    
    const base64 = file.buffer.toString('base64');
    const analysis = await this.aiService.analisarProblema(base64, file.mimetype);
    
    return {
      ...analysis,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    };
  }
}