export interface AIProvider {
  generateResponse(prompt: string, context?: string): Promise<string>;
  summarizeConversation(messages: string[]): Promise<string>;
}

export class GeminiAIProvider implements AIProvider {
  async generateResponse(prompt: string, context?: string): Promise<string> {
    // Modular placeholder ready for @google/genai integration
    return `[IA Resposta Automática]: Entendi sua solicitação sobre "${prompt}". Um de nossos especialistas em T.I. irá te atender em instantes.`;
  }

  async summarizeConversation(messages: string[]): Promise<string> {
    return `Resumo do Atendimento: Cliente solicitou suporte técnico para o chamado e foi atendido pela equipe.`;
  }
}

export const aiProvider: AIProvider = new GeminiAIProvider();
