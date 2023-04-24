const fs = require('fs').promises;
const fsConstants = require('fs').constants;
const nodeUtil = require('util');
const fetch = require('node-fetch');
const exec = nodeUtil.promisify(require('child_process').exec);

const ExitCodes = {
    "RequestFailure": 1,
    "ParseFailure": 2,
    "ExecFailure": 3,
    "IOFailure": 4,
};

const LogFormat = {
    "Raw": 0,
    "JSON": 1,
};

const COMMITS_PER_PAGE = 150;
const API_DELAY_MSEC = 2500;
const API_MAX_RETRIES = 5;
const API_RATE_LIMIT = `
  rateLimit {
    limit
    cost
    nodeCount
    remaining
    resetAt
  }
`;

const EXEC_MAX_BUFFER = 1024 * 1024 * 32;

const GIT_HEAD_COMMIT_RE = RegExp("^commit ([a-zA-Z0-9-_]+)$");
const GIT_HEAD_MERGE_RE = RegExp("^Merge: (.+) (.+)$");
const GIT_HEAD_AUTHOR_RE = RegExp("^Author: (.+)$");
const GIT_HEAD_COMMITTER_RE = RegExp("^Commit: (.+)$");
const GIT_BODY_LINE_RE = RegExp("^[\\s]{2,}(.*)$");
const GIT_BODY_CHERRYPICK_RE = RegExp("^[\\s]{2,}\\(cherry picked from commit ([a-zA-Z0-9-_]+)\\)$");
const COMMIT_CHERRYPICK_RE = RegExp("^\\(cherry picked from commit ([a-zA-Z0-9-_]+)\\)$", "gm");

class DataFetcher {
    constructor(data_owner, data_repo) {
        this.data_owner = data_owner;
        this.data_repo = data_repo;

        this.repo_ssh_path = `git@github.com:${data_owner}/${data_repo}.git`;
        this.api_rest_path = `https://api.github.com/repos/${data_owner}/${data_repo}`;
        this.api_repository_id = `owner:"${data_owner}" name:"${data_repo}"`;
    }

    async _logResponse(data, name, format = LogFormat.JSON) {
        try {
            await ensureDir("./logs");

            let filename = `./logs/${name}`;
            let fileContent = "" + data;

            if (format === LogFormat.JSON) {
                filename = `./logs/${name}.json`;
                fileContent = JSON.stringify(data, null, 4);
            }

            await fs.writeFile(filename, fileContent, {encoding: "utf-8"});
        } catch (err) {
            console.error("    Error saving log file: " + err);
        }
    }

    _handleResponseErrors(queryID, res) {
        console.warn(`    Failed to get data from '${queryID}'; server responded with ${res.status} ${res.statusText}`);
        const retry_header = res.headers.get("Retry-After");
        if (retry_header) {
            console.log(`    Retry after: ${retry_header}`);
        }
    }

    _handleDataErrors(data) {
        if (typeof data["errors"] === "undefined") {
            return;
        }

        console.warn(`    Server handled the request, but there were errors:`);
        data.errors.forEach((item) => {
           console.log(`    [${item.type}] ${item.message}`);
        });
    }

    async delay(msec) {
        return new Promise(resolve => setTimeout(resolve, msec));
    }

    async checkoutRepo(fromTag, atCommit) {
        try {
            // Make sure that the temp folder exists and is empty.
            await ensureDir("./temp");
            await clearDir("./temp");

            // Checkout a shallow clone of the repository; we are only interested in its history.
            await exec(`git clone --filter=tree:0 --branch ${fromTag} --single-branch ${this.repo_ssh_path}`, { cwd: "./temp", maxBuffer: EXEC_MAX_BUFFER });
            if (fromTag !== atCommit) {
                await exec(`git reset --hard ${atCommit}`, { cwd: `./temp/${this.data_repo}`, maxBuffer: EXEC_MAX_BUFFER });
            }
        } catch (err) {
            console.error("    Error checking out a copy of the target repository: " + err);
            process.exitCode = ExitCodes.ExecFailure;
            return;
        }
    }

