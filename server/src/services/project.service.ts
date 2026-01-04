import { Project, SyntaxKind } from "ts-morph";

class ProjectManager {
  private static instance: ProjectManager;
  private projects: Map<string, Project> = new Map();
  
  private constructor() {}
  
  static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }
  
  getOrCreateProject(projectName: string): Project {
    if (!this.projects.has(projectName)) {
      this.projects.set(projectName, new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
          target: 99,
          module: 99,
        },
      }));
    }
    return this.projects.get(projectName)!;
  }
  
  removeProject(projectName: string): void {
    this.projects.delete(projectName);
  }
}

export const projectManager = ProjectManager.getInstance();