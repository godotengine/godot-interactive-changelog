const fs = require('fs').promises;
const fsConstants = require('fs').constants;

const ExitCodes = {
    "ParseFailure": 2,
    "IOFailure": 4,
};

async function publishData() {
    try {
        console.log("[*] Copying pre-generated data files.");
        const sourcePath = "./data";
        const targetPath = "./out/data";
        await ensureDir(targetPath);

        const pathStat = await fs.stat(sourcePath);
        if (!pathStat.isDirectory()) {
            return;
        }

        let file_count = 0;

        const sourceFiles = await fs.readdir(sourcePath);
        for (let sourceName of sourceFiles) {
            if (sourceName === "." || sourceName === ".." || !sourceName.endsWith(".json")) {
                continue;
            }

            const entryPath = `${sourcePath}/${sourceName}`;
            const entryStat = await fs.stat(entryPath);
            if (!entryStat.isFile()) {
                continue;
            }

            const copyPath = `${targetPath}/${sourceName}`;
            await fs.copyFile(entryPath, copyPath);
            file_count++;
        }

        console.log(`    Published ${file_count} data files.`);
    } catch (err) {
        console.error(`    Error publishing data files: ` + err);
        process.exitCode = ExitCodes.IOFailure;
        return;
    }
}

async function publishConfigs() {
    try {
        console.log("[*] Reading existing version configs.");
        const sourcePath = "./configs";
        const pathStat = await fs.stat(sourcePath);
        if (!pathStat.isDirectory()) {
            return;
        }

        // Read all configs and store them in a collection.
        let loadedConfigs = {};
        let config_count = 0;

        const sourceFiles = await fs.readdir(sourcePath);
        for (let sourceName of sourceFiles) {
            if (sourceName === "." || sourceName === ".." || !sourceName.endsWith(".json")) {
                continue;
            }

            const nameBits = sourceName.substring(0, sourceName.length - 5).split(".", 3);
            if (nameBits.length !== 3) {
                continue;
            }

            const configPath = `${sourcePath}/${sourceName}`;
            const entryStat = await fs.stat(configPath);
            if (!entryStat.isFile()) {
                continue;
            }

            await fs.access(configPath, fsConstants.R_OK);
            const configContent = await fs.readFile(configPath);
            
            const config = JSON.parse(configContent);
            const [ config_owner, config_repo ] = nameBits;

            if (typeof loadedConfigs[config_owner] === "undefined") {
                loadedConfigs[config_owner] = {};
            }
            if (typeof loadedConfigs[config_owner][config_repo] === "undefined") {
                loadedConfigs[config_owner][config_repo] = {};
            }

            loadedConfigs[config_owner][config_repo][config.name] = config;
            config_count++;
        }
        console.log(`    Found ${config_count} config files.`);

        console.log("[*] Saving unified version configs.");
        const targetPath = "./out/data";
        await ensureDir(targetPath);

        // Comparing strings is kind of meh, so we turn them into numeric values.
        const envalueVersion = (versionString) => {
            let value = 0;
            const versionBits = versionString.split(".");

            let i = 0;
            while (versionBits.length > 0) {
                value += versionBits.pop() * Math.pow(100, i);
                i++;
            }

            return value;
        };

        // Iterate through loaded configs, sort them, and write them to a unified
        // file.
        for (let config_owner in loadedConfigs) {
            for (let config_repo in loadedConfigs[config_owner]) {
                const versions = loadedConfigs[config_owner][config_repo];
                const versionNumbers = Object.keys(versions);

                versionNumbers.sort((a,b) => {
                    const av = envalueVersion(a);
                    const bv = envalueVersion(b);

                    if (av > bv) return -1;
                    if (bv > av) return 1;
                    return 0;
                });

                let configBundle = [];
                for (let versionNumber of versionNumbers) {
                    versions[versionNumber].releases.reverse();
                    configBundle.push(versions[versionNumber]);
                }

                await fs.writeFile(`./out/data/${config_owner}.${config_repo}.versions.json`, JSON.stringify(configBundle), {encoding: "utf-8"})
                console.log(`    Published version config for "${config_owner}/${config_repo}".`);
            }
        }
    } catch (err) {
        console.error(`    Error publishing version configs: ` + err);
        process.exitCode = ExitCodes.IOFailure;
        return;
    }
}

async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath, fsConstants.R_OK | fsConstants.W_OK);
    } catch (err) {
        await fs.mkdir(dirPath);
    }
}

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

async function main() {
    // Internal utility methods.
    const checkForExit = () => {
        if (process.exitCode > 0) {
            process.exit();
        }
    };

    console.log("[*] Publishing local commit and pull request database.");
    await ensureDir("./out");

    // First, we copy all data files that are available to the output directory.
    await publishData();
    checkForExit();

    // Second, we load every version config, group them by the data source and
    // publish a unified single-file version for each owner and repo.
    await publishConfigs();
    checkForExit();

    console.log("[*] Database published.");
}

main();