    async countCommitHistory(fromCommit, toCommit, repoFolder = "") {
        try {
            if (repoFolder === "") {
                repoFolder = `./temp/${this.data_repo}`;
            }
            const { stdout, stderr } = await exec(`git log --pretty=oneline ${fromCommit}..${toCommit}`, { cwd: repoFolder, maxBuffer: EXEC_MAX_BUFFER });

            const commitHistory = stdout.trimEnd();
            await this._logResponse(commitHistory, "_commit_shortlog", LogFormat.Raw);
            return commitHistory.split("\n").length;
        } catch (err) {
            console.error("    Error extracting the commit history: " + err);
            process.exitCode = ExitCodes.ExecFailure;
            return 0;
        }
    }

    async getCommitHistory(fromCommit, toCommit, repoFolder = "") {
        try {
            if (repoFolder === "") {
                repoFolder = `./temp/${this.data_repo}`;
            }
            const { stdout, stderr } = await exec(`git log --pretty=full ${fromCommit}..${toCommit}`, { cwd: repoFolder, maxBuffer: EXEC_MAX_BUFFER });

            const commitHistory = stdout;
            await this._logResponse(commitHistory, "_commit_history", LogFormat.Raw);
            return commitHistory;
        } catch (err) {
            console.error("    Error extracting the commit history: " + err);
            process.exitCode = ExitCodes.ExecFailure;
            return "";
        }
    }

    async fetchGithub(query, retries = 0) {
        const init = {};
        init.method = "POST";
        init.headers = {};
        init.headers["Content-Type"] = "application/json";
        if (process.env.GRAPHQL_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GRAPHQL_TOKEN}`;
        } else if (process.env.GITHUB_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
        }

        init.body = JSON.stringify({
            query,
        });

        let res = await fetch("https://api.github.com/graphql", init);
        let attempt = 0;
        while (res.status !== 200 && attempt < retries) {
            attempt += 1;
            console.log(`    Failed with status ${res.status}, retrying (${attempt}/${retries})...`);

            // GitHub API is flaky, so we add an extra delay to let it calm down a bit.
            await this.delay(API_DELAY_MSEC);
            res = await fetch("https://api.github.com/graphql", init);
        }

        return res;
    }

    async fetchGithubRest(query) {
        const init = {};
        init.method = "GET";
        init.headers = {};
        init.headers["Content-Type"] = "application/json";
        if (process.env.GRAPHQL_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GRAPHQL_TOKEN}`;
        } else if (process.env.GITHUB_TOKEN) {
            init.headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
        }

        return await fetch(`${this.api_rest_path}${query}`, init);
    }

    async checkRates() {
        try {
            const query = `
            query {
              ${API_RATE_LIMIT}
            }
            `;

            const res = await this.fetchGithub(query);
            if (res.status !== 200) {
                this._handleResponseErrors(this.api_repository_id, res);
                process.exitCode = ExitCodes.RequestFailure;
                return;
            }

            const data = await res.json();
            await this._logResponse(data, "_rate_limit");
            this._handleDataErrors(data);

            const rate_limit = data.data["rateLimit"];
            console.log(`    [$${rate_limit.cost}][${rate_limit.nodeCount}] Available API calls: ${rate_limit.remaining}/${rate_limit.limit}; resets at ${rate_limit.resetAt}`);
        } catch (err) {
            console.error("    Error checking the API rate limits: " + err);
            process.exitCode = ExitCodes.RequestFailure;
            return;
        }
    }

    _getCommitQuery(commitHash) {
        return `
          commit_${commitHash}: repository (${this.api_repository_id}) {
            object (expression: "${commitHash}") {
              ... on Commit {
                oid
                commitUrl

                messageHeadline
                messageBody

                authors(first: 12) {
                  edges {
                    node {
                      user {
                        login
                        avatarUrl
                        url
                        id
                      }
                    }
                  }
                }

                associatedPullRequests (first: 20) {
                  edges {
                    node {
                      id
                      number
                      url
                      title
                      state
                      isDraft

                      createdAt
                      updatedAt

                      baseRef {
                        name
                        repository {
                          nameWithOwner
                        }
                      }

                      author {
                        login
                        avatarUrl
                        url

                        ... on User {
                          id
                        }
                      }

                      labels (first: 12) {
                        edges {
                          node {
                            id
                            name
                            color
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `
    }

    async fetchCommits(commitHashes, page, totalPages) {
        try {
            const query = `
            query {
                ${API_RATE_LIMIT}

                ${commitHashes.map((item) => {
                    return this._getCommitQuery(item) + "\n";
                })}
              }
            `;

            console.log(`    Requesting batch ${page}/${totalPages} of commit and pull request data.`);

            const res = await this.fetchGithub(query, API_MAX_RETRIES);
            if (res.status !== 200) {
                this._handleResponseErrors(this.api_repository_id, res);
                process.exitCode = ExitCodes.RequestFailure;
                return [];
            }

            const data = await res.json();
            await this._logResponse(data, `data_commits`);
            this._handleDataErrors(data);

            let commit_data = {};
            for (let dataKey in data.data) {
                if (!dataKey.startsWith("commit_")) {
                    continue;
                }
                commit_data[dataKey.substring(7)] = data.data[dataKey].object;
            }

            const rate_limit = data.data["rateLimit"];
            console.log(`    [$${rate_limit.cost}][${rate_limit.nodeCount}] Retrieved ${Object.keys(commit_data).length} commits.`);
            console.log(`    --`);
            return commit_data;
        } catch (err) {
            console.error("    Error fetching pull request data: " + err);
            process.exitCode = ExitCodes.RequestFailure;
            return [];
        }
    }
}

