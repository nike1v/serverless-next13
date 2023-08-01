import fse from "fs-extra";
import path from "path";
import glob from "fast-glob";
import normalizePath from "normalize-path";
const readDirectoryFiles = async (directory, ignorePatterns) => {
    const directoryExists = fse.pathExistsSync(directory);
    if (!directoryExists) {
        return [];
    }
    // fast-glob only accepts posix paths so we normalize it
    const normalizedDirectory = normalizePath(directory);
    return await glob(path.posix.join(normalizedDirectory, "**", "*"), {
        onlyFiles: true,
        stats: true,
        dot: true,
        ignore: ignorePatterns
    });
};
export default readDirectoryFiles;
