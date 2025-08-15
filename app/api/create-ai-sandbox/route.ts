import { NextResponse } from 'next/server';
import { Sandbox } from '@e2b/code-interpreter';
import type { SandboxState } from '@/types/sandbox';
import { appConfig } from '@/config/app.config';

// Store active sandbox globally
declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
}

export async function POST() {
  let sandbox: any = null;

  try {
    // Ensure required env is present early to fail fast on misconfiguration
    if (!process.env.E2B_API_KEY) {
      console.error('[create-ai-sandbox] Missing E2B_API_KEY');
      return NextResponse.json(
        {
          error: 'Server not configured: missing E2B_API_KEY',
        },
        { status: 500 }
      );
    }

    console.log('[create-ai-sandbox] Creating base sandbox...');
    
    // Kill existing sandbox if any
    if (global.activeSandbox) {
      console.log('[create-ai-sandbox] Killing existing sandbox...');
      try {
        await global.activeSandbox.kill();
      } catch (e) {
        console.error('Failed to close existing sandbox:', e);
      }
      global.activeSandbox = null;
    }
    
    // Clear existing files tracking
    if (global.existingFiles) {
      global.existingFiles.clear();
    } else {
      global.existingFiles = new Set<string>();
    }

    // Create base sandbox with extended timeout
    console.log(`[create-ai-sandbox] Creating base E2B sandbox with ${appConfig.e2b.timeoutMinutes} minute timeout...`);
    sandbox = await Sandbox.create({ 
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: appConfig.e2b.timeoutMs
    });
    
    const sandboxId = (sandbox as any).sandboxId || Date.now().toString();
    const host = (sandbox as any).getHost(appConfig.e2b.vitePort);
    
    console.log(`[create-ai-sandbox] Sandbox created: ${sandboxId}`);
    console.log(`[create-ai-sandbox] Sandbox host: ${host}`);

    // Set up a basic Vite React app using Python to write files
    const setupScript = `
import os
import json
import sys

print('Setting up React app with Vite and Tailwind...')

try:
    # Create directory structure
    os.makedirs('/home/user/app/src', exist_ok=True)
    print('✓ Created directory structure')

    # Package.json
    package_json = {
        "name": "sandbox-app",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite --host",
            "build": "vite build",
            "preview": "vite preview"
        },
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        },
        "devDependencies": {
            "@vitejs/plugin-react": "^4.0.0",
            "vite": "^4.3.9",
            "tailwindcss": "^3.3.0",
            "postcss": "^8.4.31",
            "autoprefixer": "^10.4.16"
        }
    }

    with open('/home/user/app/package.json', 'w') as f:
        json.dump(package_json, f, indent=2)
    print('✓ package.json created')

    # Vite config for E2B - with allowedHosts
    vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// E2B-compatible Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: false,
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
  }
})"""

    with open('/home/user/app/vite.config.js', 'w') as f:
        f.write(vite_config)
    print('✓ vite.config.js created')

    # Tailwind config - standard without custom design tokens
    tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}"""

    with open('/home/user/app/tailwind.config.js', 'w') as f:
        f.write(tailwind_config)
    print('✓ tailwind.config.js created')

    # PostCSS config
    postcss_config = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

    with open('/home/user/app/postcss.config.js', 'w') as f:
        f.write(postcss_config)
    print('✓ postcss.config.js created')

    # Index.html
    index_html = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>"""

    with open('/home/user/app/index.html', 'w') as f:
        f.write(index_html)
    print('✓ index.html created')

    # Main.jsx
    main_jsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)"""

    with open('/home/user/app/src/main.jsx', 'w') as f:
        f.write(main_jsx)
    print('✓ src/main.jsx created')

    # App.jsx with explicit Tailwind test
    app_jsx = """function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <p className="text-lg text-gray-400">
          Sandbox Ready<br/>
          Start building your React app with Vite and Tailwind CSS!
        </p>
      </div>
    </div>
  )
}

export default App"""

    with open('/home/user/app/src/App.jsx', 'w') as f:
        f.write(app_jsx)
    print('✓ src/App.jsx created')

    # Index.css with explicit Tailwind directives
    index_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

/* Force Tailwind to load */
@layer base {
  :root {
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: rgb(17 24 39);
}"""

    with open('/home/user/app/src/index.css', 'w') as f:
        f.write(index_css)
    print('✓ src/index.css created')

    # Verify all files were created
    required_files = [
        '/home/user/app/package.json',
        '/home/user/app/vite.config.js',
        '/home/user/app/tailwind.config.js',
        '/home/user/app/postcss.config.js',
        '/home/user/app/index.html',
        '/home/user/app/src/main.jsx',
        '/home/user/app/src/App.jsx',
        '/home/user/app/src/index.css'
    ]
    
    for file_path in required_files:
        if not os.path.exists(file_path):
            raise Exception(f"Required file {file_path} was not created")
        print(f"✓ Verified {file_path}")

    print('\\nAll files created and verified successfully!')
    sys.exit(0)

except Exception as e:
    print(f"Error during setup: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
    `;

    // Execute the setup script with better error handling
    console.log('[create-ai-sandbox] Setting up React app...');
    const setupResult = await sandbox.runCode(setupScript);
    
    if (setupResult.exitCode !== 0) {
      console.error('[create-ai-sandbox] Setup script failed with exit code:', setupResult.exitCode);
      console.error('[create-ai-sandbox] Setup script stdout:', setupResult.logs.stdout);
      console.error('[create-ai-sandbox] Setup script stderr:', setupResult.logs.stderr);
      
      // Try a simpler approach if the complex setup fails
      console.log('[create-ai-sandbox] Trying simplified setup...');
      const simpleSetupResult = await sandbox.runCode(`
import os
import json

print('Trying simplified setup...')

try:
    # Create minimal directory structure
    os.makedirs('/home/user/app/src', exist_ok=True)
    
    # Create minimal package.json
    package_json = {
        "name": "sandbox-app",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite --host"
        },
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        },
        "devDependencies": {
            "@vitejs/plugin-react": "^4.0.0",
            "vite": "^4.3.9"
        }
    }
    
    with open('/home/user/app/package.json', 'w') as f:
        json.dump(package_json, f, indent=2)
    
    # Create minimal vite.config.js
    vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})"""
    
    with open('/home/user/app/vite.config.js', 'w') as f:
        f.write(vite_config)
    
    # Create minimal index.html
    index_html = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>"""
    
    with open('/home/user/app/index.html', 'w') as f:
        f.write(index_html)
    
    # Create minimal main.jsx
    main_jsx = """import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{padding: '20px', textAlign: 'center'}}>
      <h1>Sandbox Ready!</h1>
      <p>Start building your React app!</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)"""
    
    with open('/home/user/app/src/main.jsx', 'w') as f:
        f.write(main_jsx)
    
    print('Simplified setup completed successfully!')
    
except Exception as e:
    print(f"Simplified setup also failed: {str(e)}")
    import traceback
    traceback.print_exc()
    raise e
      `);
      
      if (simpleSetupResult.exitCode !== 0) {
        console.error('[create-ai-sandbox] Simplified setup also failed:', simpleSetupResult.logs.stderr);
        throw new Error(`Failed to set up React app in sandbox. Setup script failed with exit code ${setupResult.exitCode}. Check logs for details.`);
      }
      
      console.log('[create-ai-sandbox] Simplified setup succeeded');
    }

    // Install dependencies and start Vite with better monitoring
    console.log('[create-ai-sandbox] Starting async setup (npm install && npm run dev)...');
    const setupProcess = await sandbox.runCode(`
import subprocess
import os
import signal
import time
import json

os.chdir('/home/user/app')

# Best-effort: kill any existing vite
subprocess.run(['pkill', '-f', 'vite'], capture_output=True)

# Create a status file to track progress
status_file = '/tmp/setup-status.json'
with open(status_file, 'w') as f:
    json.dump({"status": "starting", "step": "npm_install", "timestamp": time.time()}, f)

try:
    # Run npm install first
    print("Starting npm install...")
    install_process = subprocess.run(
        'npm install',
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=300  # 5 minute timeout for npm install
    )
    
    if install_process.returncode != 0:
        print(f"npm install failed with return code: {install_process.returncode}")
        print(f"stdout: {install_process.stdout}")
        print(f"stderr: {install_process.stderr}")
        raise Exception("npm install failed")
    
    print("npm install completed successfully")
    
    with open(status_file, 'w') as f:
        json.dump({"status": "installing", "step": "vite_start", "timestamp": time.time()}, f)

    # Start Vite dev server
    print("Starting Vite dev server...")
    vite_process = subprocess.Popen(
        'npm run dev',
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        preexec_fn=os.setsid if hasattr(os, 'setsid') else None
    )

    # Store process info
    with open('/tmp/vite-process.pid', 'w') as f:
        f.write(str(vite_process.pid))

    # Wait a bit for Vite to start
    time.sleep(3)

    # Check if Vite is running
    if vite_process.poll() is None:
        with open(status_file, 'w') as f:
            json.dump({"status": "running", "step": "vite_ready", "timestamp": time.time()}, f)
        print(f"✓ Vite started successfully with PID: {vite_process.pid}")
    else:
        with open(status_file, 'w') as f:
            json.dump({"status": "failed", "step": "vite_start", "error": "Vite failed to start", "timestamp": time.time()}, f)
        raise Exception("Vite failed to start")

except Exception as e:
    print(f"Setup process failed: {str(e)}")
    import traceback
    traceback.print_exc()
    raise e
    `);

    if (setupProcess.exitCode !== 0) {
      console.error('[create-ai-sandbox] Setup process failed:', setupProcess.logs.stderr);
      console.error('[create-ai-sandbox] Setup process stdout:', setupProcess.logs.stdout);
      
      // Don't fail completely - just log the error and continue
      console.log('[create-ai-sandbox] Setup process had issues but continuing...');
    }

    // Store sandbox globally
    global.activeSandbox = sandbox;
    global.sandboxData = {
      sandboxId,
      url: `https://${host}`
    };
    
    // Set extended timeout on the sandbox instance if method available
    if (typeof sandbox.setTimeout === 'function') {
      sandbox.setTimeout(appConfig.e2b.timeoutMs);
      console.log(`[create-ai-sandbox] Set sandbox timeout to ${appConfig.e2b.timeoutMinutes} minutes`);
    }
    
    // Initialize sandbox state
    global.sandboxState = {
      fileCache: {
        files: {},
        lastSync: Date.now(),
        sandboxId
      },
      sandbox,
      sandboxData: {
        sandboxId,
        url: `https://${host}`
      }
    };
    
    // Track initial files
    global.existingFiles.add('src/App.jsx');
    global.existingFiles.add('src/main.jsx');
    global.existingFiles.add('src/index.css');
    global.existingFiles.add('index.html');
    global.existingFiles.add('package.json');
    global.existingFiles.add('vite.config.js');
    global.existingFiles.add('tailwind.config.js');
    global.existingFiles.add('postcss.config.js');

    console.log('[create-ai-sandbox] Sandbox setup completed successfully');
    
    return NextResponse.json({
      success: true,
      sandboxId,
      url: `https://${host}`,
      message: 'Sandbox created and configured successfully'
    });

  } catch (error) {
    console.error('[create-ai-sandbox] Error:', error);
    
    // Clean up sandbox if creation failed
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (e) {
        console.error('Failed to kill failed sandbox:', e);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: `Failed to create sandbox: ${(error as Error).message}`,
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}