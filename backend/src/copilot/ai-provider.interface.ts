export interface AiResponse {
  text: string;
  confidence: number;
  tokensUsed: {
    prompt: number;
    completion: number;
  };
  provider: string;
  model: string;
}

export interface AiProvider {
  generateResponse(
    query: string,
    systemPrompt: string,
    history: { role: 'USER' | 'AI'; content: string }[],
    knowledgeDocs: { title: string; content: string }[],
    language: string,
    onToken?: (token: string, text: string) => void,
  ): Promise<AiResponse>;
}
