import { LitElement, html, css, customElement, property } from 'lit-element';

import PullRequestItem from "./PullRequestItem";

@customElement('gr-changes-list')
export default class ChangesList extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --changes-background-color: #e5edf8;
            --changes-toolbar-color: #9bbaed;
            --changes-toolbar-accent-color: #5a6f90;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --changes-background-color: #191d23;
              --changes-toolbar-color: #222c3d;
              --changes-toolbar-accent-color: #566783;
            }
          }

          /** Component styling **/
          :host {
            flex-grow: 1;
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

          :host .version-changes {
            background-color: var(--changes-background-color);
            border-radius: 0 4px 4px 0;
            padding: 8px 12px;
            max-width: 760px;
          }

          :host .version-changes-toolbar {
            background: var(--changes-toolbar-color);
            border-radius: 4px;
            display: flex;
            flex-direction: row;
            gap: 16px;
            padding: 10px 14px;
            margin-bottom: 6px;
          }

          :host .changes-count {
            font-size: 15px;
          }
          :host .changes-count strong {
            font-size: 18px;
          }
          :host .changes-count-label {
            color: var(--dimmed-font-color);
          }

          @media only screen and (max-width: 900px) {
            :host .version-changes {
              padding: 8px;
              max-width: 95%;
              margin: 0px auto;
            }

            :host .changes-count {
              font-size: 17px;
              text-align: center;
              width: 100%;
            }
            :host .changes-count strong {
              font-size: 20px;
            }
          }
        `;
    }

    @property({ type: Object }) version = {};
    @property({ type: Array }) log = [];
    @property({ type: Object }) authors = {};
    @property({ type: Object }) commits = {};
    @property({ type: Object }) pulls = {};

    @property({ type: String }) selectedVersion = "";
    @property({ type: String }) selectedRelease = "";
    @property({ type: Boolean, reflect: true }) loading = false;

    render(){
        if (this.selectedVersion === "") {
            return html``;
        }
        if (this.loading) {
            return html`
                <span class="version-changes-empty">Loading changes...</span>
            `
        }

        let filtered_commits = [];
        let filtered_pulls = [];

        let commit_log = this.version.commit_log;
        if (this.selectedRelease !== "") {
            for (let release of this.version.releases) {
              if (release.name === this.selectedRelease) {
                commit_log = release.commit_log;
                break;
              }
            }
        }

        commit_log.forEach((commitHash) => {
            if (typeof this.commits[commitHash] === "undefined") {
                return; // This is not good.
            }

            let commit = this.commits[commitHash];
            filtered_commits.push(commit);
            
            if (commit.is_cherrypick && typeof this.commits[commit.cherrypick_hash] !== "undefined") {
                commit = this.commits[commit.cherrypick_hash];
            }

            if (commit.pull !== "" && typeof this.pulls[commit.pull] !== "undefined") {
                const pull = this.pulls[commit.pull];

                if (filtered_pulls.indexOf(pull) < 0) {
                    filtered_pulls.push(this.pulls[commit.pull]);
                }
            }
        });

        return html`
            <div class="version-changes">
                <div class="version-changes-toolbar">
                    <div class="changes-count">
                        <strong>${filtered_commits.length}</strong>
                        <span class="changes-count-label"> ${(filtered_commits.length === 1 ? "commit": "commits")}</span>
                    </div>
                    <div class="changes-count">
                        <strong>${filtered_pulls.length}</strong>
                        <span class="changes-count-label"> ${(filtered_pulls.length === 1 ? "PR": "PRs")}</span>
                    </div>
                </div>

                ${(filtered_pulls.length === 0 ? html`
                    <span class="version-changes-empty">This version contains no new changes.</span>
                ` : null)}

                ${filtered_pulls.map((item) => {
                    let authorIds = [];
                    item.commits.forEach((commitHash) => {
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

                    if (authorIds.indexOf(item.authored_by) < 0) {
                        authorIds.push(item.authored_by);
                    }

                    let authors = [];
                    authorIds.forEach((authoredBy) => {
                      if (typeof this.authors[authoredBy] !== "undefined") {
                          authors.push(this.authors[authoredBy]);
                      }
                    });

                    return html`
                        <gr-pull-request
                            .id="${item.public_id}"
                            .title="${item.title}"
                            .authors="${authors}"
                            .url="${item.url}"
                            .created_at="${item.created_at}"
                            .updated_at="${item.updated_at}"
                            .labels="${item.labels}"
                        />
                    `;
                 })}
            </div>
        `;
    }
}
