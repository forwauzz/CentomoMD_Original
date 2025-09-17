import OpenAI from "openai";

let _openai: OpenAI | null = null;

export const openai = {
  get chat() {
    if (!_openai) {
      _openai = new OpenAI({ 
        apiKey: process.env['OPENAI_API_KEY']! 
      });
      
      // Optional safety so tests never hit network:
      if (process.env['NODE_ENV'] === "test" && !process.env['MOCK_OPENAI_ALLOW_REAL']) {
        // Throw only if someone tries to actually call .chat.completions.create on this real client
        // You can also stub with a no-op; throwing is safer.
        // const originalCreate = _openai.chat.completions.create;
        _openai.chat.completions.create = (..._args: any[]) => {
          throw new Error("Real OpenAI client called in test environment. Use dependency injection instead.");
        };
      }
    }
    return _openai.chat;
  }
};
