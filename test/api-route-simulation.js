// API Route Simulation Test
// This script simulates the exact conditions of our generate-ai-code-stream API route

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

// Test configuration - exactly like our API route
const TEST_MODEL = 'openai/gpt-5';
const TEST_PROMPT = 'Create a simple React component that displays "Hello World" with some basic styling.';

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🔍 API Route Simulation Test');
console.log('============================');
console.log(`📝 Test Model: ${TEST_MODEL}`);
console.log(`📝 Test Prompt: ${TEST_PROMPT}`);
console.log(`⏱️  Current Time: ${new Date().toISOString()}`);
console.log('');

async function simulateAPIRoute() {
  try {
    console.log('🚀 Simulating API route behavior...');
    
    // Create stream options EXACTLY like our API route
    const streamOptions = {
      model: openai('gpt-5'),
      messages: [
        {
          role: 'system',
          content: `You are an expert React developer with perfect memory of the conversation. You maintain context across messages and remember scraped websites, generated components, and applied code. Generate clean, modern React code for Vite applications.

🚨 CRITICAL RULES - YOUR MOST IMPORTANT INSTRUCTIONS:
1. **DO EXACTLY WHAT IS ASKED - NOTHING MORE, NOTHING LESS**
    - Don't add features not requested
    - Don't fix unrelated issues
    - Don't improve things not mentioned
2. **CHECK App.jsx FIRST** - ALWAYS see what components exist before creating new ones
3. **NAVIGATION LIVES IN Header.jsx** - Don't create Nav.jsx if Header exists with nav
4. **USE STANDARD TAILWIND CLASSES ONLY**:
    - ✅ CORRECT: bg-white, text-black, bg-blue-500, bg-gray-100, text-gray-900
    - ❌ WRONG: bg-background, text-foreground, bg-primary, bg-muted, text-secondary
    - Use ONLY classes from the official Tailwind CSS documentation
5. **FILE COUNT LIMITS**:
    - Simple style/text change = 1 file ONLY
    - New component = 2 files MAX (component + parent)
    - If >3 files, YOU'RE DOING TOO MUCH

CRITICAL: When asked to create a React app or components:
- ALWAYS CREATE ALL FILES IN FULL - never provide partial implementations
- ALWAYS CREATE EVERY COMPONENT that you import - no placeholders
- ALWAYS IMPLEMENT COMPLETE FUNCTIONALITY - don't leave TODOs unless explicitly asked
- If you're recreating a website, implement ALL sections and features completely
- NEVER create tailwind.config.js - it's already configured in the template
- ALWAYS include a Navigation/Header component (Nav.jsx or Header.jsx) - websites need navigation!

Use this XML format for React components only:
<file path="src/index.css">
@tailwind base;
@tailwind components;
@tailwind utilities;
</file>

<file path="src/App.jsx">
// Main App component that imports and uses other components
</file>

<file path="src/components/Example.jsx">
// Your React component code here
</file>`
        },
        {
          role: 'user',
          content: TEST_PROMPT
        }
      ],
      maxTokens: 8192,
      stopSequences: [],
      experimental_providerMetadata: {
        openai: {
          reasoningEffort: 'high'
        }
      }
    };

    console.log('⚙️  Stream options configured (exactly like API route):');
    console.log(`   - Model: ${streamOptions.model}`);
    console.log(`   - Max tokens: ${streamOptions.maxTokens}`);
    console.log(`   - Reasoning effort: ${streamOptions.experimental_providerMetadata.openai.reasoningEffort}`);
    console.log('');

    // Test 1: Simulate the exact Promise.race pattern from our API route
    console.log('🧪 Test 1: Simulating API route Promise.race pattern...');
    const timeoutMs = 300000; // 5 minutes (exactly like our config)
    
    const timeoutPromise = new Promise((_, reject) => {
      const startTime = Date.now();
      console.log(`   ⏱️  Setting up timeout promise for ${timeoutMs}ms at ${new Date().toISOString()}`);
      
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.log(`   ⏰ Timeout triggered after ${elapsed}ms at ${new Date().toISOString()}`);
        reject(new Error(`AI generation timed out after ${timeoutMs}ms. This can happen with GPT-5 models due to high reasoning effort. Try using a different model or breaking down your request into smaller parts.`));
      }, timeoutMs);
    });
    
    const startTime = Date.now();
    console.log(`   🚀 Starting streamText call with timeout race at ${new Date().toISOString()}`);
    
    try {
      const result = await Promise.race([
        streamText(streamOptions),
        timeoutPromise
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`   ✅ Promise.race completed successfully after ${duration}ms at ${new Date().toISOString()}`);
      
      // Process the stream like our API route does
      console.log('   📡 Processing text stream...');
      let generatedCode = '';
      let chunkCount = 0;
      
      for await (const textPart of result.textStream) {
        const text = textPart || '';
        generatedCode += text;
        chunkCount++;
        
        if (chunkCount <= 3) {
          console.log(`      📦 Chunk ${chunkCount}: ${text.length} chars`);
        }
        
        // Stop after a reasonable amount for testing
        if (chunkCount >= 10 || generatedCode.length > 1000) {
          console.log(`      ⏹️  Stopping after ${chunkCount} chunks for testing`);
          break;
        }
      }
      
      console.log(`   📊 Total: ${chunkCount} chunks, ${generatedCode.length} characters`);
      console.log(`   📝 Preview: ${generatedCode.substring(0, 200)}...`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Promise.race failed after ${duration}ms`);
      console.log(`      Error: ${error.message}`);
      console.log(`      Error type: ${typeof error}`);
      
      if (error.message.includes('timed out')) {
        console.log('      🔍 This is a timeout error - our Promise.race is working!');
      }
    }

    console.log('');
    
    // Test 2: Check if there's a 30-second internal limit
    console.log('🧪 Test 2: Checking for 30-second internal limit...');
    
    const thirtySecondTimeout = 31000; // 31 seconds to see if there's a 30s limit
    
    const thirtySecondPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`30-second test timeout after ${thirtySecondTimeout}ms`));
      }, thirtySecondTimeout);
    });
    
    const startTime2 = Date.now();
    console.log(`   🚀 Starting 30-second test at ${new Date().toISOString()}`);
    
    try {
      const result = await Promise.race([
        streamText(streamOptions),
        thirtySecondPromise
      ]);
      
      const duration = Date.now() - startTime2;
      console.log(`   ✅ 30-second test completed after ${duration}ms`);
      console.log(`   🔍 This means there's NO internal 30-second timeout`);
      
    } catch (error) {
      const duration = Date.now() - startTime2;
      console.log(`   ❌ 30-second test failed after ${duration}ms`);
      console.log(`      Error: ${error.message}`);
      
      if (duration < 31000 && error.message.includes('timeout')) {
        console.log(`      🔍 INTERNAL TIMEOUT DETECTED at ${duration}ms!`);
        console.log(`      🔍 This suggests there's a platform-level timeout we can't override`);
      }
    }

    console.log('');
    
    // Test 3: Simulate the exact error handling from our API route
    console.log('🧪 Test 3: Simulating API route error handling...');
    
    try {
      // This should work fine, but let's test the error handling path
      const result = await streamText(streamOptions);
      
      // Simulate an error by trying to access a non-existent property
      console.log('   🔍 Testing error handling by simulating an error...');
      throw new Error('Simulated error for testing error handling');
      
    } catch (error) {
      console.log(`   ❌ Error caught: ${error.message}`);
      console.log(`   🔍 Error type: ${typeof error}`);
      
      // Simulate our API route error handling
      if (error.message.includes('timed out')) {
        console.log('   📝 This would trigger our timeout error handling in the API route');
      } else if (error.message.includes('tool call validation failed')) {
        console.log('   📝 This would trigger our tool validation error handling');
      } else {
        console.log('   📝 This would trigger our general error handling');
      }
    }

  } catch (error) {
    console.error('💥 Simulation failed with unexpected error:', error);
    console.error('   Stack:', error.stack);
  }
}

// Run the simulation
console.log('🚀 Starting API route simulation...');
console.log('');

simulateAPIRoute()
  .then(() => {
    console.log('');
    console.log('✅ API route simulation completed!');
    console.log('');
    console.log('🔍 Analysis:');
    console.log('   - If Test 1 works: Our Promise.race timeout is working');
    console.log('   - If Test 2 fails before 31s: There\'s an internal timeout');
    console.log('   - If Test 2 works: No internal timeout issues');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   - Check if the issue is with Next.js hosting platform timeouts');
    console.log('   - Verify that maxDuration export is being respected');
    console.log('   - Check for any platform-specific timeout configurations');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Simulation failed:', error);
    process.exit(1);
  });
