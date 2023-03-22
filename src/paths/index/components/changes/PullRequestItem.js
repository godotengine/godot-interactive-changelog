import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-pull-request')
export default class PullRequestItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --pr-border-color: #fcfcfa;
            --star-font-color: #ffcc31;
            --ghost-font-color: #738b99;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --pr-border-color: #0d1117;
              --star-font-color: #e0c537;
              --ghost-font-color: #495d68;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--pr-border-color);
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

          :host .pr-title {
            display: inline-block;
            font-size: 20px;
            margin-top: 6px;
            margin-bottom: 12px;
          }
          :host .pr-title-name {
            color: var(--g-font-color);
            line-height: 24px;
            word-break: break-word;
          }

          :host .pr-container--draft .pr-title {
            filter: saturate(0.4);
          }
          :host .pr-container--draft .pr-title-name {
            opacity: 0.7;
          }

          :host .pr-meta {
            color: var(--dimmed-font-color);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
          }

          :host .pr-labels {
            display: flex;
            flex-flow: row wrap;
            padding: 4px 0;
          }

          :host .pr-label {
            padding-right: 8px;
          }
          :host .pr-label-dot {
            border-radius: 4px;
            box-shadow: rgb(0 0 0 / 28%) 0 0 3px 0;
            display: inline-block;
            width: 8px;
            height: 8px;
          }
          :host .pr-label-name {
            padding-left: 3px;
          }

          :host .pr-people {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
          }

          :host .pr-author {

          }
          :host .pr-author-value {
            display: inline-flex;
            flex-direction: row;
            gap: 6px;
            align-items: center;
            vertical-align: bottom;
            padding-left: 6px;
          }
          :host .pr-author-value--hot:before {
            content: "★";
            color: var(--star-font-color);
          }
          :host .pr-author-value--ghost {
            color: var(--ghost-font-color);
            font-weight: 600;
          }

          :host .pr-author-avatar {
            background-size: cover;
            border-radius: 2px;
            display: inline-block;
            width: 16px;
            height: 16px;
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
            :host .pr-meta {
              flex-wrap: wrap;
            }
            :host .pr-labels {
              width: 100%;
              justify-content: space-between;
            }
          }
        `;
    }

    @property({ type: String }) id = '';
    @property({ type: String }) title = '';
    @property({ type: Array }) authors = [];
    @property({ type: String, reflect: true }) url = '';
    @property({ type: String }) created_at = '';
    @property({ type: String }) updated_at = '';
    @property({ type: Array }) labels = [];

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
            <div class="pr-container ${(this.draft ? "pr-container--draft" : "")}">
                <div class="pr-title">
                    <span class="pr-title-name">${this.title}</span>
                </div>

                <div class="pr-meta">
                    <div class="pr-labels">
                        ${filteredLabels.map((item) => {
                            return html`
                                <span
                                    class="pr-label"
                                >
                                    <span
                                        class="pr-label-dot"
                                        style="background-color: ${item.color}"
                                    ></span>
                                    <span
                                        class="pr-label-name"
                                    >
                                        ${item.name}
                                    </span>
                                </span>
                            `;
                        })}
                    </div>

                    <div class="pr-people">
                        <div>
                            <span>submitted as </span>
                            <a
                                href="${this.url}"
                                target="_blank"
                                title="Open PR #${this.id} on GitHub"
                            >
                                GH-${this.id}
                            </a>
                        </div>
                        <div class="pr-author">
                            <span>by </span>
                            ${this.authors.map((author) => {
                                const authorClassList = [ "pr-author-value" ];
                                if (author.pull_count > 12) {
                                    authorClassList.push("pr-author-value--hot");
                                }
                                if (author.id === "") {
                                    authorClassList.push("pr-author-value--ghost");
                                }

                                return html`
                                    <a
                                        class="${authorClassList.join(" ")}"
                                        href="https://github.com/godotengine/godot/pulls/${author.user}"
                                        target="_blank"
                                        title="Open all PRs by ${author.user}"
                                    >
                                      <span
                                        class="pr-author-avatar"
                                        style="background-image: url('${author.avatar}')"
                                      >

                                      </span>
                                        ${author.user}
                                    </a>
                                `;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
