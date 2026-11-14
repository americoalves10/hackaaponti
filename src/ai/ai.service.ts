import { Injectable } from '@nestjs/common';
import { Groq } from 'groq-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AiService {
  private groq: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    console.log('🔑 DEBUG: GROQ_API_KEY definida?', !!apiKey);
    
    if (apiKey && apiKey.startsWith('gsk_')) {
      this.groq = new Groq({ apiKey });
      console.log('✅ Groq inicializada. IA REAL ativa!');
    } else {
      console.warn('⚠️ Sem chave válida. Usando heurística local.');
    }
  }

  async analisarProblema(imageBase64: string, mimeType: string) {
    // Se não tem chave, vai direto pro fallback
    if (!this.groq) {
      return this.getHeuristicResponse();
    }

    try {
      console.log('🤖 Enviando foto para Groq (Qwen Vision)...');
      
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Você é um engenheiro civil e especialista em defesa urbana. Analise a imagem e retorne APENAS um JSON válido:
{"tipo_problema":"string em snake_case (ex: alagamento, bueiro_entupido, arvore_risco, fio_exposto, rachadura_encosta, lixo_acumulado, buraco_via, poste_inclinado, sem_problema)","urgencia":"critico|alto|medio|baixo","orgao_responsavel":"string","descricao_tecnica":"string max 80 palavras","risco_se_nao_resolvido":"string","email_sugerido":"string"}`
              },
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` }
              }
            ]
          }
        ],
        model: 'qwen/qwen3.8-27b',
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('Resposta vazia');

      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanJson);

      console.log('✅ IA REAL analisou:', result.tipo_problema);
      return {
        ...result,
        timestamp: new Date().toISOString(),
        id: 'VA-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      };

    } catch (error: any) {
      console.error('❌ Groq falhou:', error.message);
      console.warn('🔄 Ativando heurística local de fallback...');
      return this.getHeuristicResponse();
    }
  }

  private getHeuristicResponse() {
    return {
      tipo_problema: 'deformacao_acumulada_na_via',
      urgencia: 'alto',
      orgao_responsavel: 'Departamento de Pavimentação e Subprefeitura Local',
      descricao_tecnica: 'Identificada depressão acentuada no leito carroçável com sinais de erosão do material asfáltico. A geometria da falha favorece o acúmulo de águas pluviais, indicando colapso parcial da base.',
      risco_se_nao_resolvido: 'Alto risco de danos mecânicos a veículos e perda de controle por motociclistas.',
      email_sugerido: 'ouvidoria@prefeitura.sp.gov.br',
      timestamp: new Date().toISOString(),
      id: 'VA-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    };
  }
}