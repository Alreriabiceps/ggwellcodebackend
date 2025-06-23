import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log('GEMINI_API_KEY starts with AIza:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.startsWith('AIza') : false);

if (process.env.GEMINI_API_KEY) {
  console.log('✅ API key found in environment');
  console.log('First 10 chars:', process.env.GEMINI_API_KEY.substring(0, 10));
} else {
  console.log('❌ No API key found in environment');
}

console.log('\n🔍 All environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('GEMINI') || key.includes('API')) {
    console.log(`${key}:`, process.env[key] ? `${process.env[key].substring(0, 10)}...` : 'undefined');
  }
}); 