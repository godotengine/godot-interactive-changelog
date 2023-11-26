const fs = require('fs').promises;
const fsConstants = require('fs').constants;

const buildCommon = require('./build/utils/build-common.js');

async function publishData() {
    try {
        console.log("[*] Copying pre-generated data files.");
        const sourcePath = "./data";
        const targetPath = "./out/data";
        await buildCommon.ensureDir(targetPath);

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

            // Resaving the data entry without extra spaces as a way to compress it a bit.

            await fs.access(entryPath, fsConstants.R_OK);
            const entryContent = await fs.readFile(entryPath, { encoding: 'utf-8' });
            const entry = JSON.parse(entryContent);

            const copyPath = `${targetPath}/${sourceName}`;
            await fs.writeFile(copyPath, JSON.stringify(entry), { encoding: 'utf-8' });

            file_count++;
        }

        console.log(`    Published ${file_count} data files.`);
    } catch (err) {
        console.error(`    Error publishing data files: ` + err);
        process.exitCode = buildCommon.ExitCodes.IOFailure;
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
            const configContent = await fs.readFile(configPath, { encoding: 'utf-8' });

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
        await buildCommon.ensureDir(targetPath);

        // Comparing strings is kind of meh, so we turn them into numeric values.
        const envalueVersion = (versionString) => {
            let value = 0;
            const versionBits = versionString.split(".");
            while (versionBits.length < 4) {
                // Make sure we have exactly 4 values in the version. Normally Godot
                // versions are either X.Y or X.Y.Z, but there are exceptions, so we
                // normalize the size to match them.
                versionBits.push("0");
            }

            let i = 0;
            while (versionBits.length > 0) {
                value += parseInt(versionBits.pop(), 10) * Math.pow(100, i);
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
        process.exitCode = buildCommon.ExitCodes.IOFailure;
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
    await buildCommon.ensureDir("./out");

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
