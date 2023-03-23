import { LitElement, html, css, customElement, property } from 'lit-element';

import ChangesToolbar from "./ChangesToolbar"
import PullRequestItem from "./PullRequestItem";

@customElement('gr-changes-list')
export default class ChangesList extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --changes-background-color: #e5edf8;
          }
          @media (prefers-color-scheme: dark) {
            :host {
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

          :host .version-changes-empty {
            color: var(--g-font-color);
            display: inline-block;
            font-size: 20px;
            line-height: 24px;
            margin-top: 6px;
            margin-bottom: 12px;
            padding: 14px 12px;
            word-break: break-word;
          }
        `;
    }

    @property({ type: Object }) version = {};
    @property({ type: Array }) log = [];
    @property({ type: Object }) authors = {};
    @property({ type: Object }) commits = {};
    @property({ type: Object }) pulls = {};

    @property({ type: String }) selectedRepository = "";
    @property({ type: String }) selectedVersion = "";
    @property({ type: String }) selectedRelease = "";
    @property({ type: Boolean, reflect: true }) loading = false;

    constructor() {
        super();

        this._active_log = [];
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
        this._active_log = this.version.commit_log;

        // But if we're in a specific release, find its log.
        if (this.selectedRelease !== "") {
            for (let release of this.version.releases) {
                if (release.name === this.selectedRelease) {
                    this._active_log = release.commit_log;
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

            if (originalCommit.pull !== "" && typeof this.pulls[originalCommit.pull] !== "undefined") {
                const pull = this.pulls[originalCommit.pull];
                this._appendPull(pull);
            }
        });
    }

    _appendCommit(commit, originalCommit) {
        const filteredCommit = {
            "commit": commit,
            "original_commit": null,
            "authors": [],
        };

        if (commit !== originalCommit) {
            filteredCommit.original_commit = originalCommit;
        }

        const authorIds = this._findCommitAuthors([ commit.hash, originalCommit.hash ]);
        filteredCommit.authors = this._getAuthors(authorIds);

        this._filtered_commits.push(filteredCommit);
        this._appendAuthors(filteredCommit.authors);
    }

    _appendPull(pull) {
        const existing = this._filtered_pulls.find((item) => {
            return item.pull === pull;
        });
        if (typeof existing !== "undefined") {
            return;
        }

        const filteredPull = {
            "pull": pull,
            "authors": [],
        };

        let authorIds = this._findCommitAuthors(pull.commits);
        if (authorIds.indexOf(pull.authored_by) < 0) {
            authorIds.push(pull.authored_by);
        }
        filteredPull.authors = this._getAuthors(authorIds);

        this._filtered_pulls.push(filteredPull);
        this._appendAuthors(filteredPull.authors);
    }

    _appendAuthors(authors) {
        authors.forEach((item) => {
            this._appendAuthor(item);
        });
    }

    _appendAuthor(author) {
        const existing = this._filtered_authors.find((item) => {
            return item.author === author;
        });

        if (typeof existing === "undefined") {
            const filteredAuthor = {
                "author": author,
                "commits": [],
                "pulls": [],
            }

            this._filtered_authors.push(filteredAuthor);
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

    update(changedProperties) {
        this._updateActiveLog();
        this._updateLists();

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

        return html`
            <div class="version-changes">
                <gr-changes-toolbar
                    .pull_count="${this._filtered_pulls.length}"
                    .commit_count="${this._filtered_commits.length}"
                    .author_count="${this._filtered_authors.length}"
                ></gr-changes-toolbar>

                ${(this._filtered_pulls.length === 0 ? html`
                    <span class="version-changes-empty">This version contains no new changes.</span>
                ` : null)}

                ${this._filtered_pulls.map((item) => {
                    const pull = item.pull;

                    return html`
                        <gr-pull-item
                            .id="${pull.public_id}"
                            .title="${pull.title}"
                            .authors="${item.authors}"
                            .url="${pull.url}"
                            .created_at="${pull.created_at}"
                            .updated_at="${pull.updated_at}"
                            .labels="${pull.labels}"
                            .repository="${this.selectedRepository}"
                        />
                    `;
                })}
            </div>
        `;
    }
}
