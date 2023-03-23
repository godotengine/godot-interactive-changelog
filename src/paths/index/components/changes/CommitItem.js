import { LitElement, html, css, customElement, property } from 'lit-element';

import ChangeItemAuthor from './base/ChangeItemAuthor';

@customElement('gr-commit-item')
export default class CommitItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
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
            display: inline-block;
            font-size: 20px;
            margin-top: 6px;
            margin-bottom: 12px;
          }
          :host .item-title-name {
            color: var(--g-font-color);
            line-height: 24px;
            word-break: break-word;
          }

          :host .item-meta {
            color: var(--dimmed-font-color);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
          }

          :host .item-links {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
          }

          :host .item-authors {
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

    @property({ type: String, reflect: true }) hash = '';
    @property({ type: String }) cherrypick_hash = '';
    @property({ type: String }) title = '';
    @property({ type: Array }) authors = [];

    @property({ type: String }) repository = '';

    render(){
        return html`
            <div class="item-container">
                <div class="item-title">
                    <span class="item-title-name">${this.title}</span>
                </div>

                <div class="item-meta">
                    <div>
                        <div class="item-authors">
                            <span>by </span>
                            ${this.authors.map((author) => {
                                return html`
                                    <gr-change-author
                                        .id="${author.id}"
                                        .user="${author.user}"
                                        .avatar="${author.avatar}"
                                        .is_hot="${author.commit_count > 12}"

                                        .url="${`https://github.com/${this.repository}/commits/?author=${author.user}`}"
                                        .url_title="${`Open all commits by ${author.user}`}"
                                    ></gr-change-author>
                                `;
                            })}
                        </div>
                    </div>

                    <div class="item-links">
                        <div>
                            <span>committed in </span>
                            <a
                                href="https://github.com/${this.repository}/commit/${this.hash}"
                                target="_blank"
                                title="Open commit #${this.hash} on GitHub"
                            >
                                ${this.hash.substring(0, 9)}
                            </a>

                            ${(this.cherrypick_hash !== "" ? html`
                                <span> · </span>
                                <span>cherry-picked in </span>
                                <a
                                    href="https://github.com/${this.repository}/commit/${this.cherrypick_hash}"
                                    target="_blank"
                                    title="Open commit #${this.cherrypick_hash} on GitHub"
                                >
                                    ${this.cherrypick_hash.substring(0, 9)}
                                </a>
                            ` : null)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