class DataProcessor {
    constructor() {
        this.log = [];

        this.authors = {};
        this.commits = {};
        this.pulls = {};
    }

    _getCommitObject() {
        return {
            "hash": "",
            "is_merge": false,

            "authored_by": [],
            "author_raw": "",
            "committer_raw": "",

            "summary": "",
            "body": "",

            "is_cherrypick": false,
            "cherrypick_hash": "",

            "pull": "",
        };
    }

    _processAuthor(authorItem) {
        const author = {
            "id": "",
            "user": "ghost",
            "avatar": "https://avatars.githubusercontent.com/u/10137?v=4",
            "url": "https://github.com/ghost",

            "pull_count": 0,
            "commit_count": 0,
        };

        if (authorItem != null) {
            author["id"] = authorItem.id;
            author["user"] = authorItem.login;
            author["avatar"] = authorItem.avatarUrl;
            author["url"] = authorItem.url;
        }

        // Store the author if they haven't been stored.
        if (typeof this.authors[author.id] === "undefined") {
            this.authors[author.id] = author;
        }

        return author.id;
    }

    _processCherrypick(commit) {
        if (!commit.is_cherrypick) {
            return;
        }

        const originalCommit = this._getCommitObject();
        originalCommit.hash = commit.cherrypick_hash;
        originalCommit.author_raw = commit.author_raw;
        originalCommit.committer_raw = commit.author_raw;

        originalCommit.summary = commit.summary;
        originalCommit.body = commit.body.replace(COMMIT_CHERRYPICK_RE, "").trim();

        this.commits[originalCommit.hash] = originalCommit;
    }

    _finishCommit(commit) {
        commit.body = commit.body.trim();

        this.log.push(commit.hash);
        this.commits[commit.hash] = commit;

        if (commit.is_cherrypick) {
            this._processCherrypick(commit);
        }
    }

