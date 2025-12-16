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

        await axios.post(`${BACKEND_URL}/api/project/sync`, {
          projectName: path.basename(WORKSPACE_PATH),
          rootPath: WORKSPACE_PATH,
          files,
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

    // Folder created
    if (stat.isDirectory()) {
      await axios.post(`${BACKEND_URL}/api/file/create-folder`, {
        path: uri.fsPath,
        relativePath: path
          .relative(WORKSPACE_PATH, uri.fsPath)
          .replace(/\\/g, "/"),
      });
      return;
    }

    // File created
    const content = fs.readFileSync(uri.fsPath, "utf8");

    await axios.post(`${BACKEND_URL}/api/file/create`, {
      path: uri.fsPath,
      relativePath: path
        .relative(WORKSPACE_PATH, uri.fsPath)
        .replace(/\\/g, "/"),
      content,
      size: stat.size,
      lastModified: stat.mtime,
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

    await axios.post(`${BACKEND_URL}/api/file/update`, {
      path: uri.fsPath,
      relativePath: path
        .relative(WORKSPACE_PATH, uri.fsPath)
        .replace(/\\/g, "/"),
      content,
      size: stat.size,
      lastModified: stat.mtime,
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

    await axios.post(`${BACKEND_URL}/api/file/delete`, {
      path: uri.fsPath,
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
      list.push({
        path: path.relative(rootDir, fullPath).replace(/\\/g, "/"),
        fullPath,
        content: fs.readFileSync(fullPath, "utf8"),
        size: stat.size,
        lastModified: stat.mtime,
      });
    }
  }

  return list;
}

/**
 * Ignore unwanted files/folders
 */
function shouldIgnore(filePath) {
  const ignorePatterns = ["node_modules", ".git", ".vscode", "dist", "build"];

  return ignorePatterns.some((p) => filePath.includes(p));
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
 * Deactivate Extension
 */
function deactivate() {
  console.log("🛑 File Sync Extension Deactivated");
}

module.exports = {
  activate,
  deactivate,
};
