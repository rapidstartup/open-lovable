// Application Configuration
// This file contains all configurable settings for the application

export const appConfig = {
  // E2B Sandbox Configuration
  e2b: {
    // Sandbox timeout in minutes - increased for better reliability
    timeoutMinutes: 20, // Increased from 15
    
    // Convert to milliseconds for E2B API
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },
    
    // Vite development server port
    vitePort: 5173,
    
    // Time to wait for Vite to be ready (in milliseconds) - increased
    viteStartupDelay: 10000, // Increased from 7000
    
    // Time to wait for CSS rebuild (in milliseconds)
    cssRebuildDelay: 2000,
    
    // Default sandbox template (if using templates)
    defaultTemplate: undefined, // or specify a template ID
  },
  
  // AI Model Configuration
  ai: {
    // Default AI model
    defaultModel: 'moonshotai/kimi-k2-instruct',
    
    // Available models
    availableModels: [
      'openai/gpt-5',
      'openai/gpt-4o',
      'moonshotai/kimi-k2-instruct',
      'anthropic/claude-sonnet-4-20250514'
    ],
    
    // Model display names
    modelDisplayNames: {
      'openai/gpt-5': 'GPT-5 (Reasoning)',
      'openai/gpt-4o': 'GPT-4o (Fast)',
      'moonshotai/kimi-k2-instruct': 'Kimi K2 Instruct',
      'anthropic/claude-sonnet-4-20250514': 'Sonnet 4'
    },
    
    // Temperature settings for non-reasoning models
    defaultTemperature: 0.7,
    
    // Max tokens for code generation
    maxTokens: 8000,
    
    // Max tokens for truncation recovery
    truncationRecoveryMaxTokens: 4000,
    
    // AI Generation timeout configuration
    generation: {
      // Base timeout for all models (milliseconds)
      baseTimeoutMs: 120000, // 2 minutes
      
      // Reduced timeout for GPT-5 models to prevent hanging
      gpt5TimeoutMs: 180000, // 3 minutes (reduced from 5)
      
      // Fast timeout for GPT-4o and similar models
      fastModelsTimeoutMs: 120000, // 2 minutes
      
      // Timeout for other models
      otherModelsTimeoutMs: 180000, // 3 minutes
      
      // Get timeout for specific model
      getTimeoutForModel(model: string): number {
        if (model.startsWith('openai/gpt-5')) {
          return this.gpt5TimeoutMs;
        }
        if (model.includes('gpt-4o') || model.includes('kimi') || model.includes('claude')) {
          return this.fastModelsTimeoutMs;
        }
        return this.otherModelsTimeoutMs;
      }
    }
  },
  
  // Code Application Configuration
  codeApplication: {
    // Delay after applying code before refreshing iframe (milliseconds)
    defaultRefreshDelay: 2000,
    
    // Delay when packages are installed (milliseconds)
    packageInstallRefreshDelay: 5000,
    
    // Enable/disable automatic truncation recovery
    enableTruncationRecovery: false, // Disabled - too many false positives
    
    // Maximum number of truncation recovery attempts per file
    maxTruncationRecoveryAttempts: 1,
  },
  
  // UI Configuration
  ui: {
    // Show/hide certain UI elements
    showModelSelector: true,
    showStatusIndicator: true,
    
    // Animation durations (milliseconds)
    animationDuration: 200,
    
    // Toast notification duration (milliseconds)
    toastDuration: 3000,
    
    // Maximum chat messages to keep in memory
    maxChatMessages: 100,
    
    // Maximum recent messages to send as context
    maxRecentMessagesContext: 20,
  },
  
  // Development Configuration
  dev: {
    // Enable debug logging
    enableDebugLogging: true,
    
    // Enable performance monitoring
    enablePerformanceMonitoring: false,
    
    // Log API responses
    logApiResponses: true,
  },
  
  // Package Installation Configuration
  packages: {
    // Use --legacy-peer-deps flag for npm install
    useLegacyPeerDeps: true,
    
    // Package installation timeout (milliseconds)
    installTimeout: 60000,
    
    // Auto-restart Vite after package installation
    autoRestartVite: true,
  },
  
  // File Management Configuration
  files: {
    // Excluded file patterns (files to ignore)
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      '*.log',
      '.DS_Store'
    ],
    
    // Maximum file size to read (bytes)
    maxFileSize: 1024 * 1024, // 1MB
    
    // File extensions to treat as text
    textFileExtensions: [
      '.js', '.jsx', '.ts', '.tsx',
      '.css', '.scss', '.sass',
      '.html', '.xml', '.svg',
      '.json', '.yml', '.yaml',
      '.md', '.txt', '.env',
      '.gitignore', '.dockerignore'
    ],
  },
  
  // API Endpoints Configuration (for external services)
  api: {
    // Retry configuration - improved
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    
    // Request timeout (milliseconds) - increased for external APIs
    requestTimeout: 60000, // Increased from 30000
    
    // Exponential backoff configuration
    exponentialBackoff: {
      baseDelay: 1000,
      maxDelay: 30000,
      multiplier: 2
    }
  }
};

// Type-safe config getter
export function getConfig<K extends keyof typeof appConfig>(key: K): typeof appConfig[K] {
  return appConfig[key];
}

// Helper to get nested config values
export function getConfigValue(path: string): any {
  return path.split('.').reduce((obj, key) => obj?.[key], appConfig as any);
}

export default appConfig;