    processLog(logRaw, logSize) {
        // Parse the log, given in its "full" format. Records are presented in
        // the chronological order, line by line, with each record spanning across
        // several lines.
        // The general format for each record is as follows:
        //
        // commit COMMIT_HASH
        // Author: AUTHOR_NAME <AUTHOR_EMAIL>
        // Commit: COMMITTER_NAME <COMMITTER_EMAIL>
        //
        //     MESSAGE_HEADER
        //
        //     MESSAGE_BODY_MULTILINE
        //
        // The last line of the body can also be as follows, for cherry-picked commits:
        //
        //     (cherry picked from commit ORIGINAL_COMMIT_HASH)
        //

        // The most straightforward way to parse this format is to go line by line and check
        // if we reach one of the metadata lines.
        let logLines = logRaw.split("\n");
        let commit = null;

        while (logLines.length > 0) {
            const line = logLines.shift();

            // Check if the file starts with the first commit record.
            if (commit == null && !GIT_HEAD_COMMIT_RE.test(line)) {
                console.error("    Error parsing commit log: Invalid format.");
                process.exitCode = ExitCodes.ParseFailure;
                break;
            }

            // Start parsing a new commit; store the existing one if applicable.
            let matches = line.match(GIT_HEAD_COMMIT_RE);
            if (matches) {
                if (commit != null) {
                    this._finishCommit(commit);
                }

                commit = this._getCommitObject();
                commit.hash = matches[1];
                continue;
            }

            // Check if this is a merge commit.
            matches = line.match(GIT_HEAD_MERGE_RE);
            if (matches) {
                commit.is_merge = true;
                continue;
            }

            // Parse the authorship information.
            matches = line.match(GIT_HEAD_AUTHOR_RE);
            if (matches) {
                commit.author_raw = matches[1];
                continue;
            }
            matches = line.match(GIT_HEAD_COMMITTER_RE);
            if (matches) {
                commit.committer_raw = matches[1];
                continue;
            }

            // By this point we should have the entire header, or we're broken.
            if (commit.hash === "" || commit.author_raw === "" || commit.committer_raw === "") {
                console.error("    Error parsing commit log: Invalid format.");
                process.exitCode = ExitCodes.ParseFailure;
                break;
            }

            // Start parsing the body.
            matches = line.match(GIT_BODY_LINE_RE);

            // Look for the first line of the commit message, it's our summary.
            if (commit.summary === "") {
                if (!matches) {
                    continue;
                }

                commit.summary = matches[1];
                continue;
            }

            // Treat as an empty line.
            if (!matches) {
                commit.body += "\n";
                continue;
            }
            // Use the catch group to strip leading spaces.
            commit.body += `${matches[1]}\n`;

            // Check if this is a cherry-pick.
            matches = line.match(GIT_BODY_CHERRYPICK_RE);
            if (matches) {
                commit.is_cherrypick = true;
                commit.cherrypick_hash = matches[1];
            }
        }

        // Store the last commit.
        if (commit != null) {
            this._finishCommit(commit);
        }

        if (this.log.length !== logSize) {
            console.error(`    Error parsing commit log: Expected to received ${logSize} commits, but got ${this.log.length} instead.`);
            process.exitCode = ExitCodes.ParseFailure;
        }
    }

    processCommits(commitsRaw, targetRepo) {
        try {
            for (let commitHash in commitsRaw) {
                if (commitsRaw[commitHash] == null) {
                    console.warn(`    Requested data for a commit hash "${commitHash}", but received nothing.`);
                    continue;
                }
                if (typeof this.commits[commitHash] === "undefined") {
                    console.warn(`    Received data for a commit hash "${commitHash}", but this commit is unknown.`);
                    continue;
                }
                const item = commitsRaw[commitHash];
                const commit = this.commits[commitHash];

                // Commits can have multiple authors, we will list all of them. Also, associated PRs
                // can be authored by somebody else entirely. We will store them with the PR, and will
                // display them as well on the frontend.

                const commitAuthors = mapNodes(item.authors);
                commitAuthors.forEach((authorItem) => {
                    const authorId = this._processAuthor(authorItem.user);
                    commit.authored_by.push(authorId);
                    this.authors[authorId].commit_count++;
                });

                // Commits can have multiple PRs associated with them, so we need to be on the lookout
                // for rogue entries. Normally, it will always be one pull per commit (except for direct
                // commits, which will have none), but GitHub may sometimes link commits to PRs in other
                // repos/otherwise unrelated. So some form of filtering is required.

                const pullsRaw = mapNodes(item.associatedPullRequests)
                    .filter((pullData) => {
                        return pullData.baseRef && pullData.baseRef.repository.nameWithOwner === targetRepo;
                    });
                if (pullsRaw.length === 0) {
                    continue;
                }

                let pullItem = pullsRaw[0];
                commit.pull = pullItem.number;

                // Another commit is already linked to this PR.
                if (typeof this.pulls[pullItem.number] !== "undefined") {
                    this.pulls[pullItem.number].commits.push(commitHash);
                    continue;
                }

                // Compile basic information about a PR.
                let pr = {
                    "id": pullItem.id,
                    "public_id": pullItem.number,
                    "url": pullItem.url,
                    "diff_url": `${pullItem.url}.diff`,
                    "patch_url": `${pullItem.url}.patch`,

                    "title": pullItem.title,
                    "state": pullItem.state,
                    "is_draft": pullItem.isDraft,
                    "authored_by": null,
                    "created_at": pullItem.createdAt,
                    "updated_at": pullItem.updatedAt,

                    "target_branch": pullItem.baseRef.name,
                    "labels": [],

                    "commits": [ commitHash ],
                };
                this.pulls[pullItem.number] = pr;

                // Compose and link author information.
                const authorId = this._processAuthor(pullItem.author);
                pr.authored_by = authorId;
                this.authors[authorId].pull_count++;

                // Add labels, if available.
                let labels = mapNodes(pullItem.labels);
                labels.forEach((labelItem) => {
                    pr.labels.push({
                        "id": labelItem.id,
                        "name": labelItem.name,
                        "color": "#" + labelItem.color
                    });
                });
                pr.labels.sort((a, b) => {
                    if (a.name > b.name) return 1;
                    if (a.name < b.name) return -1;
                    return 0;
                });
            }
        } catch (err) {
            console.error("    Error parsing commit and pull request data: " + err);
            process.exitCode = ExitCodes.ParseFailure;
        }
    }

