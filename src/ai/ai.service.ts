import { Injectable } from '@nestjs/common';
import { Groq } from 'groq-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AiService {
  private groq: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.startsWith('gsk_')) {
      this.groq = new Groq({ apiKey });
      console.log('✅ Chave da Groq carregada com sucesso!');
    } else {
      console.warn('⚠️ GROQ_API_KEY inválida ou não encontrada. Usando fallback.');
    }
  }

  async analisarProblema(imageBase64: string, mimeType: string) {
    if (!this.groq) {
      return this.getMockResponse();
    }

    try {
      console.log('🤖 Enviando imagem para Groq (Qwen Vision)...');
      
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise ESTA IMAGEM de um problema urbano e retorne APENAS um objeto JSON válido (sem markdown, sem texto extra): {"tipo_problema": "string", "urgencia": "critico|alto|medio|baixo", "orgao_responsavel": "string", "descricao_tecnica": "string", "risco_se_nao_resolvido": "string", "email_sugerido": "string"}'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        model: 'qwen/qwen3.8-27b'
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Resposta vazia da IA');
      }
      
      // Limpa qualquer formatação de markdown caso a IA insista em colocar
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanJson);
      
      console.log('✅ Sucesso! Problema identificado:', result.tipo_problema);
      return result;

    } catch (error: any) {
      console.error('❌ Erro na Groq:', error.message);
      return this.getMockResponse();
    }
  }

  private getMockResponse() {
    return {
      tipo_problema: "alagamento_via_publica",
      urgencia: "critico",
      orgao_responsavel: "Defesa Civil",
      descricao_tecnica: "Acúmulo de água na via, indicando falha na drenagem.",
      risco_se_nao_resolvido: "Risco de alagamento de residências.",
      email_sugerido: "defesacivil@prefeitura.sp.gov.br",
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9).toUpperCase()
    };
  }
}