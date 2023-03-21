const fs = require('fs').promises;
const fsConstants = require('fs').constants;
const fetch = require('node-fetch');

const ExitCodes = {
    "RequestFailure": 1,
    "ParseFailure": 2,
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

class DataFetcher {
    constructor(data_owner, data_repo) {
        this.repo_ssh_path = `git@github.com:${data_owner}/${data_repo}.git`;
        this.api_rest_path = `https://api.github.com/repos/${data_owner}/${data_repo}`;
        this.api_repository_id = `owner:"${data_owner}" name:"${data_repo}"`;

        this.page_count = 1;
        this.last_cursor = "";
    }

    async _logResponse(data, name) {
        try {
            try {
                await fs.access("logs", fsConstants.R_OK | fsConstants.W_OK);
            } catch (err) {
                await fs.mkdir("logs");
            }
    
            await fs.writeFile(`logs/${name}.json`, JSON.stringify(data, null, 4), {encoding: "utf-8"});
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

    }

    getCommitHistory(fromCommit, toCommit) {

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
                  date
                  email
                  name
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

    async fetchCommits(commits) {
        try {
            const query = `
            query {
                ${API_RATE_LIMIT}

                ${commits.map((item) => {
                    return this._getCommitQuery(item) + "\n";
                })}
              }
            `;

            console.log(`    Requesting a batch of ${commits.length} commits.`);
    
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
        this.pulls = [];
    }

    processCommits(commitsRaw) {
        try {
            commitsRaw.forEach((item) => {
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

async function main() {
    // Internal utility methods.
    const ensureDir = async (dirPath) => {
        try {
            const pathStat = await fs.stat(dirPath);
            if (!pathStat.isDirectory()) {
                await fs.mkdir(dirPath);
            }
        } catch (err) {
            await fs.mkdir(dirPath);
        }
    }
    const checkForExit = () => {
        if (process.exitCode > 0) {
            process.exit();
        }
    }
    const delay = async (msec) => {
        return new Promise(resolve => setTimeout(resolve, msec));
    }

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

    let data_owner = "godotengine";
    let data_repo = "godot";
    process.argv.forEach((arg) => {
        if (arg.indexOf("owner:") === 0) {
            data_owner = arg.substring(6);
        }
        if (arg.indexOf("repo:") === 0) {
            data_repo = arg.substring(5);
        }
    });

    console.log(`[*] Configured for the "${data_owner}/${data_repo}" repository.`);
    const dataFetcher = new DataFetcher(data_owner, data_repo);
    const dataProcessor = new DataProcessor();

    console.log("[*] Checking the rate limits before.");
    await dataFetcher.checkRates();
    checkForExit();

    // First, we checkout the repository for the specified branch/tag/hash. We will
    // use it to retrieve a clean commit log, ignoring merge commits. We can also use
    // it as a basis for our list of authors/contributors, as it's not always the
    // same between the PR and the actual commit.

    await ensureDir("./temp");


    // Second, we try to extract information about this being a cherry-pick. We can
    // rely on the commit message body containing a certain string, from which we can
    // take the original commit hash.
    //
    // Third, we generate a query to the GraphQL API to fetch the information about
    // linked PRs. GraphQL API supports having multiple sub-queries, which can be our
    // gateway to fetching the data for a list of specific hashes.
    // 
    // This needs to be tested to see if it would blow our API rate budget, or not.
    // It's also unclear whether this feature is limited to a certain number of subqueries
    // (say, 100), or not. We may need to do it in batches, as we do with paginated
    // queries.
    //
    // Fourth, we consolidate the information. Each run is performed on a certain range
    // of branches/tags/hashes, and so we store the information we receive in files
    // associated with this range. This process can be optimized by only working with
    // smaller ranges, and composing bigger ranges out of them (e.g. using hashes for
    // X.Y beta 1 and X.Y beta 2, and then X.Y beta 2 and X.Y beta 3, and then generating
    // a complete list for X.Y-1 and X.Y on the frontend).

    // Commits can have multiple PRs associated with them, so we need to be on the lookout
    // for rogue entries. Normally, it will always be one pull per commit (except for direct
    // commits, which will have none), but GitHub may sometimes link commits to PRs in other
    // repos/otherwise unrelated. So some form of filtering is required.

    console.log("[*] Fetching commit data from GitHub.");
    // Pages are starting with 1 for better presentation.
    let page = 1;
    while (page <= dataFetcher.page_count) {
        //const commitsRaw = await dataFetcher.fetchCommits(page);
        //dataProcessor.processCommits(commitsRaw);
        //checkForExit();
        page++;

        // Wait for a bit before proceeding to avoid hitting the secondary rate limit in GitHub API.
        // See https://docs.github.com/en/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits.
        await delay(1500);
    }

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
