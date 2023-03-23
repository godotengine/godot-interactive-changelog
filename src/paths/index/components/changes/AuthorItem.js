import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-author-item')
export default class AuthorItem extends LitElement {
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

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
            :host .item-meta {
              flex-wrap: wrap;
            }
          }
        `;
    }

    @property({ type: String, reflect: true }) id = '';
    @property({ type: String }) user = '';

    @property({ type: String }) repository = '';

    render(){
        return html`
            <div class="item-container">
                <div class="item-title">
                    <span class="item-title-name">${this.user}</span>
                </div>

                <div class="item-meta">
                    <div></div>
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
