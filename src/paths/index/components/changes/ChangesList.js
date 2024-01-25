import { LitElement, html, css, customElement, property } from 'lit-element';

import ChangesToolbar from "./ChangesToolbar"
import PullRequestItem from "./PullRequestItem";
import CommitItem from "./CommitItem";
import AuthorItem from "./AuthorItem";
import ReleaseNotesItem from './ReleaseNotesItem';

const SHORTLIST_ITEMS = 600;

@customElement('gr-changes-list')
export default class ChangesList extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
            --changes-background-color: #e5edf8;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
              --changes-background-color: #191d23;
            }
          }

          /** Component styling **/
          :host {
            flex-grow: 1;
          }

          :host .version-changes {
            background-color: var(--changes-background-color);
            border-radius: 0 4px 4px 0;
            padding: 8px 12px;
            max-width: 760px;
          }
          @media only screen and (max-width: 900px) {
            :host .version-changes {
              padding: 8px;
              max-width: 95%;
              margin: 0px auto;
            }
          }

          :host .version-changes-empty,
          :host .version-changes-more {
            color: var(--g-font-color);
            display: inline-block;
            font-size: 20px;
            line-height: 24px;
            margin-top: 6px;
            margin-bottom: 12px;
            padding: 14px 12px;
            word-break: break-word;
          }

          :host .version-changes-more {
            border-bottom: 3px solid var(--item-border-color);
            color: var(--dimmed-font-color);
            font-size: 15px;
          }

          :host .version-changes-action {
            cursor: pointer;
            color: var(--link-font-color);
          }
          :host .version-changes-action:hover {
            color: var(--link-font-color-hover);
          }
        `;
    }

    @property({ type: Object }) version = {};
    @property({ type: Object }) authors = {};
    @property({ type: Object }) commits = {};
    @property({ type: Object }) pulls = {};

    @property({ type: String }) selectedRepository = "";
    @property({ type: String }) selectedVersion = "";
    @property({ type: String }) selectedRelease = "";
    @property({ type: Boolean, reflect: true }) loading = false;

    constructor() {
        super();

        // TODO: Pending a design rework that would make this few properly default.
        this._viewMode = "release-notes";
        this._viewFull = false;

        this._active_log = [];
        this._version_ref = "";
        this._version_from_ref = "";
        this._version_article = "";

        this._filtered_commits = [];
        this._filtered_pulls = [];
        this._filtered_authors = [];
    }

    _updateActiveLog() {
        this._active_log = [];
        if (this._selectedVersion === "") {
            return;
        }

        // Default to the main log of the version.
        this._active_log = this.version.commit_log || [];
        this._version_ref = this.version.ref || "";
        this._version_from_ref = this.version.from_ref || "";
        this._version_article = this.version.article || "";

        // But if we're in a specific release, find its log.
        if (this.selectedRelease !== "" && typeof this.version.releases !== "undefined") {
            for (let release of this.version.releases) {
                if (release.name === this.selectedRelease) {
                    this._active_log = release.commit_log || [];
                    this._version_ref = release.ref || "";
                    this._version_from_ref = release.from_ref || "";
                    this._version_article = release.article || "";
                    break;
                }
            }
        }
    }

    _updateLists() {
        this._filtered_commits = [];
        this._filtered_pulls = [];
        this._filtered_authors = [];

        this._active_log.forEach((commitHash) => {
            if (typeof this.commits[commitHash] === "undefined") {
                return; // This is not good.
            }

            const commit = this.commits[commitHash];
            let originalCommit = commit;
            if (commit.is_cherrypick && typeof this.commits[commit.cherrypick_hash] !== "undefined") {
                originalCommit = this.commits[commit.cherrypick_hash];
            }
            this._appendCommit(commit, originalCommit);

            let pull = null;
            let originalPull = null;
            if (commit.pull !== "" && typeof this.pulls[commit.pull] !== "undefined") {
                pull = this.pulls[commit.pull];
                originalPull = pull;
            }
            if (originalCommit.pull !== "" && typeof this.pulls[originalCommit.pull] !== "undefined") {
                originalPull = this.pulls[originalCommit.pull];
            }
            this._appendPull(pull, originalPull);
        });

        this._filtered_authors.sort((a, b) => {
            // Sort by contributions first (DESC).
            if (a.commits.length > b.commits.length) return -1;
            if (a.commits.length < b.commits.length) return 1;
            // Then sort by name (ASC).
            if (a.author.user.toLowerCase() > b.author.user.toLowerCase()) return 1;
            if (a.author.user.toLowerCase() < b.author.user.toLowerCase()) return -1;

            return 0;
        });
    }

    _appendCommit(commit, originalCommit) {
        const filteredCommit = {
            "commit": null,
            "cherrypick_commit": null,
            "authors": [],
        };

        if (commit !== originalCommit) {
            filteredCommit.commit = originalCommit;
            filteredCommit.cherrypick_commit = commit;
        } else {
            filteredCommit.commit = commit;
        }

        const authorIds = this._findCommitAuthors([ commit.hash, originalCommit.hash ]);
        filteredCommit.authors = this._getAuthors(authorIds);

        this._filtered_commits.push(filteredCommit);
        this._appendAuthors(filteredCommit.authors, filteredCommit.commit);
    }

    _appendPull(pull, originalPull) {
        if (!pull && !originalPull) {
            return;
        }

        const existing = this._filtered_pulls.find((item) => {
            return item.pull === originalPull;
        });
        if (typeof existing !== "undefined") {
            return;
        }

        const filteredPull = {
            "pull": null,
            "cherrypick_pull": null,
            "authors": [],
        };

        if (pull !== originalPull) {
            filteredPull.pull = originalPull;
            filteredPull.cherrypick_pull = pull;
        } else {
            filteredPull.pull = pull;
        }

        let authorIds = this._findCommitAuthors(originalPull.commits);
        if (authorIds.indexOf(originalPull.authored_by) < 0) {
            authorIds.push(originalPull.authored_by);
        }
        filteredPull.authors = this._getAuthors(authorIds);

        this._filtered_pulls.push(filteredPull);
        this._appendAuthors(filteredPull.authors, null, filteredPull.pull);
    }

    _appendAuthors(authors, commit = null, pull = null) {
        authors.forEach((item) => {
            this._appendAuthor(item, commit, pull);
        });
    }

    _appendAuthor(author, commit = null, pull = null) {
        let existing = this._filtered_authors.find((item) => {
            return item.author === author;
        });

        if (typeof existing === "undefined") {
            const filteredAuthor = {
                "author": author,
                "commits": [],
                "pulls": [],
            }

            this._filtered_authors.push(filteredAuthor);
            existing = filteredAuthor;
        }

        if (commit) {
            existing.commits.push(commit);
        }
        if (pull && existing.pulls.indexOf(pull) < 0) {
            existing.pulls.push(pull);
        }
    }

    _findCommitAuthors(commits) {
        let authorIds = [];

        commits.forEach((commitHash) => {
            if (typeof this.commits[commitHash] === "undefined") {
                return;
            }
            const commit = this.commits[commitHash];
            commit.authored_by.forEach((authoredBy) => {
                if (authorIds.indexOf(authoredBy) < 0) {
                    authorIds.push(authoredBy);
                }
            })
        });

        return authorIds;
    }

    _getAuthors(authorIds) {
        let authors = [];

        authorIds.forEach((authoredBy) => {
            if (typeof this.authors[authoredBy] !== "undefined") {
                authors.push(this.authors[authoredBy]);
            }
        });

        return authors;
    }

    _onModeChanged(event) {
        if (this._viewMode === event.detail.mode) {
            return
        }

        this._viewMode = event.detail.mode;
        this.requestUpdate();
    }

    _onMoreClicked() {
        this._viewFull = !this._viewFull;
        this.requestUpdate();
    }

    update(changedProperties) {
        // Only recalculate when class properties change; skip for manual updates.
        if (changedProperties.size > 0) {
            this._viewFull = false;

            this._updateActiveLog();
            this._updateLists();
        }

        super.update(changedProperties);
    }

    render(){
        if (this.selectedVersion === "") {
            return html``;
        }
        if (this.loading) {
            return html`
                <span class="version-changes-empty">Loading changes...</span>
            `
        }

        let commitList = this._filtered_commits;
        let pullList = this._filtered_pulls;
        let authorList = this._filtered_authors;

        if (!this._viewFull) {
            commitList = this._filtered_commits.slice(0, SHORTLIST_ITEMS);
            pullList = this._filtered_pulls.slice(0, SHORTLIST_ITEMS);
        }

        return html`
            <div class="version-changes">
                <gr-changes-toolbar
                    .pull_count="${this._filtered_pulls.length}"
                    .commit_count="${this._filtered_commits.length}"
                    .author_count="${this._filtered_authors.length}"
                    .repository="${this.selectedRepository}"

                    .version_name="${this.selectedVersion}"
                    .release_name="${this.selectedRelease}"
                    .version_ref="${this._version_ref}"
                    .version_from_ref="${this._version_from_ref}"
                    .version_article="${this._version_article}"

                    .current_mode="${this._viewMode}"
                    @modechange="${this._onModeChanged}"
                ></gr-changes-toolbar>


                ${(this._viewMode === "pulls" && this._filtered_pulls.length === 0 ? html`
                    <span class="version-changes-empty">
                        This version contains no new changes.
                    </span>
                ` : null)}

                ${(this._viewMode === "commits" && this._filtered_commits.length === 0 ? html`
                    <span class="version-changes-empty">
                        This version contains no new commits.
                    </span>
                ` : null)}

                ${(this._viewMode === "authors" && this._filtered_authors.length === 0 ? html`
                    <span class="version-changes-empty">
                        This version contains no contributors.
                    </span>
                ` : null)}


                ${(!this._viewFull && this._viewMode === "pulls" && this._filtered_pulls.length > SHORTLIST_ITEMS ? html`
                    <span class="version-changes-more">
                        This version contains too many changes to display immediately.
                        <span class="version-changes-action" @click="${this._onMoreClicked}">
                            Click here to expand the list
                        </span>.
                    </span>
                ` : null)}

                ${(!this._viewFull && this._viewMode === "commits" && this._filtered_commits.length > SHORTLIST_ITEMS ? html`
                    <span class="version-changes-more">
                        This version contains too many commits to display immediately.
                        <span class="version-changes-action" @click="${this._onMoreClicked}">
                            Click here to expand the list
                        </span>.
                    </span>
                ` : null)}


                ${this._viewMode === "pulls" ? pullList.map((item) => {
                    const pull = item.pull;
                    const cherrypick_pull = item.cherrypick_pull;

                    return html`
                        <gr-pull-item
                            .id="${pull.public_id}"
                            .cherrypick_id="${(cherrypick_pull ? cherrypick_pull.public_id : "")}"
                            .title="${pull.title}"
                            .authors="${item.authors}"
                            .url="${pull.url}"
                            .created_at="${pull.created_at}"
                            .updated_at="${pull.updated_at}"
                            .labels="${pull.labels}"
                            .repository="${this.selectedRepository}"
                        />
                    `;
                }) : null}

                ${this._viewMode === "commits" ? commitList.map((item) => {
                    const commit = item.commit;
                    const cherrypick_commit = item.cherrypick_commit;

                    return html`
                        <gr-commit-item
                            .hash="${commit.hash}"
                            .cherrypick_hash="${(cherrypick_commit ? cherrypick_commit.hash : "")}"
                            .title="${commit.summary}"
                            .authors="${item.authors}"
                            .repository="${this.selectedRepository}"
                        />
                    `;
                }) : null}

                ${this._viewMode === "authors" ? authorList.map((item) => {
                    const author = item.author;

                    return html`
                        <gr-author-item
                            .id="${author.id}"
                            .user="${author.user}"
                            .avatar="${author.avatar}"
                            .commits="${item.commits}"
                            .pulls="${item.pulls}"
                            .repository="${this.selectedRepository}"
                        />
                    `;
                }) : null}

                ${this._viewMode === "release-notes" ? html`
                    <gr-release-notes
                        .pulls="${this._filtered_pulls.map(item => item.pull)}"
                        .repository="${this.selectedRepository}"
                    ></gr-release-notes>
                ` : null}
            </div>
        `;
    }
}
