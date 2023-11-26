const DataFetcher = require('./build/utils/compose-fetcher.js');
const DataProcessor = require('./build/utils/compose-processor.js');
const DataIO = require('./build/utils/compose-io.js');

const COMMITS_PER_PAGE = 150;

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

    const databaseName = `${dataIO.data_owner}.${dataIO.data_repo}.${dataIO.data_version}.json`;

    console.log(`[*] Configured for the "${dataIO.data_owner}/${dataIO.data_repo}" repository; version ${dataIO.data_version}.`);

    const dataFetcher = new DataFetcher(dataIO.data_owner, dataIO.data_repo);
    const dataProcessor = new DataProcessor();

    if (dataIO.update_data) {
        console.log(`[*] Loading existing data to perform an update.`);
        const oldData = await dataIO.loadData(databaseName);
        dataProcessor.takeData(oldData);
    }

    console.log("[*] Checking the rate limits before.");
    await dataFetcher.checkRates();
    checkForExit();

    // First, we checkout the repository for the specified branch/tag/hash. We will
    // use it to retrieve a clean commit log. This step creates a shallow copy of the
    // repository, as we are only interested in the history of the branch.
    // Still, it extracts all of the current files, so it may take a bit of time.

    if (dataIO.skip_checkout) {
        console.log(`[*] Skipping the repository checkout.`);
    } else {
        console.log(`[*] Checking out the repository at "${dataIO.last_commit}".`);
        await dataFetcher.checkoutRepo(dataIO.git_tag, dataIO.last_commit);
        checkForExit();
    }

    if (dataIO.checkout_dir !== "") {
        console.log(`[*] Using the local clone at "${dataIO.checkout_dir}".`);
    }

    if (dataIO.skip_gitlog) {
        console.log(`[*] Skipping the commit log extraction.`);
        dataProcessor.consumeOldLog();
    } else {
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

        // We also need to keep track of the commit history of each release within a version.
        // Releases can, and most often do, include commits outside of the defined range. This
        // happens when a contribution is authored before the defined range, but merged within
        // it.

        console.log(`[*] Extracting commit logs for releases.`);
        for (let i = 0; i < dataIO.releases.length; i++) {
            const release = dataIO.releases[i];

            console.log(`    Extracting the commit log for "${release.name}" (between "${release.from_ref}" and "${release.ref}").`);
            const releaseLog = await dataFetcher.getCommitsBetween(release.from_ref, release.ref, dataIO.checkout_dir);
            checkForExit();

            console.log(`    Processing the commit log for "${release.name}".`);
            dataProcessor._processReleaseLog(release.name, releaseLog);
            checkForExit();
        }
    }

    // This method returns only non-merge commits; we don't need to fetch anything about
    // merge commits. We only need them for a complete commit history.
    const commitHashes = dataProcessor.getCommitHashes();

    if (dataIO.skip_github) {
        console.log(`[*] Skipping the commit data fetching from GitHub.`);
        dataProcessor.consumeOldCommits();
    } else {
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
            await dataFetcher.delay(DataFetcher.API_DELAY_MSEC);

            // Add an extra delay every few requests, because the chance to trigger the hidden rate issue
            // seems to grow with the number of queries.
            if (page % 8 === 0) {
                console.log("[*] Waiting a bit for the API to cool down...");
                await dataFetcher.delay(DataFetcher.API_DELAY_MSEC * 4);
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
    }

    console.log("[*] Checking the rate limits after.")
    await dataFetcher.checkRates();
    checkForExit();

    console.log("[*] Finalizing database.")
    const output = {
        "generated_at": Date.now(),
        "log": dataProcessor.log,
        "release_logs": dataProcessor.releaseLogs,
        "authors": dataProcessor.authors,
        "commits": dataProcessor.commits,
        "pulls": dataProcessor.pulls,
    };

    await dataIO.saveData(databaseName, output);
    checkForExit();

    console.log("[*] Database built.");
}

main();
