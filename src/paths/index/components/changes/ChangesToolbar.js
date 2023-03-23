import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-changes-toolbar')
export default class ChangesToolbar extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --changes-toolbar-color: #9bbaed;
            --changes-toolbar-color-hover: #2862cd;
            --changes-toolbar-color-active: #2054b5;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --changes-toolbar-color: #222c3d;
              --changes-toolbar-color-hover: #5b87de;
              --changes-toolbar-color-active: #6b9aea;
            }
          }

          /** Component styling **/
          :host {
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .version-changes-toolbar {
            background: var(--changes-toolbar-color);
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 6px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          :host .changes-version {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
          }

          :host .changes-title {
            color: var(--g-font-color);
            display: inline-block;
            font-size: 20px;
            line-height: 24px;
            margin-top: 6px;
            margin-bottom: 12px;
            word-break: break-word;
            flex-grow: 1;
          }

          :host .changes-title-links {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }

          :host .changes-stats {
            display: flex;
            flex-direction: row;
            gap: 20px;
          }

          :host .changes-count {
            display: flex;
            flex-direction: row;
            gap: 6px;
            cursor: pointer;
            font-size: 15px;
          }
          :host .changes-count strong {
            font-size: 18px;
          }
          :host .changes-count-label {
            color: var(--dimmed-font-color);
          }

          :host .changes-count:hover {
            color: var(--changes-toolbar-color-hover);
          }
          :host .changes-count:hover .changes-count-label {
            color: var(--link-font-color-hover);
          }

          :host .changes-count--active {
            border-bottom: 2px solid var(--changes-toolbar-color-active);
            color: var(--changes-toolbar-color-active);
          }
          :host .changes-count--active .changes-count-label {
            color: var(--link-font-color-inactive);
          }

          :host .changes-release-notes {
            background-image: url('release-notes.svg');
            background-size: 20px 20px;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            border-radius: 2px;
            display: inline-block;
            width: 24px;
            height: 24px;
            filter: brightness(0.85);
          }

          @media (prefers-color-scheme: light) {
            :host .changes-release-notes {
                filter: invert(1);
            }
          }

          @media only screen and (max-width: 900px) {
            :host .changes-count {
              font-size: 17px;
              justify-content: center;
              width: 100%;
            }
            :host .changes-count strong {
              font-size: 20px;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .changes-version {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
                margin-bottom: 10px;
            }

            :host .changes-title-links {
                flex-direction: row;
                justify-content: space-between;
                width: 100%;
            }
          }
        `;
    }

    @property({ type: Number }) pull_count = 0;
    @property({ type: Number }) commit_count = 0;
    @property({ type: Number }) author_count = 0;
    @property({ type: String }) repository = "";

    @property({ type: String }) version_name = "";
    @property({ type: String }) release_name = "";
    @property({ type: String }) version_ref = "";
    @property({ type: String }) version_from_ref = "";
    @property({ type: String }) version_article = "";

    @property({ type: String }) current_mode = "";

    _shortenRef(ref) {
        if (ref.indexOf(".") >= 0) {
            // This is a qualified version tag, don't shorten.
            return ref;
        }

        return ref.substring(0, 9);
    }

    _onModeClicked(mode) {
        if (mode === this.current_mode) {
            return;
        }

        this.dispatchEvent(greports.util.createEvent("modechange", {
            "mode": mode,
        }));
    }

    render() {
        return html`
            <div class="version-changes-toolbar">
                <div class="changes-version">
                    <span class="changes-title">
                        Changelog for ${this.version_name}${(this.release_name !== "" ? `-${this.release_name}` : "")}
                    </span>

                    <div class="changes-title-links">
                        <span>
                            commits:
                            <a
                                href="https://github.com/${this.repository}/compare/${this.version_from_ref}...${this.version_ref}"
                                target="_blank"
                                title="Open the commit list on GitHub"
                            >
                                ${this._shortenRef(this.version_from_ref)}...${this._shortenRef(this.version_ref)}
                            </a>
                        </span>

                        ${(this.version_article !== "" ? html`
                            <a
                                href="${this.version_article}"
                                target="_blank"
                                title="Open the release article on the official blog"
                            >
                                Read article
                            </a>
                        ` : null)}
                    </div>
                </div>

                <div class="changes-stats">
                    <div
                        class="changes-count ${(this.current_mode === "commits" ? "changes-count--active" : "")}"
                        @click="${this._onModeClicked.bind(this, "commits")}"
                    >
                        <strong>${this.commit_count}</strong>
                        <span class="changes-count-label">
                            ${(this.commit_count === 1 ? "commit" : "commits")}
                        </span>
                    </div>
                    <div
                        class="changes-count ${(this.current_mode === "pulls" ? "changes-count--active" : "")}"
                        @click="${this._onModeClicked.bind(this, "pulls")}"
                    >
                        <strong>${this.pull_count}</strong>
                        <span class="changes-count-label">
                            ${(this.pull_count === 1 ? "pull-request" : "pull-requests")}
                        </span>
                    </div>
                    <div
                        class="changes-count ${(this.current_mode === "authors" ? "changes-count--active" : "")}"
                        @click="${this._onModeClicked.bind(this, "authors")}"
                    >
                        <strong>${this.author_count}</strong>
                        <span class="changes-count-label">
                            ${(this.author_count === 1 ? "contributor" : "contributors")}
                        </span>
                    </div>

                    <div style="flex-grow:1"></div>

                    <div
                        class="changes-count ${(this.current_mode === "release-notes" ? "changes-count--active" : "")}"
                        title="Show changes in the form of release notes"
                        @click="${this._onModeClicked.bind(this, "release-notes")}"
                    >
                        <span class="changes-release-notes"></span>
                    </div>
                </div>
            </div>
        `;
    }
}
