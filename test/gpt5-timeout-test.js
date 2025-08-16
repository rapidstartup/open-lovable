// GPT-5 Timeout Test Script
// This script tests the AI generation API directly to debug timeout issues

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_MODEL = 'openai/gpt-5';
const TEST_PROMPT = 'Create a simple React component that displays "Hello World" with some basic styling.';

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🔍 GPT-5 Timeout Test Starting...');
console.log(`📝 Test Model: ${TEST_MODEL}`);
console.log(`📝 Test Prompt: ${TEST_PROMPT}`);
console.log(`⏱️  Current Time: ${new Date().toISOString()}`);
console.log('');

async function testGPT5Generation() {
  try {
    console.log('🚀 Starting GPT-5 generation test...');
    
    // Create stream options similar to our API
    const streamOptions = {
      model: openai('gpt-5'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful React developer. Generate simple, working React components.'
        },
        {
          role: 'user',
          content: TEST_PROMPT
        }
      ],
      maxTokens: 1000,
      temperature: undefined, // GPT-5 doesn't use temperature
      experimental_providerMetadata: {
        openai: {
          reasoningEffort: 'high'
        }
      }
    };

    console.log('⚙️  Stream options configured:');
    console.log(`   - Model: ${streamOptions.model}`);
    console.log(`   - Max tokens: ${streamOptions.maxTokens}`);
    console.log(`   - Reasoning effort: ${streamOptions.experimental_providerMetadata.openai.reasoningEffort}`);
    console.log('');

    // Test 1: Direct streamText call without timeout
    console.log('🧪 Test 1: Direct streamText call (no timeout)...');
    const startTime = Date.now();
    
    try {
      const result = await streamText(streamOptions);
      console.log('✅ streamText call completed successfully!');
      
      // Process the stream
      let generatedText = '';
      let chunkCount = 0;
      
      for await (const chunk of result.textStream) {
        chunkCount++;
        generatedText += chunk;
        
        if (chunkCount <= 3) {
          console.log(`   📦 Chunk ${chunkCount}: ${chunk.length} chars`);
        }
        
        // Break after first few chunks for testing
        if (chunkCount >= 5) {
          console.log(`   ⏹️  Stopping after ${chunkCount} chunks for testing`);
          break;
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`⏱️  Total duration: ${duration}ms`);
      console.log(`📊 Generated ${chunkCount} chunks, ${generatedText.length} total characters`);
      console.log(`📝 First 200 chars: ${generatedText.substring(0, 200)}...`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ streamText failed after ${duration}ms`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Error type: ${typeof error}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack.split('\n')[0]}`);
      }
    }

    console.log('');
    
    // Test 2: With Promise.race timeout (like our API)
    console.log('🧪 Test 2: streamText with Promise.race timeout (300s)...');
    const timeoutMs = 300000; // 5 minutes
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    const startTime2 = Date.now();
    
    try {
      const result = await Promise.race([
        streamText(streamOptions),
        timeoutPromise
      ]);
      
      console.log('✅ Promise.race completed successfully!');
      
      // Process a few chunks
      let chunkCount = 0;
      for await (const chunk of result.textStream) {
        chunkCount++;
        if (chunkCount >= 3) break;
        console.log(`   📦 Chunk ${chunkCount}: ${chunk.length} chars`);
      }
      
      const duration = Date.now() - startTime2;
      console.log(`⏱️  Total duration: ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime2;
      console.log(`❌ Promise.race failed after ${duration}ms`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Error type: ${typeof error}`);
    }

    console.log('');
    
    // Test 3: Check if there are any internal timeouts
    console.log('🧪 Test 3: Checking for internal timeouts...');
    
    // Try with a very short timeout to see if there's an internal limit
    const shortTimeoutMs = 10000; // 10 seconds
    
    const shortTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Short timeout after ${shortTimeoutMs}ms`));
      }, shortTimeoutMs);
    });
    
    const startTime3 = Date.now();
    
    try {
      const result = await Promise.race([
        streamText(streamOptions),
        shortTimeoutPromise
      ]);
      
      console.log('✅ Short timeout test completed (this means no internal timeout < 10s)');
      
    } catch (error) {
      const duration = Date.now() - startTime3;
      console.log(`❌ Short timeout test failed after ${duration}ms`);
      console.log(`   Error: ${error.message}`);
      
      if (error.message.includes('timeout')) {
        console.log('   🔍 This suggests there might be an internal timeout mechanism');
      }
    }

  } catch (error) {
    console.error('💥 Test failed with unexpected error:', error);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting GPT-5 timeout investigation...');
console.log('');

testGPT5Generation()
  .then(() => {
    console.log('');
    console.log('✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
