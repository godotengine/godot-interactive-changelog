import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-author-item')
export default class AuthorItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
            --changes-type-color-hover: #2862cd;
            --changes-type-color-active: #2054b5;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
              --changes-type-color-hover: #5b87de;
              --changes-type-color-active: #6b9aea;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--item-border-color);
            display: block;
            padding: 14px 12px 20px 12px;
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-title {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 20px;
            margin-top: 6px;
            margin-bottom: 12px;
          }
          :host .item-title-name {
            color: var(--g-font-color);
            line-height: 24px;
            word-break: break-word;
          }

          :host .item-title-avatar {
            background-size: cover;
            border-radius: 4px;
            display: inline-block;
            width: 20px;
            height: 20px;
          }

          :host .item-meta {
            color: var(--dimmed-font-color);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
          }

          :host .item-changes-types {
            display: flex;
            flex-direction: row;
            gap: 16px;
          }

          :host .item-changes-type {
            color: var(--light-font-color);
            cursor: pointer;
          }
          :host .item-changes-type:hover {
            color: var(--link-font-color-hover);
          }
          :host .item-changes-type.item-changes--active {
            color: var(--changes-type-color-active);
            text-decoration: underline;
          }
          :host .item-changes-type.item-changes--active:hover {
            color: var(--changes-type-color-hover);
          }

          :host .item-changes-list {
            display: none;
            padding-left: 20px;
          }
          :host .item-changes-list.item-changes--active {
            display: block;
          }

          :host .item-changes-link:before {
            content: "[";
            color: var(--dimmed-font-color);
          }
          :host .item-changes-link:after {
            content: "]";
            color: var(--dimmed-font-color);
          }

          :host .item-links {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
            white-space: nowrap;
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .item-container {
                padding: 0 10px;
            }

            :host .item-meta {
              flex-direction: column;
            }

            :host .item-links {
                text-align: left;
            }
          }
        `;
    }

    @property({ type: String, reflect: true }) id = '';
    @property({ type: String }) user = '';
    @property({ type: String }) avatar = '';

    @property({ type: Array }) commits = [];
    @property({ type: Array }) pulls = [];

    @property({ type: String }) repository = '';

    constructor() {
        super();

        this._changesMode = "commits";
    }

    _onModeClicked(type) {
        if (type === this._changesMode) {
            return;
        }

        this._changesMode = type;
        this.requestUpdate();
    }

    render(){
        return html`
            <div class="item-container">
                <div class="item-title">
                    <span
                        class="item-title-avatar"
                        style="background-image: url('${this.avatar}')"
                    ></span>
                    <span class="item-title-name">${this.user}</span>
                </div>

                <div class="item-meta">
                    <div class="item-changes">
                        <div class="item-changes-types">
                            <span
                                class="item-changes-type ${(this._changesMode === "commits" ? "item-changes--active" : "")}"
                                @click="${this._onModeClicked.bind(this, "commits")}"
                            >
                                ${this.commits.length} ${(this.commits.length === 1 ? "commit" : "commits")}
                            </span>
                            <span
                                class="item-changes-type ${(this._changesMode === "pulls" ? "item-changes--active" : "")}"
                                @click="${this._onModeClicked.bind(this, "pulls")}"
                            >
                                ${this.pulls.length} ${(this.pulls.length === 1 ? "PR" : "PRs")}
                            </span>
                        </div>
                        <ul class="item-changes-list ${(this._changesMode === "commits" ? "item-changes--active" : "")}">
                            ${this.commits.map((item) => {
                                return html`
                                    <li>
                                        <code>
                                            <a
                                                class="item-changes-link"
                                                href="https://github.com/${this.repository}/commit/${item.hash}"
                                                target="_blank"
                                            >${item.hash.substring(0, 9)}</a>
                                        </code>
                                        <span>
                                            ${item.summary}
                                        </span>
                                    </li>
                                `;
                            })}
                        </ul>
                        <ul class="item-changes-list ${(this._changesMode === "pulls" ? "item-changes--active" : "")}">
                            ${this.pulls.map((item) => {
                                return html`
                                    <li>
                                        <code>
                                            <a
                                                class="item-changes-link"
                                                href="https://github.com/${this.repository}/pull/${item.public_id}"
                                                target="_blank"
                                            >GH-${item.public_id}</a>
                                        </code>
                                        <span>
                                            ${item.title}
                                        </span>
                                    </li>
                                `;
                            })}
                        </ul>
                    </div>

                    <div class="item-links">
                        <div>
                            <span>${this.user} </span>
                            <a
                                href="https://github.com/${this.user}"
                                target="_blank"
                                title="Open ${this.user}'s GitHub profile"
                            >
                                on GitHub
                            </a>
                        </div>
                        <div>
                            <a
                                href="https://github.com/${this.repository}/commits/?author=${this.user}"
                                target="_blank"
                                title="Open all commits by ${this.user}"
                            >
                                more commits
                            </a>
                            <span> · </span>
                            <a
                                href="https://github.com/${this.repository}/pulls/${this.user}"
                                target="_blank"
                                title="Open all PRs by ${this.user}"
                            >
                                more PRs
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
