const fs = require('fs').promises;
const fsConstants = require('fs').constants;

const ExitCodes = {
    "RequestFailure": 1,
    "ParseFailure": 2,
    "ExecFailure": 3,
    "IOFailure": 4,
};
exports.ExitCodes = ExitCodes;

async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath, fsConstants.R_OK | fsConstants.W_OK);
    } catch (err) {
        console.log(`    Folder at path ${dirPath} does not exit or is inaccessible, attempting to create...`);
        await fs.mkdir(dirPath);
    }
}
exports.ensureDir = ensureDir;

async function clearDir(rootPath) {
    try {
        const pathStat = await fs.stat(rootPath);
        if (!pathStat.isDirectory()) {
            return;
        }

        const removeDir = async (dirPath) => {
            const dirFiles = await fs.readdir(dirPath);
            for (let entryName of dirFiles) {
                if (entryName === "." || entryName === "..") {
                    continue;
                }

                const entryPath = `${dirPath}/${entryName}`;
                const entryStat = await fs.stat(entryPath);
                if (entryStat.isDirectory()) {
                    await removeDir(entryPath);
                    await fs.rmdir(entryPath);
                }
                else if (entryStat.isFile()) {
                    await fs.unlink(entryPath);
                }
            }
        };

        await removeDir(rootPath);
    } catch (err) {
        console.error(`    Error clearing a folder at ${rootPath}: ` + err);
        process.exitCode = ExitCodes.IOFailure;
        return;
    }
}
exports.clearDir = clearDir;
