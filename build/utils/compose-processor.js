const buildCommon = require('./build-common.js');

const GIT_HEAD_COMMIT_RE = RegExp("^commit ([a-zA-Z0-9-_]+)$");
const GIT_HEAD_MERGE_RE = RegExp("^Merge: (.+) (.+)$");
const GIT_HEAD_AUTHOR_RE = RegExp("^Author: (.+)$");
const GIT_HEAD_COMMITTER_RE = RegExp("^Commit: (.+)$");
const GIT_BODY_LINE_RE = RegExp("^[\\s]{2,}(.*)$");
const GIT_BODY_CHERRYPICK_RE = RegExp("^[\\s]{2,}\\(cherry picked from commit ([a-zA-Z0-9-_]+)\\)$");
const COMMIT_CHERRYPICK_RE = RegExp("^\\(cherry picked from commit ([a-zA-Z0-9-_]+)\\)$", "gm");

class DataProcessor {
    constructor() {
        this.log = [];
        this.releaseLogs = {};

        this.authors = {};
        this.commits = {};
        this.pulls = {};

        this.oldData = {};
    }

    takeData(dataObject) {
        this.oldData = {
            "log": dataObject.log || [],
            "releaseLogs": dataObject.release_logs || {},

            "commits": dataObject.commits || {},
            "authors": dataObject.authors || {},
            "pulls": dataObject.pulls || {},
        };
    }

    consumeOldLog() {
        this.log = this.oldData.log || [];
        this.releaseLogs = this.oldData.releaseLogs || {};
        this.commits = this.oldData.commits || {};
    }

    consumeOldCommits() {
        this.authors = this.oldData.authors || {};
        this.pulls = this.oldData.pulls || {};
    }

    _mapNodes(object) {
        return object.edges.map((item) => item["node"])
    }

    _getCommitObject(commitHash) {
        if (typeof this.oldData.commits !== "undefined" && typeof this.oldData.commits[commitHash] !== "undefined") {
            return this.oldData.commits[commitHash];
        }

        return {
            "hash": commitHash,
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

        const originalCommit = this._getCommitObject(commit.cherrypick_hash);
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
        this.log = [];
        this.releaseLogs = {};

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
                process.exitCode = buildCommon.ExitCodes.ParseFailure;
                break;
            }

            // Start parsing a new commit; store the existing one if applicable.
            let matches = line.match(GIT_HEAD_COMMIT_RE);
            if (matches) {
                if (commit != null) {
                    this._finishCommit(commit);
                }

                commit = this._getCommitObject(matches[1]);
                // These fields may come from the old data, we will override them.
                commit.summary = "";
                commit.body = "";
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
                process.exitCode = buildCommon.ExitCodes.ParseFailure;
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
            process.exitCode = buildCommon.ExitCodes.ParseFailure;
        }
    }

    processCommits(commitsRaw, targetRepo) {
        this.authors = {};
        this.pulls = {};

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

                commit.authored_by = [];
                const commitAuthors = this._mapNodes(item.authors);
                commitAuthors.forEach((authorItem) => {
                    const authorId = this._processAuthor(authorItem.user);
                    commit.authored_by.push(authorId);
                    this.authors[authorId].commit_count++;
                });

                // Commits can have multiple PRs associated with them, so we need to be on the lookout
                // for rogue entries. Normally, it will always be one pull per commit (except for direct
                // commits, which will have none), but GitHub may sometimes link commits to PRs in other
                // repos/otherwise unrelated. So some form of filtering is required.

                const pullsRaw = this._mapNodes(item.associatedPullRequests)
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
                let labels = this._mapNodes(pullItem.labels);
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
            process.exitCode = buildCommon.ExitCodes.ParseFailure;
        }
    }

    _processReleaseLog(releaseName, commitHashes) {
        this.releaseLogs[releaseName] = commitHashes;
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

module.exports = DataProcessor;
