import fs from "fs-extra";
import path from "path";
function getCustomData(importName) {
    return `
module.exports = function(...args) {
  let original = require('./${importName}');
  const finalConfig = {};
  if (typeof original === 'function' && original.constructor.name === 'AsyncFunction') {
    // AsyncFunctions will become promises
    original = original(...args);
  }
  if (original instanceof Promise) {
    // Special case for promises, as it's currently not supported
    // and will just error later on
    return original
      .then((originalConfig) => Object.assign(finalConfig, originalConfig));
  } else if (typeof original === 'function') {
    Object.assign(finalConfig, original(...args));
  } else if (typeof original === 'object') {
    Object.assign(finalConfig, original);
  }
  return finalConfig;
}
  `.trim();
}
export default async function createServerlessConfig(workPath, entryPath, useServerlessTraceTarget) {
    const primaryConfigPath = path.join(entryPath, "next.config.js");
    const secondaryConfigPath = path.join(workPath, "next.config.js");
    const backupConfigName = `next.config.original.${Date.now()}.js`;
    const hasPrimaryConfig = fs.existsSync(primaryConfigPath);
    const hasSecondaryConfig = fs.existsSync(secondaryConfigPath);
    let configPath;
    let backupConfigPath;
    if (hasPrimaryConfig) {
        // Prefer primary path
        configPath = primaryConfigPath;
        backupConfigPath = path.join(entryPath, backupConfigName);
    }
    else if (hasSecondaryConfig) {
        // Work with secondary path (some monorepo setups)
        configPath = secondaryConfigPath;
        backupConfigPath = path.join(workPath, backupConfigName);
    }
    else {
        // Default to primary path for creation
        configPath = primaryConfigPath;
        backupConfigPath = path.join(entryPath, backupConfigName);
    }
    const configPathExists = fs.existsSync(configPath);
    if (configPathExists) {
        await fs.rename(configPath, backupConfigPath);
        await fs.writeFile(configPath, getCustomData(backupConfigName));
    }
    return {
        restoreUserConfig: async () => {
            const needToRestoreUserConfig = configPathExists;
            await fs.remove(configPath);
            if (needToRestoreUserConfig) {
                await fs.rename(backupConfigPath, configPath);
            }
        }
    };
}