    getCommitHashes() {
        const commitHashes = [];

        for (let commitHash in this.commits) {
            const commit = this.commits[commitHash];
            if (commit.is_merge) {
                continue;
            }

            commitHashes.push(commitHash);
        }

        return commitHashes;
    }
}

class DataIO {
    constructor() {
        // Configurable parameters.
        this.data_owner = "godotengine";
        this.data_repo = "godot";
        this.data_version = "";

        this.skip_checkout = false;
        this.checkout_dir = "";

        //
        this.config = null;
        this.git_tag = "";
        this.first_commit = ""
        this.last_commit = "";
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

            if (arg === "skip-checkout") {
                this.skip_checkout = true;
            }
            if (arg.indexOf("dir:") === 0) {
                this.checkout_dir = arg.substring(4);
            }
        });

        if (this.data_owner === "" || this.data_repo === "" || this.data_version === "") {
            console.error("    Error reading command-line arguments: owner, repo, and version cannot be empty.");
            process.exitCode = ExitCodes.IOFailure;
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
            this.first_commit = this.config.from_ref;
            this.last_commit = this.config.ref;
        } catch (err) {
            console.error("    Error loading version config file: " + err);
            process.exitCode = ExitCodes.IOFailure;
            return;
        }
    }

    async saveData(output, fileName) {
        try {
            console.log("[*] Storing database to a file.");

            await ensureDir("./data");
            await fs.writeFile(`./data/${fileName}`, JSON.stringify(output), {encoding: "utf-8"});
        } catch (err) {
            console.error("    Error saving database file: " + err);
            process.exitCode = ExitCodes.IOFailure;
            return;
        }
    }
}

