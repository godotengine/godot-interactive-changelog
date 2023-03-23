import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-change-label')
export default class ChangeItemLabel extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {

          }

          @media (prefers-color-scheme: dark) {
            :host {

            }
          }

          /** Component styling **/
          :host {

          }

          :host .item-labels {
            display: flex;
            flex-flow: row wrap;
            padding: 4px 0;
          }

          :host .item-label {
            padding-right: 8px;
          }
          :host .item-label-dot {
            border-radius: 4px;
            box-shadow: rgb(0 0 0 / 28%) 0 0 3px 0;
            display: inline-block;
            width: 8px;
            height: 8px;
            filter: brightness(0.75);
          }
          :host .item-label-name {
            padding-left: 3px;
          }

          @media only screen and (max-width: 900px) {
            :host .item-labels {
              width: 100%;
              justify-content: space-between;
            }
          }
        `;
    }

    @property({ type: String, reflect: true }) name = '';
    @property({ type: String }) color = '';

    render(){
        return html`
        <span class="item-label">
            <span
                class="item-label-dot"
                style="background-color: ${this.color}"
            ></span>
            <span class="item-label-name">
                ${this.name}
            </span>
        </span>
    `;
    }
}
