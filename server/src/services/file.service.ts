import { FileData, Project } from "../types";
import { getIO } from "../socket";
import path from "path";

import { saveProjectDirectory } from "../utils/store-directory";
import { hasFileChanged } from "../utils/check-file-change.utils";
import { updateFileChunks } from "../utils/extract-update-file.chunks";
import { getSavedProject } from "../utils/get-project";

class FileService {
  private projects: Record<string, Project> = {};
  private fileIndex: Record<string, FileData[]> = {};

  syncProject(
    projectName: string,
    files: FileData[],
    srcFolder: string
  ): Project {
    const project: Project = {
      name: projectName,
      srcFolder,
      files,
      lastSynced: new Date(),
    };
    console.log(`Syncing project: ${projectName} with ${files.length} files`);
    saveProjectDirectory(project);
    this.projects[projectName] = project;
    this.updateFileIndex(projectName, files);

    const io = getIO();
    io.emit("projectSynced", { projectName, fileCount: files.length });

    return project;
  }

  getProject(projectName: string): Project | null {
    return this.projects[projectName] || null;
  }

  getProjectInfo() {
    return this.projects[0];
  }

  getAllProjects(): Array<{
    name: string;
    fileCount: number;
    lastSynced: Date;
  }> {
    return Object.keys(this.projects).map((name) => ({
      name,
      fileCount: this.projects[name].files.length,
      lastSynced: this.projects[name].lastSynced,
    }));
  }

  getSyncedProject(): {
    name: string;
    fileCount: number;
    lastSynced: Date;
  } | null {
    const projectsArray = Object.values(this.projects);

    if (projectsArray.length === 0) {
      return null;
    }

    const project = projectsArray[0];

    return {
      name: project.name,
      fileCount: project.files.length,
      lastSynced: project.lastSynced,
    };
  }

  createFile(fileData: {
    path: string;
    relativePath: string;
    content: string;
    size: number;
    lastModified: Date;
  }): void {
    Object.values(this.projects).forEach((project) => {
      project.files.push({
        path: fileData.relativePath,
        fullPath: fileData.path,
        content: fileData.content,
        size: fileData.size,
        lastModified: fileData.lastModified,
      });

      const io = getIO();
      io.emit("fileCreated", {
        project: project.name,
        path: fileData.relativePath,
        content: fileData.content,
        size: fileData.size,
        lastModified: fileData.lastModified,
      });
    });
  }

  createFolder(relativePath: string): void {
    Object.values(this.projects).forEach((project) => {
      const io = getIO();
      io.emit("folderCreated", {
        project: project.name,
        path: relativePath,
      });
    });
  }

  updateFile(fileData: {
    path: string;
    content: string;
    size: number;
    lastModified: Date;
  }): void {
    if (
      fileData.path.endsWith("data/chunks.json") ||
      fileData.path.includes("/data/chunks.json")
    ) {
      return;
    }

    Object.values(this.projects).forEach((project) => {
      const file = project.files.find((f) => f.fullPath === fileData.path);

      if (!file) return;
      const io = getIO();
      const changed = hasFileChanged(file, fileData);
      if (changed) {
        console.log(`🔄 File change detected for path: ${file.path}`);

        file.content = fileData.content;
        file.size = fileData.size;
        file.lastModified = fileData.lastModified;

        this.updateFileIndex(project.name, project.files);

        const relativePath = path.relative(project.srcFolder, file.path);

        updateFileChunks({
          projectName: project.name,
          srcFolder: project.srcFolder,
          filePath: file.path,
          relativePath,
          content: file.content,
        });
      }

      io.emit("fileUpdated", {
        project: project.name,
        path: file.path,
        content: fileData.content,
        size: fileData.size,
        lastModified: fileData.lastModified,
      });
    });
  }

  keepChange(fileData: { path: string; content: string }): boolean {
    const project = getSavedProject();
    if (!project?.name) return false;

    const oldFileContent =
      project.files.find((f) => f.path === fileData.path) || null;
    console.log(
      `file path:${fileData.path}\n ,new content:${fileData?.content},\n old content:${oldFileContent?.content}`
    );
    return true;
  }

  deleteFile(filePath: string): void {
    Object.values(this.projects).forEach((project) => {
      project.files = project.files.filter((f) => f.fullPath !== filePath);

      const io = getIO();
      io.emit("fileDeleted", {
        project: project.name,
        path: filePath,
      });
    });
  }

  getFile(projectName: string, filePath: string): FileData | null {
    const project = this.getProject(projectName);
    if (!project)  {
      throw new Error('Project not found')
    };
    const file= project.files.find((f) => f.fullPath === filePath) || null;
    return file
  }

  searchFiles(query: string, projectName?: string): Array<any> {
    const results: any[] = [];

    Object.keys(this.fileIndex).forEach((project) => {
      if (projectName && project !== projectName) return;

      this.fileIndex[project].forEach((file) => {
        const searchInContent = file.content
          .toLowerCase()
          .includes(query.toLowerCase());
        const searchInPath = file.path
          .toLowerCase()
          .includes(query.toLowerCase());

        if (searchInContent || searchInPath) {
          results.push({
            project,
            path: file.path,
            fullPath: file.fullPath,
            matchesInContent: searchInContent,
            matchesInPath: searchInPath,
            snippet: this.getSnippet(file.content, query),
            size: file.size,
          });
        }
      });
    });

    return results;
  }

  private updateFileIndex(projectName: string, files: FileData[]): void {
    this.fileIndex[projectName] = files.map((file) => ({
      ...file,
      content: file.content.toLowerCase(),
    }));
  }

  private getSnippet(content: string, query: string, context = 100): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return "";

    const start = Math.max(0, index - context);
    const end = Math.min(content.length, index + query.length + context);

    let snippet = content.substring(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet;
  }
}

export default new FileService();
