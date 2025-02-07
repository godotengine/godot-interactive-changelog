const fs = require('fs').promises;
const { graphql } = require('@octokit/graphql');
const nodeUtil = require('util');
const exec = nodeUtil.promisify(require('child_process').exec);

const buildCommon = require('./build-common.js');

const LogFormat = {
    "Raw": 0,
    "JSON": 1,
};

const API_DELAY_MSEC = 2500;
const API_MAX_RETRIES = 10;
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

const graphqlWithAuth = graphql.defaults({
    headers: {
        authorization: process.env.GRAPHQL_TOKEN
            ? `token ${process.env.GRAPHQL_TOKEN}`
            : `token ${process.env.GITHUB_TOKEN}`,
    },
});

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
            await buildCommon.ensureDir("./logs");

            let filename = `./logs/${name}`;
            let fileContent = "" + data;

            if (format === LogFormat.JSON) {
                filename = `./logs/${name}.json`;
                fileContent = JSON.stringify(data, null, 4);
            }

            await fs.writeFile(filename, fileContent, { encoding: 'utf-8' });
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
            await buildCommon.ensureDir("./temp");
            await buildCommon.clearDir("./temp");

            // Checkout a shallow clone of the repository; we are only interested in its history.
            await exec(`git clone --filter=tree:0 --branch ${fromTag} --single-branch ${this.repo_ssh_path}`, { cwd: "./temp", maxBuffer: EXEC_MAX_BUFFER });
            if (fromTag !== atCommit) {
                await exec(`git reset --hard ${atCommit}`, { cwd: `./temp/${this.data_repo}`, maxBuffer: EXEC_MAX_BUFFER });
            }
        } catch (err) {
            console.error("    Error checking out a copy of the target repository: " + err);
            process.exitCode = buildCommon.ExitCodes.ExecFailure;
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

            if (commitHistory === "") {
                return 0;
            }
            return commitHistory.split("\n").length;
        } catch (err) {
            console.error("    Error extracting the commit history: " + err);
            process.exitCode = buildCommon.ExitCodes.ExecFailure;
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
            process.exitCode = buildCommon.ExitCodes.ExecFailure;
            return "";
        }
    }

    async getCommitsBetween(fromCommit, toCommit, repoFolder = "") {
        try {
            if (repoFolder === "") {
                repoFolder = `./temp/${this.data_repo}`;
            }
            const { stdout, stderr } = await exec(`git log --pretty=format:"%H" ${fromCommit}..${toCommit}`, { cwd: repoFolder, maxBuffer: EXEC_MAX_BUFFER });

            const commitHashes = stdout;
            await this._logResponse(commitHashes, "_commit_hashes", LogFormat.Raw);

            if (commitHashes === "") {
                return [];
            }
            return commitHashes.split("\n");
        } catch (err) {
            console.error("    Error extracting the commit history: " + err);
            process.exitCode = buildCommon.ExitCodes.ExecFailure;
            return [];
        }
    }

    async fetchGithub(query, retries = 0) {
        return await graphqlWithAuth(query);
    }

    async checkRates() {
        try {
            const query = `
            query {
              ${API_RATE_LIMIT}
            }
            `;

            const data = await this.fetchGithub(query);
            await this._logResponse(data, "_rate_limit");
            this._handleDataErrors(data);

            const rate_limit = data["rateLimit"];
            console.log(`    [$${rate_limit.cost}][${rate_limit.nodeCount}] Available API calls: ${rate_limit.remaining}/${rate_limit.limit}; resets at ${rate_limit.resetAt}`);
        } catch (err) {
            console.error("    Error checking the API rate limits: " + err);
            process.exitCode = buildCommon.ExitCodes.RequestFailure;
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

            const data = await this.fetchGithub(query);
            await this._logResponse(data, `data_commits`);
            this._handleDataErrors(data);

            let commit_data = {};
            for (let dataKey in data) {
                if (!dataKey.startsWith("commit_")) {
                    continue;
                }
                commit_data[dataKey.substring(7)] = data[dataKey].object;
            }

            const rate_limit = data["rateLimit"];
            console.log(`    [$${rate_limit.cost}][${rate_limit.nodeCount}] Retrieved ${Object.keys(commit_data).length} commits.`);
            console.log(`    --`);
            return commit_data;
        } catch (err) {
            console.error("    Error fetching pull request data: " + err);
            process.exitCode = buildCommon.ExitCodes.RequestFailure;
            return [];
        }
    }
}

module.exports = DataFetcher;
module.exports.API_DELAY_MSEC = API_DELAY_MSEC;
