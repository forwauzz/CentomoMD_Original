import { readFile } from 'fs/promises';
import { join } from 'path';

export async function loadPromptFile(filename: string): Promise<string> {
  const promptPath = join(process.cwd(), 'prompts', filename);
  return await readFile(promptPath, 'utf-8');
}

export async function loadGuardrailsFile(filename: string): Promise<any> {
  const guardrailsPath = join(process.cwd(), 'prompts', filename);
  const content = await readFile(guardrailsPath, 'utf-8');
  return JSON.parse(content);
}

export async function loadGoldenExampleFile(filename: string): Promise<string> {
  const goldenPath = join(process.cwd(), 'prompts', filename);
  return await readFile(goldenPath, 'utf-8');
}
