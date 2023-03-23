import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-change-author')
export default class ChangeItemAuthor extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --star-font-color: #ffcc31;
            --ghost-font-color: #738b99;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --star-font-color: #e0c537;
              --ghost-font-color: #495d68;
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

          :host .item-author {
            display: inline-flex;
            flex-direction: row;
            gap: 6px;
            align-items: center;
            vertical-align: bottom;
            padding-left: 6px;
          }
          :host .item-author--hot:before {
            content: "★";
            color: var(--star-font-color);
          }
          :host .item-author--ghost {
            color: var(--ghost-font-color);
            font-weight: 600;
          }

          :host .item-author-avatar {
            background-size: cover;
            border-radius: 2px;
            display: inline-block;
            width: 16px;
            height: 16px;
          }

          @media only screen and (max-width: 900px) {
            :host {
            }
          }
        `;
    }

    @property({ type: String }) id = '';
    @property({ type: String, reflect: true }) user = '';
    @property({ type: String }) avatar = '';
    @property({ type: Boolean }) is_hot = false;

    @property({ type: String }) url = '';
    @property({ type: String }) url_title = '';

    render(){
        const authorClassList = [ "item-author" ];
        if (this.is_hot) {
            // TODO: Either restore or remove it, but it's rather noisy as it is.
            //authorClassList.push("item-author--hot");
        }
        if (this.id === "") {
            authorClassList.push("item-author--ghost");
        }

        return html`
            <a
                class="${authorClassList.join(" ")}"
                href="${this.url}"
                target="_blank"
                title="${this.url_title}"
            >
                <span
                    class="item-author-avatar"
                    style="background-image: url('${this.avatar}')"
                ></span>
                ${this.user}
            </a>
        `;
    }
}
