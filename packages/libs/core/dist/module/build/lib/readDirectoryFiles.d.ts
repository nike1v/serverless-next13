import { Entry } from "fast-glob";
declare const readDirectoryFiles: (directory: string, ignorePatterns: string[]) => Promise<Array<Entry>>;
export default readDirectoryFiles;
