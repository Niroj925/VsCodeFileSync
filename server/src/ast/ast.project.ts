import { Project } from "ts-morph";
import path from "path";

export const astProject = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  skipAddingFilesFromTsConfig: false,
});
