import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

async function testPromptOnly() {
  console.log('🧪 Testing AI with Prompt + Golden Standard Only...\n');

  // Load the prompt files
  const systemPrompt = await fs.promises.readFile(
    path.join(process.cwd(), 'prompts', 'section7_master.md'), 
    'utf-8'
  );
  
  const goldenExample = await fs.promises.readFile(
    path.join(process.cwd(), 'prompts', 'section7_golden_example.md'), 
    'utf-8'
  );

  const guardrails = JSON.parse(await fs.promises.readFile(
    path.join(process.cwd(), 'prompts', 'section7_master.json'), 
    'utf-8'
  ));

  // Build the complete system prompt
  let fullSystemPrompt = systemPrompt;
  
  // Add golden example
  fullSystemPrompt += '\n\n## REFERENCE EXAMPLE:\n';
  fullSystemPrompt += 'Use this as a reference for structure and style (DO NOT copy verbatim):\n\n';
  fullSystemPrompt += goldenExample;

  // Add style rules
  if (guardrails?.regles_style) {
    fullSystemPrompt += '\n\n## STYLE RULES (CRITICAL):\n';
    Object.entries(guardrails.regles_style).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        fullSystemPrompt += `- ${key}: REQUIRED\n`;
      } else if (typeof value === 'string') {
        fullSystemPrompt += `- ${key}: ${value}\n`;
      }
    });
  }

  // Add quote control rules from JSON
  if (guardrails?.verifications_QA) {
    fullSystemPrompt += '\n\n## QUOTE CONTROL RULES:\n';
    fullSystemPrompt += '- MAXIMUM 1 quote per document (initial worker claim only)\n';
    fullSystemPrompt += '- Use guillemets « ... » for the single allowed quote\n';
    fullSystemPrompt += '- Paraphrase all other worker statements\n';
    fullSystemPrompt += '- Paraphrase all radiology reports\n';
    fullSystemPrompt += '- Paraphrase all doctor notes\n';
  }

  // Test input
  const testInput = `Première consultation en novembre deux mille vingt deux le travailleur dit j'ai eu mal au cou tout de suite après l'accident de voiture impossible de tourner la tête consultation chez docteur Bussière diagnostic présomptif entorse cervicale physiothérapie prescrite. En janvier deux mille vingt trois le travailleur rapporte la douleur descend dans l'épaule droite surtout quand je soulève des boîtes rencontre avec docteur Tremblay médecin de famille arrêt de travail prolongé demande d'imagerie. En février deux mille vingt trois examen radiologique rapport du radiologiste docteur Dubois IRM cervicale sans fracture discret bombement discal C5 C6 pas de compression significative le travailleur dit avoir reçu les résultats par téléphone sans explications supplémentaires. En avril deux mille vingt trois le travailleur explique après dix séances de physio je dors mal et j'ai des maux de tête constants consultation avec le physiatre docteur Leclerc persistance des symptômes recommandation infiltration cortisonée. En juillet deux mille vingt trois suivi avec le physiatre le travailleur mentionne l'infiltration a aidé deux semaines après ça la douleur est revenue pareil plateau thérapeutique poursuite physiothérapie restrictions de travail maintenues. En septembre deux mille vingt trois nouvelle IRM radiologiste docteur Dubois indique examen identique au précédent aucune aggravation objectivable le travailleur précise mais moi je sens que ça empire surtout quand je conduis longtemps.`;

  console.log('📝 RAW TRANSCRIPT:');
  console.log('==================');
  console.log(testInput);
  console.log('\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: fullSystemPrompt
        },
        {
          role: 'user',
          content: testInput
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    let formatted = response.choices[0]?.message?.content?.trim();
    
    if (!formatted) {
      throw new Error('No response from OpenAI');
    }

    // Remove any markdown headings
    formatted = formatted.replace(/^#+\s*.*$/gm, '').trim();

    console.log('🤖 AI OUTPUT (NO POST-PROCESSING):');
    console.log('===================================');
    console.log(formatted);
    console.log('\n');

    // Count quotes
    const quoteMatches = formatted.match(/[«""][\s\S]*?[»""]/g);
    const quoteCount = quoteMatches ? quoteMatches.length : 0;
    
    console.log('📊 QUOTE ANALYSIS:');
    console.log('==================');
    console.log(`Total quotes found: ${quoteCount}`);
    if (quoteMatches) {
      quoteMatches.forEach((quote, i) => {
        console.log(`${i + 1}. ${quote}`);
      });
    }
    console.log('\n');

    // Check for worker-first structure
    const paragraphs = formatted.split(/\n{2,}/);
    const workerFirstCount = paragraphs.filter(p => 
      /^(Le travailleur|La travailleuse)/.test(p.trim())
    ).length;
    
    console.log('📋 STRUCTURE ANALYSIS:');
    console.log('======================');
    console.log(`Total paragraphs: ${paragraphs.length}`);
    console.log(`Worker-first paragraphs: ${workerFirstCount}`);
    console.log(`Structure compliance: ${workerFirstCount === paragraphs.length ? '✅ Perfect' : '❌ Issues'}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPromptOnly().catch(console.error);
