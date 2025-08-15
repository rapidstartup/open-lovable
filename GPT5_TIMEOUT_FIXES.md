# GPT-5 Timeout Fixes

## Problem
GPT-5 models were frequently failing due to timeout issues, especially when using high reasoning effort. This caused:
- Hanging requests that never completed
- Poor user experience with no feedback
- Resource waste from abandoned requests

## Root Cause
- GPT-5 models with `reasoningEffort: 'high'` take significantly longer to respond
- No timeout configuration in the AI SDK `streamText` calls
- Frontend fetch calls had no timeout handling
- Users had no guidance on what to do when timeouts occurred

## Solutions Implemented

### 1. Backend Timeout Configuration (`config/app.config.ts`)
Added AI generation timeout configuration:
```typescript
generation: {
  // Base timeout for all models (milliseconds)
  baseTimeoutMs: 120000, // 2 minutes
  
  // Extended timeout for GPT-5 models due to reasoning effort
  gpt5TimeoutMs: 300000, // 5 minutes
  
  // Timeout for other models
  otherModelsTimeoutMs: 180000, // 3 minutes
  
  // Get timeout for specific model
  getTimeoutForModel(model: string): number {
    if (model.startsWith('openai/gpt-5')) {
      return this.gpt5TimeoutMs;
    }
    return this.otherModelsTimeoutMs;
  }
}
```

### 2. Backend API Timeout Handling (`app/api/generate-ai-code-stream/route.ts`)
- Added timeout promises that race against AI generation
- GPT-5 models get 5 minutes, other models get 3 minutes
- Truncation recovery also has 2-minute timeout
- Specific timeout error messages with helpful guidance

### 3. Frontend Timeout Handling (`app/page.tsx`)
- Added timeout handling to all three AI generation fetch calls
- Timeout promises race against fetch responses
- Consistent timeout durations matching backend configuration
- Proper error handling for timeout scenarios

### 4. Enhanced Error Messages
When timeouts occur, users now see helpful guidance:
```
Generation timed out. This commonly happens with GPT-5 models due to high reasoning effort. Try:
1. Using a different model (Kimi K2 or Claude Sonnet 4)
2. Breaking down your request into smaller parts
3. Simplifying your prompt
4. Waiting a moment and trying again
```

## Timeout Durations

| Model Type | Timeout | Reasoning |
|------------|---------|-----------|
| GPT-5 | 5 minutes | High reasoning effort requires more time |
| Claude Sonnet 4 | 3 minutes | Good balance of speed and quality |
| Kimi K2 | 3 minutes | Fast but reliable generation |
| Truncation Recovery | 2 minutes | Quick fixes for incomplete files |

## Benefits

1. **No More Hanging Requests**: All requests now have explicit timeouts
2. **Better User Experience**: Clear feedback when timeouts occur
3. **Resource Efficiency**: Prevents abandoned requests from consuming resources
4. **User Guidance**: Specific suggestions for avoiding timeouts
5. **Model-Specific Handling**: GPT-5 gets appropriate extended timeouts

## Usage Recommendations

### For Users Experiencing Timeouts:
1. **Switch Models**: Try Kimi K2 or Claude Sonnet 4 instead of GPT-5
2. **Break Down Requests**: Split complex requests into smaller parts
3. **Simplify Prompts**: Remove unnecessary complexity from your requests
4. **Retry Strategy**: Wait a moment and try again

### For Developers:
- Monitor timeout frequency by model type
- Consider adjusting timeout durations based on usage patterns
- Implement retry logic for failed requests if needed

## Technical Implementation Details

### Backend Timeout Race
```typescript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error(`AI generation timed out after ${timeoutMs}ms...`));
  }, timeoutMs);
});

const result = await Promise.race([
  streamText(streamOptions),
  timeoutPromise
]) as Awaited<ReturnType<typeof streamText>>;
```

### Frontend Timeout Race
```typescript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    reject(new Error(`Request timed out after ${timeoutMs}ms...`));
  }, timeoutMs);
});

const timedResponse = await Promise.race([
  response,
  timeoutPromise
]) as Response;
```

## Future Improvements

1. **Adaptive Timeouts**: Adjust timeouts based on request complexity
2. **Retry Logic**: Automatically retry failed requests with different models
3. **Progress Indicators**: Show estimated time remaining for long generations
4. **Model Recommendations**: Suggest faster models for time-sensitive requests
