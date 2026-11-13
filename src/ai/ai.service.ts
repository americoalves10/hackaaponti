import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ Chave da OpenAI carregada com sucesso!');
    } else {
      console.warn('⚠️ OPENAI_API_KEY inválida ou não encontrada no .env');
    }
  }

  async analisarProblema(imageBase64: string, mimeType: string) {
    if (!this.openai) {
      console.warn('⚠️ Usando modo de demonstração (Fallback).');
      return this.getMockResponse();
    }

    try {
      // Formata a imagem no padrão Data URL que a OpenAI aceita
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Modelo rápido, barato e excelente para visão
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: `Você é um especialista em defesa civil e infraestrutura urbana. Analise esta imagem de um problema urbano e retorne APENAS um objeto JSON válido (sem markdown, sem texto extra):
{
  "tipo_problema": "string (ex: alagamento, bueiro_entupido, arvore_risco, fio_exposto, rachadura_encosta, lixo_acumulado)",
  "urgencia": "critico|alto|medio|baixo",
  "orgao_responsavel": "string (ex: Defesa Civil, Subprefeitura, Concessionária de Energia, Sabesp)",
  "descricao_tecnica": "string (texto formal para o órgão, max 100 palavras)",
  "risco_se_nao_resolvido": "string (consequência em 1 frase)",
  "email_sugerido": "string (email genérico do tipo de órgão)"
}` 
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' }, // Força a OpenAI a retornar apenas JSON
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('Resposta vazia da IA');
      
      return JSON.parse(content);

    } catch (error) {
      console.error('❌ Erro na IA OpenAI:', error.message);
      // Fallback de segurança para a demo não quebrar
      return this.getMockResponse();
    }
  }

  private getMockResponse() {
    return {
      tipo_problema: "alagamento_via_publica",
      urgencia: "critico",
      orgao_responsavel: "Defesa Civil e Departamento de Drenagem Urbana",
      descricao_tecnica: "Acúmulo significativo de água na via pública, indicando falha no sistema de microdrenagem.",
      risco_se_nao_resolvido: "Risco iminente de alagamento de residências e perigo de choque elétrico.",
      email_sugerido: "defesacivil@prefeitura.sp.gov.br",
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9).toUpperCase()
    };
  }
}