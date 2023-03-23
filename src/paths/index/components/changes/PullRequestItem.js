import { LitElement, html, css, customElement, property } from 'lit-element';

import ChangeItemAuthor from './base/ChangeItemAuthor';
import ChangeItemLabel from './base/ChangeItemLabel';

@customElement('gr-pull-item')
export default class PullRequestItem extends LitElement {
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

          :host .item-people {
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

            :host .item-people {
                text-align: left;
            }
          }
        `;
    }

    @property({ type: String, reflect: true }) id = '';
    @property({ type: String }) cherrypick_id = '';
    @property({ type: String }) title = '';
    @property({ type: Array }) authors = [];
    @property({ type: String }) url = '';
    @property({ type: String }) created_at = '';
    @property({ type: String }) updated_at = '';
    @property({ type: Array }) labels = [];

    @property({ type: String }) repository = '';

    render(){
        // Some labels aren't useful in this context; hide them.
        let filteredLabels = [];
        this.labels.forEach((item) => {
            if (item.name.startsWith("cherrypick:")) {
                return;
            }

            filteredLabels.push(item);
        });

        return html`
            <div class="item-container">
                <div class="item-title">
                    <span class="item-title-name">${this.title}</span>
                </div>

                <div class="item-meta">
                    <div class="item-labels">
                        ${filteredLabels.map((item) => {
                            return html`
                                <gr-change-label
                                    .name="${item.name}"
                                    .color="${item.color}"
                                ></gr-change-label>
                            `;
                        })}
                    </div>

                    <div class="item-people">
                        <div class="item-authors">
                            <span>by </span>
                            ${this.authors.map((author) => {
                                return html`
                                    <gr-change-author
                                        .id="${author.id}"
                                        .user="${author.user}"
                                        .avatar="${author.avatar}"
                                        .is_hot="${author.pull_count > 12}"

                                        .url="${`https://github.com/${this.repository}/pulls/${author.user}`}"
                                        .url_title="${`Open all PRs by ${author.user}`}"
                                    ></gr-change-author>
                                `;
                            })}
                        </div>

                        <div>
                            <span>submitted as </span>
                            <a
                                href="${this.url}"
                                target="_blank"
                                title="Open PR #${this.id} on GitHub"
                            >
                                GH-${this.id}
                            </a>

                            ${(this.cherrypick_id !== "" ? html`
                                <span> · </span>
                                <span>cherry-picked in </span>
                                <a
                                    href="https://github.com/${this.repository}/pull/${this.cherrypick_id}"
                                    target="_blank"
                                    title="Open PR #${this.cherrypick_id} on GitHub"
                                >
                                    GH-${this.cherrypick_id}
                                </a>
                            ` : null)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
