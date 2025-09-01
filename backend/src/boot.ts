import 'dotenv/config';

// catch *everything* early so exits are never silent
process.on('uncaughtException', e => { 
  console.error('❌ uncaughtException:', e); 
  process.exitCode = 1; 
});

process.on('unhandledRejection', e => { 
  console.error('❌ unhandledRejection:', e); 
  process.exitCode = 1; 
});

console.log('🚀 Booting at', new Date().toISOString());
console.log('CWD:', process.cwd());

const start = async () => {
  try {
    // dynamic import AFTER dotenv so env is populated
    const { default: run } = await import('./index.js');
    await run();              // export a start function from index.ts
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

start();
