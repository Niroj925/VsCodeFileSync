const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

let BACKEND_URL = null;
let WORKSPACE_PATH = null;

/**
 * Activate Extension
 */
async function activate(context) {
  console.log("🔄 File Sync Extension Activated");

  const syncCommand = vscode.commands.registerCommand(
    "vscode-file-sync.syncProject",
    async () => {
      await initialProjectSync(context);
    }
  );

  context.subscriptions.push(syncCommand);
}

/**
 * Initial Project Sync
 */
async function initialProjectSync(context) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open");
      return;
    }

    WORKSPACE_PATH = workspaceFolders[0].uri.fsPath;

    BACKEND_URL = await vscode.window.showInputBox({
      prompt: "Enter backend URL",
      value: "http://localhost:5001",
    });

    if (!BACKEND_URL) return;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Syncing project...",
        cancellable: false,
      },
      async () => {
        const files = collectFiles(WORKSPACE_PATH, WORKSPACE_PATH);
        
        const projectName = path.basename(WORKSPACE_PATH);
        
        await axios.post(`${BACKEND_URL}/api/project/sync`, {
          projectName: projectName,
          files: files,
          path: WORKSPACE_PATH
        });

        vscode.window.showInformationMessage(
          `✅ Project synced (${files.length} files)`
        );

        startFileWatcher(context);
      }
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Sync failed: ${err.message}`);
  }
}

/**
 * File Watcher (Real-time Sync)
 */
function startFileWatcher(context) {
  const watcher = vscode.workspace.createFileSystemWatcher(
    "**/*",
    false,
    false,
    false
  );

  const debouncedUpdate = debounce(syncFileUpdate, 300);

  watcher.onDidChange((uri) => debouncedUpdate(uri));
  watcher.onDidDelete((uri) => syncFileDelete(uri));
  watcher.onDidCreate((uri) => syncFileCreate(uri));

  context.subscriptions.push(watcher);

  console.log("👀 File watcher started");
}

/**
 * Sync single file or folder create
 */
async function syncFileCreate(uri) {
  try {
    if (shouldIgnore(uri.fsPath)) return;

    const stat = fs.statSync(uri.fsPath);
    const relativePath = path
      .relative(WORKSPACE_PATH, uri.fsPath)
      .replace(/\\/g, "/");

    // Folder created
    if (stat.isDirectory()) {
      // NEW: Updated endpoint
      await axios.post(`${BACKEND_URL}/api/file/create-folder`, {
        relativePath: relativePath
      });
      return;
    }

    // File created
    const content = fs.readFileSync(uri.fsPath, "utf8");

    // NEW: Updated endpoint and payload
    await axios.post(`${BACKEND_URL}/api/file/create`, {
      path: uri.fsPath,
      relativePath: relativePath,
      content: content,
      size: stat.size,
      lastModified: stat.mtime
    });
  } catch (err) {
    console.error("Create sync failed:", err.message);
  }
}

/**
 * Sync single file update
 */
async function syncFileUpdate(uri) {
  try {
    if (shouldIgnore(uri.fsPath)) return;

    const content = fs.readFileSync(uri.fsPath, "utf8");
    const stat = fs.statSync(uri.fsPath);

    // NEW: Updated endpoint and payload
    await axios.post(`${BACKEND_URL}/api/file/update`, {
      path: uri.fsPath,
      content: content,
      size: stat.size,
      lastModified: stat.mtime
    });
  } catch (err) {
    console.error("Update sync failed:", err.message);
  }
}

/**
 * Sync file delete
 */
async function syncFileDelete(uri) {
  try {
    if (shouldIgnore(uri.fsPath)) return;

    // NEW: Updated endpoint and payload
    await axios.post(`${BACKEND_URL}/api/file/delete`, {
      path: uri.fsPath
    });
  } catch (err) {
    console.error("Delete sync failed:", err.message);
  }
}

/**
 * Collect all files (initial sync)
 */
function collectFiles(dir, rootDir, list = []) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    if (shouldIgnore(fullPath)) continue;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      collectFiles(fullPath, rootDir, list);
    } else {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        list.push({
          path: path.relative(rootDir, fullPath).replace(/\\/g, "/"),
          fullPath: fullPath,
          content: content,
          size: stat.size,
          lastModified: stat.mtime
        });
      } catch (err) {
        // Skip binary files
        console.log(`Skipping binary file: ${fullPath}`);
      }
    }
  }

  return list;
}

/**
 * Ignore unwanted files/folders
 */
function shouldIgnore(filePath) {
  const ignorePatterns = [
    "node_modules", 
    ".git", 
    ".vscode", 
    "dist", 
    "build",
    ".DS_Store",
    "package-lock.json",
    "yarn.lock"
  ];

  const fileName = path.basename(filePath);
  const isHidden = fileName.startsWith('.');
  
  return ignorePatterns.some((p) => 
    filePath.includes(p) || 
    fileName.includes(p)
  ) || isHidden;
}

/**
 * Debounce helper
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check backend health
 */
async function checkBackendHealth() {
  if (!BACKEND_URL) return false;
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/test`, {
      timeout: 3000
    });
    return response.data.success === true;
  } catch (err) {
    return false;
  }
}

/**
 * Test connection to backend
 */
async function testBackendConnection() {
  try {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      vscode.window.showInformationMessage("✅ Connected to backend server");
      return true;
    } else {
      vscode.window.showErrorMessage("❌ Cannot connect to backend server");
      return false;
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Connection test failed: ${err.message}`);
    return false;
  }
}

/**
 * Deactivate Extension
 */
function deactivate() {
  console.log("🛑 File Sync Extension Deactivated");
}

module.exports = {
  activate,
  deactivate,
};