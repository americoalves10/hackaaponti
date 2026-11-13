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
      console.warn('⚠️ OpenAI não inicializada. Usando fallback.');
      return this.getMockResponse();
    }

    try {
      console.log('🤖 Enviando imagem para OpenAI...');
      console.log('📊 Tamanho da imagem:', Math.round(imageBase64.length / 1024), 'KB');
      
      // Formata a imagem no padrão Data URL que a OpenAI aceita
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em defesa civil e infraestrutura urbana. Analise cuidadosamente a imagem fornecida e identifique o problema visível.'
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: `Analise esta imagem de um problema urbano. Identifique EXATAMENTE o que está visível na foto e retorne APENAS um objeto JSON válido no seguinte formato:

{
  "tipo_problema": "string (descreva o que VOCÊ VÊ na imagem: alagamento, bueiro_entupido, arvore_risco, fio_exposto, rachadura_encosta, lixo_acumulado, buraco_via, poste_inclinado, etc)",
  "urgencia": "critico|alto|medio|baixo",
  "orgao_responsavel": "string (Defesa Civil, Subprefeitura, Concessionária de Energia, Sabesp, etc)",
  "descricao_tecnica": "string (descrição técnica do que VOCÊ VÊ na imagem, max 100 palavras)",
  "risco_se_nao_resolvido": "string (consequência em 1 frase)",
  "email_sugerido": "string (email genérico do tipo de órgão)"
}

IMPORTANTE: Descreva SOMENTE o que está visível na imagem. Não invente problemas que não aparecem.` 
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
        max_tokens: 1000,
      });

      console.log('✅ Resposta recebida da OpenAI');
      
      const content = response.choices[0].message.content;
      if (!content) {
        console.error('❌ Resposta vazia da IA');
        return this.getMockResponse();
      }
      
      console.log('📝 Resposta bruta:', content.substring(0, 100) + '...');
      
      // Remove markdown se existir
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      const result = JSON.parse(cleanContent);
      console.log('✅ JSON parseado com sucesso:', result.tipo_problema);
      
      return result;

    } catch (error: any) {
      console.error('❌ Erro na IA OpenAI:', error.message);
      if (error.response) {
        console.error('❌ Detalhes:', JSON.stringify(error.response, null, 2));
      }
      console.warn('⚠️ Ativando fallback...');
      return this.getMockResponse();
    }
  }

  private getMockResponse() {
    console.log('⚠️ Retornando resposta de fallback (demonstração)');
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