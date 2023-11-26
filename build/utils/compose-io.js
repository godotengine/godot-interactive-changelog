const fs = require('fs').promises;
const fsConstants = require('fs').constants;

const buildCommon = require('./build-common.js');

class DataIO {
    constructor() {
        // Configurable parameters.
        this.data_owner = "godotengine";
        this.data_repo = "godot";
        this.data_version = "";

        this.checkout_dir = "";

        // Execution flags.
        this.update_data = false
        this.skip_checkout = false;
        this.skip_gitlog = false;
        this.skip_github = false;

        // Loaded configuration.
        this.config = null;

        this.git_tag = "";
        this.first_commit = ""
        this.last_commit = "";
        this.releases = [];
    }

    parseArgs() {
        process.argv.forEach((arg) => {
            if (arg.indexOf("owner:") === 0) {
                this.data_owner = arg.substring(6);
            }
            if (arg.indexOf("repo:") === 0) {
                this.data_repo = arg.substring(5);
            }
            if (arg.indexOf("version:") === 0) {
                this.data_version = arg.substring(8);
            }

            if (arg.indexOf("dir:") === 0) {
                this.checkout_dir = arg.substring(4);
            }

            if (arg === "update-data") {
                this.update_data = true;
            }
            if (arg === "skip-checkout") {
                this.skip_checkout = true;
            }
            if (arg === "skip-gitlog") {
                this.skip_gitlog = true;
            }
            if (arg === "skip-github") {
                this.skip_github = true;
            }
        });

        if (this.data_owner === "" || this.data_repo === "" || this.data_version === "") {
            console.error("    Error reading command-line arguments: owner, repo, and version cannot be empty.");
            process.exitCode = buildCommon.ExitCodes.IOFailure;
            return;
        }
    }

    async loadConfig() {
        try {
            console.log("[*] Loading version configuration from a file.");

            const configPath = `./configs/${this.data_owner}.${this.data_repo}.${this.data_version}.json`;
            await fs.access(configPath, fsConstants.R_OK);
            const configContent = await fs.readFile(configPath);

            this.config = JSON.parse(configContent);

            this.git_tag = this.config.git_tag || this.config.ref;
            this.first_commit = this.config.from_ref || "";
            this.last_commit = this.config.ref || "";
            this.releases = this.config.releases || [];
        } catch (err) {
            console.error("    Error loading version config file: " + err);
            process.exitCode = buildCommon.ExitCodes.IOFailure;
            return;
        }
    }

    async loadData(fileName) {
        try {
            console.log("[*] Loading version database from a file.");

            await buildCommon.ensureDir("./data");
            const databasePath = `./data/${fileName}`;
            await fs.access(databasePath, fsConstants.R_OK);
            const dataContent = await fs.readFile(databasePath);

            return JSON.parse(dataContent);
        } catch (err) {
            console.error("    Error loading version database file: " + err);
            process.exitCode = buildCommon.ExitCodes.IOFailure;
            return null;
        }
    }

    async saveData(fileName, dataObject) {
        try {
            console.log("[*] Storing version database to a file.");

            await buildCommon.ensureDir("./data");
            await fs.writeFile(`./data/${fileName}`, JSON.stringify(dataObject), {encoding: "utf-8"});
        } catch (err) {
            console.error("    Error saving version database file: " + err);
            process.exitCode = buildCommon.ExitCodes.IOFailure;
            return;
        }
    }
}

module.exports = DataIO;
