import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from '../ai/ai.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  async analyze(@UploadedFile() file: Express.Multer.File) {
    console.log(`📸 Imagem recebida: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Converte direto para base64. Sem compressão pesada.
    const imageBase64 = file.buffer.toString('base64');
    
    // Chama o serviço de IA (que agora será um mock inteligente e infalível)
    return await this.aiService.analisarProblema(imageBase64, file.mimetype);
  }
}