function mapNodes(object) {
    return object.edges.map((item) => item["node"])
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
            console.log(`   Terminating with an exit code ${process.exitCode}.`);
            process.exit();
        }
    };

    // Getting PRs between two commits is a complicated task, and must be done in
    // multiple steps. GitHub API does not have a method for that, so we must improvise.
    // We also need to consider that there is no easy way to fetch information for
    // an arbitrary list of commits; the API can work on ranges, but not on lists.
    //
    // We do not need to run this operation constantly. Release versions don't change.
    // (Though some metadata of PRs can change, so re-indexing should be possible, on
    // demand.)
    // We also have to preconfigure some information, e.g. manually supply the tags
    // or hashes, which serve as release boundaries.

    console.log("[*] Building local commit and pull request database.");

    const dataIO = new DataIO();
    dataIO.parseArgs();
    checkForExit();

    await dataIO.loadConfig();
    checkForExit();

    console.log(`[*] Configured for the "${dataIO.data_owner}/${dataIO.data_repo}" repository; version ${dataIO.data_version}.`);

    const dataFetcher = new DataFetcher(dataIO.data_owner, dataIO.data_repo);
    const dataProcessor = new DataProcessor();

    console.log("[*] Checking the rate limits before.");
    await dataFetcher.checkRates();
    checkForExit();

    // First, we checkout the repository for the specified branch/tag/hash. We will
    // use it to retrieve a clean commit log, ignoring merge commits. This step creates
    // as shallow copy, as we are only interested in the history of the branch.
    // Still, it extracts all of the current files, so it may take a bit of time.

    if (!dataIO.skip_checkout) {
        console.log(`[*] Checking out the repository at "${dataIO.last_commit}".`);
        await dataFetcher.checkoutRepo(dataIO.git_tag, dataIO.last_commit);
        checkForExit();
    }

    if (dataIO.checkout_dir !== "") {
        console.log(`[*] Using the local clone at "${dataIO.checkout_dir}".`);
    }

    console.log(`[*] Extracting the commit log between "${dataIO.first_commit}" and "${dataIO.last_commit}".`);
    const commitLogSize = await dataFetcher.countCommitHistory(dataIO.first_commit, dataIO.last_commit, dataIO.checkout_dir);
    const commitLog = await dataFetcher.getCommitHistory(dataIO.first_commit, dataIO.last_commit, dataIO.checkout_dir);
    checkForExit();

    // Second, we parse the extracted commit log, to generate a list of commit hashes
    // for the next step. We also try to extract the information about this being a
    // cherry-pick, and not the original commit. We can rely on the commit message body
    // containing a certain string, from which we can take the original commit hash.

    dataProcessor.processLog(commitLog, commitLogSize);
    checkForExit();

    // This method returns only non-merge commits; we don't need to fetch anything about
    // merge commits. We only need them for commit history.
    const commitHashes = dataProcessor.getCommitHashes();

    // Third, we generate a query to the GraphQL API to fetch the information about
    // linked PRs. GraphQL API doesn't have a filter to extract data for a list of
    // commit hashes, but it supports having multiple sub-queries within the same request,
    // which is our way in.
    //
    // While paginated queries are limited to 100 entries per page, sub-queries do not
    // appear to be similarly limited. We are still limited by the total number of nodes
    // we can theoretically fetch, which is 500 000. As such, we still want to do this
    // in batches, so the number of nodes in each request is manageable.

    console.log("[*] Fetching commit data from GitHub.");
    let commitsRaw = {};

    const totalPages = Math.ceil(commitHashes.length / COMMITS_PER_PAGE);
    // Pages are starting with 1 for better presentation.
    let page = 1;
    while (page <= totalPages) {
        const batchHashes = commitHashes.splice(0, COMMITS_PER_PAGE);
        const batchCommits = await dataFetcher.fetchCommits(batchHashes, page, totalPages);
        checkForExit();

        Object.assign(commitsRaw, batchCommits);
        page++;

        // Wait for a bit before proceeding to avoid hitting the secondary rate limit in GitHub API.
        // See https://docs.github.com/en/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits.
        await dataFetcher.delay(API_DELAY_MSEC);

        // Add an extra delay every few requests, because the chance to trigger the hidden rate issue
        // seems to grow with the number of queries.
        if (page % 8 === 0) {
            console.log("[*] Waiting a bit for the API to cool down...");
            await dataFetcher.delay(API_DELAY_MSEC * 4);
        }
    }

    // Fourth, we consolidate the information. Commits are populated with links to their
    // respective PRs, and PRs store references to their commits. We will save this to
    // a file for the specified range, which should be between two stable releases.
    //
    // For intermediate releases (developer previews) we have preconfigured hashes and
    // can simply pass them to the final data. Frontend will handle the rest.

    console.log(`[*] Processing ${Object.keys(commitsRaw).length} commits.`);
    dataProcessor.processCommits(commitsRaw, `${dataIO.data_owner}/${dataIO.data_repo}`);
    checkForExit();

    console.log("[*] Checking the rate limits after.")
    await dataFetcher.checkRates();
    checkForExit();

    console.log("[*] Finalizing database.")
    const output = {
        "generated_at": Date.now(),
        "log": dataProcessor.log,
        "authors": dataProcessor.authors,
        "commits": dataProcessor.commits,
        "pulls": dataProcessor.pulls,
    };

    await dataIO.saveData(output, `${dataIO.data_owner}.${dataIO.data_repo}.${dataIO.data_version}.json`);
    checkForExit();

    console.log("[*] Database built.");
}

main();
