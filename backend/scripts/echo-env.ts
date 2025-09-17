import 'dotenv/config';

const raw = process.env.DATABASE_URL ?? '';
console.log('=== DATABASE_URL DIAGNOSTIC ===');
console.log('Length:', raw.length);
console.log('Raw value:', raw);
console.log('JSON stringified:', JSON.stringify(raw));
console.log('Contains CR (\\r):', /\r/.test(raw));
console.log('Contains LF (\\n):', /\n/.test(raw));
console.log('Contains zero-width chars:', /[\u200B\u200C\u200D\uFEFF]/.test(raw));
console.log('Contains tabs:', /\t/.test(raw));
console.log('Contains spaces:', /\s/.test(raw));
console.log('Trimmed length:', raw.trim().length);
console.log('Trimmed value:', raw.trim());
console.log('=== END DIAGNOSTIC ===');
