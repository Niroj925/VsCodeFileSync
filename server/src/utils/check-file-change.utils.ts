
import { FileData } from "../types";

type IncomingFileUpdate = {
  content: string;
  size: number;
  lastModified: Date;
};

export function hasFileChanged(
  existingFile: FileData,
  incoming: IncomingFileUpdate
): boolean {
  if (existingFile.size !== incoming.size) return true;

  if (
    new Date(existingFile.lastModified).getTime() !==
    new Date(incoming.lastModified).getTime()
  ) {
    return true;
  }

  if (existingFile.content !== incoming.content) return true;

  return false;
}


