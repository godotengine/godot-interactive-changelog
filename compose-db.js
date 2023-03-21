const fs = require('fs').promises;
const fsConstants = require('fs').constants;
const nodeUtil = require('util');
const fetch = require('node-fetch');
const exec = nodeUtil.promisify(require('child_process').exec);

const ExitCodes = {
    "RequestFailure": 1,
    "ParseFailure": 2,
    "ExecFailure": 3,
};

const LogFormat = {
    "Raw": 0,
    "JSON": 1,
};

const ITEMS_PER_PAGE = 100;
const API_RATE_LIMIT = `
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
`;

const GIT_HEAD_COMMIT_RE = RegExp("^commit ([a-zA-Z0-9-_]+)$");
const GIT_HEAD_AUTHOR_RE = RegExp("^Author: (.+)$");
const GIT_HEAD_COMMITTER_RE = RegExp("^Commit: (.+)$");
const GIT_BODY_LINE_RE = RegExp("^[\s]{2,}(.*)$");
const GIT_BODY_CHERRYPICK_RE = RegExp("^[\s]{2,}\(cherry picked from commit ([a-zA-Z0-9-_]+)\)$");

class DataFetcher {
    constructor(data_owner, data_repo) {
        this.data_owner = data_owner;
        this.data_repo = data_repo;

        this.repo_ssh_path = `git@github.com:${data_owner}/${data_repo}.git`;
        this.api_rest_path = `https://api.github.com/repos/${data_owner}/${data_repo}`;
        this.api_repository_id = `owner:"${data_owner}" name:"${data_repo}"`;

        this.page_count = 1;
        this.last_cursor = "";
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
            console.error("Error saving log file: " + err);
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

    async checkoutRepo(atCommit) {
        try {
            // Make sure that the temp folder exists and is empty.
            await ensureDir("./temp");
            await clearDir("./temp");

            // Checkout a shallow clone of the repository; we are only interested in its history.
            await exec(`git clone --filter=tree:0 --branch ${atCommit} --single-branch ${this.repo_ssh_path}`, { cwd: "./temp" });
        } catch (err) {
            console.error("    Error checking out a copy of the target repository: " + err);
            process.exitCode = ExitCodes.ExecFailure;
            return;
        }
    }

    async countCommitHistory(fromCommit, toCommit) {
        try {
            const { stdout, stderr } = await exec(`git log --pretty=oneline --no-merges ${fromCommit}..${toCommit}`, { cwd: `./temp/${this.data_repo}` });

            const commitHistory = stdout.trimEnd();
            await this._logResponse(commitHistory, "_commit_shortlog", LogFormat.Raw);
            return commitHistory.split("\n").length;
        } catch (err) {
            console.error("    Error extracting the commit history: " + err);
            process.exitCode = ExitCodes.ExecFailure;
            return 0;
        }
    }

    async getCommitHistory(fromCommit, toCommit) {
        try {
            const { stdout, stderr } = await exec(`git log --pretty=full --no-merges ${fromCommit}..${toCommit}`, { cwd: `./temp/${this.data_repo}` });

            const commitHistory = stdout;
            await this._logResponse(commitHistory, "_commit_history", LogFormat.Raw);
            return commitHistory;
        } catch (err) {
            console.error("    Error extracting the commit history: " + err);
            process.exitCode = ExitCodes.ExecFailure;
            return "";
        }
    }

    async fetchGithub(query) {
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
    
        return await fetch("https://api.github.com/graphql", init);
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
            console.log(`    [$${rate_limit.cost}] Available API calls: ${rate_limit.remaining}/${rate_limit.limit}; resets at ${rate_limit.resetAt}`);
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

                author {
                  user {
                    login
                    avatarUrl
                    url
                    id
                  }
                }

                associatedPullRequests (first: 100) {
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
                      }

                      author {
                        login
                        avatarUrl
                        url

                        ... on User {
                          id
                        }
                      }

                      milestone {
                        id
                        title
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        `
    }

    async fetchCommits(commitHashes) {
        try {
            const query = `
            query {
                ${API_RATE_LIMIT}

                ${commitHashes.map((item) => {
                    return this._getCommitQuery(item) + "\n";
                })}
              }
            `;

            console.log(`    Requesting a batch of ${commitHashes.length} commits.`);
    
            const res = await this.fetchGithub(query);
            if (res.status !== 200) {
                this._handleResponseErrors(this.api_repository_id, res);
                process.exitCode = ExitCodes.RequestFailure;
                return [];
            }

            const data = await res.json();
            await this._logResponse(data, `data_commits`);
            this._handleDataErrors(data);

            const rate_limit = data.data["rateLimit"];

            let commit_data = {};
            for (let dataKey in data.data) {
                if (!dataKey.startsWith("commit_")) {
                    continue;
                }
                commit_data[dataKey.substring(7)] = data.data[dataKey];
            }

            console.log(`    [$${rate_limit.cost}] Retrieved ${commit_data.length} commits; processing...`);
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
        this.authors = {};
        this.commits = {};
        this.pulls = [];
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
                    this.commits[commit.hash] = commit;
                }

                commit = {
                    "hash": matches[1],
                    "author": "",
                    "committer": "",
                    
                    "summary": "",
                    "body": "",

                    "is_cherrypick": false,
                    "cherrypick_hash": "",
                };
                continue;
            }

            // Parse the authorship information.
            matches = line.match(GIT_HEAD_AUTHOR_RE);
            if (matches) {
                commit.author = matches[1];
                continue;
            }
            matches = line.match(GIT_HEAD_COMMITTER_RE);
            if (matches) {
                commit.committer = matches[1];
                continue;
            }

            // By this point we should have the entire header, or we're broken.
            if (commit.hash === "" || commit.author === "" || commit.committer === "") {
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
            this.commits[commit.hash] = commit;
        }

        let commitHashes = Object.keys(this.commits);
        if (commitHashes.length !== logSize) {
            console.error(`    Error parsing commit log: Expected to received ${logSize} commits, but got ${commitHashes.length} instead.`);
            process.exitCode = ExitCodes.ParseFailure;
        }

        return commitHashes;
    }

    processCommits(commitsRaw) {
        try {
            commitsRaw.forEach((item) => {
                // Commits can have multiple PRs associated with them, so we need to be on the lookout
                // for rogue entries. Normally, it will always be one pull per commit (except for direct
                // commits, which will have none), but GitHub may sometimes link commits to PRs in other
                // repos/otherwise unrelated. So some form of filtering is required.

                const pullsRaw = mapNodes(item.associatedPullRequests);
                const pullItem = pullsRaw[0];

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
                    "milestone": null,
                };

                // Store the target branch if it hasn't been stored.
                if (!this.branches.includes(pr.target_branch)) {
                    this.branches.push(pr.target_branch);
                }

                // Compose and link author information.
                const author = {
                    "id": "",
                    "user": "ghost",
                    "avatar": "https://avatars.githubusercontent.com/u/10137?v=4",
                    "url": "https://github.com/ghost",
                    "pull_count": 0,
                };
                if (pullItem.author != null) {
                    author["id"] = pullItem.author.id;
                    author["user"] = pullItem.author.login;
                    author["avatar"] = pullItem.author.avatarUrl;
                    author["url"] = pullItem.author.url;
                }
                pr.authored_by = author.id;

                // Store the author if they haven't been stored.
                if (typeof this.authors[author.id] === "undefined") {
                    this.authors[author.id] = author;
                }
                this.authors[author.id].pull_count++;

                // Add the milestone, if available.
                if (pullItem.milestone) {
                    pr.milestone = {
                        "id": pullItem.milestone.id,
                        "title": pullItem.milestone.title,
                        "url": pullItem.milestone.url,
                    };
                }

                this.pulls.push(pr);
            });
        } catch (err) {
            console.error("    Error parsing pull request data: " + err);
            process.exitCode = ExitCodes.ParseFailure;
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
        // ..
    }
}

async function main() {
    // Internal utility methods.
    const checkForExit = () => {
        if (process.exitCode > 0) {
            process.exit();
        }
    };
    const delay = async (msec) => {
        return new Promise(resolve => setTimeout(resolve, msec));
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

    console.log("[*] Building local pull request database.");

    // Configurable properties.
    let data_owner = "godotengine";
    let data_repo = "godot";
    let first_commit = "4.0-stable"
    let last_commit = "4.0.1-stable";

    let skip_checkout = false;

    process.argv.forEach((arg) => {
        if (arg.indexOf("owner:") === 0) {
            data_owner = arg.substring(6);
        }
        if (arg.indexOf("repo:") === 0) {
            data_repo = arg.substring(5);
        }

        if (arg === "skip-checkout") {
            skip_checkout = true;
        }
    });

    console.log(`[*] Configured for the "${data_owner}/${data_repo}" repository.`);
    const dataFetcher = new DataFetcher(data_owner, data_repo);
    const dataProcessor = new DataProcessor();

    console.log("[*] Checking the rate limits before.");
    await dataFetcher.checkRates();
    checkForExit();

    // First, we checkout the repository for the specified branch/tag/hash. We will
    // use it to retrieve a clean commit log, ignoring merge commits. This step creates
    // as shallow copy, as we are only interested in the history of the branch.
    // Still, it extracts all of the current files, so it may take a bit of time.

    if (!skip_checkout) {
        console.log(`[*] Checking out the repository at "${last_commit}".`);
        await dataFetcher.checkoutRepo(last_commit);
        checkForExit();
    }

    console.log(`[*] Extracting the commit log between "${first_commit}" and "${last_commit}".`);
    const commitLogSize = await dataFetcher.countCommitHistory(first_commit, last_commit);
    const commitLog = await dataFetcher.getCommitHistory(first_commit, last_commit);
    checkForExit();

    // Second, we parse the extracted commit log, to generate a list of commit hashes
    // for the next step. We also try to extract the information about this being a
    // cherry-pick, and not the original commit. We can rely on the commit message body
    // containing a certain string, from which we can take the original commit hash.

    const commitHashes = dataProcessor.processLog(commitLog, commitLogSize);
    checkForExit();

    // Third, we generate a query to the GraphQL API to fetch the information about
    // linked PRs. GraphQL API supports having multiple sub-queries, which can be our
    // gateway to fetching the data for a list of specific hashes.
    // 
    // This needs to be tested to see if it would blow our API rate budget, or not.
    // It's also unclear whether this feature is limited to a certain number of subqueries
    // (say, 100), or not. We may need to do it in batches, as we do with paginated
    // queries.

    console.log("[*] Fetching commit data from GitHub.");
    // Pages are starting with 1 for better presentation.
    let page = 1;
    while (page <= dataFetcher.page_count) {
        //const commitsRaw = await dataFetcher.fetchCommits(page);
        //checkForExit();
        page++;

        // Wait for a bit before proceeding to avoid hitting the secondary rate limit in GitHub API.
        // See https://docs.github.com/en/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits.
        await delay(1500);
    }

    // Fourth, we consolidate the information. Each run is performed on a certain range
    // of branches/tags/hashes, and so we store the information we receive in files
    // associated with this range. This process can be optimized by only working with
    // smaller ranges, and composing bigger ranges out of them (e.g. using hashes for
    // X.Y beta 1 and X.Y beta 2, and then X.Y beta 2 and X.Y beta 3, and then generating
    // a complete list for X.Y-1 and X.Y on the frontend).

    console.log("[*] Checking the rate limits after.")
    await dataFetcher.checkRates();
    checkForExit();

    console.log("[*] Finalizing database.")
    const output = {
        "generated_at": Date.now(),
        "authors": dataProcessor.authors,
        "pulls": dataProcessor.pulls,
    };

    try {
        console.log("[*] Storing database to file.");

        await ensureDir("./out");
        await fs.writeFile(`./out/${data_owner}.${data_repo}.data.json`, JSON.stringify(output), {encoding: "utf-8"});
        console.log("[*] Database built.");
    } catch (err) {
        console.error("Error saving database file: " + err);
    }
}

main();
