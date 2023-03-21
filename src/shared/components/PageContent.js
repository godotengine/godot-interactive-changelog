import { LitElement, html, css, customElement } from 'lit-element';

@customElement('page-content')
export default class PageContent extends LitElement {
  static get styles() {
    return css`
      /** Component styling **/
      :host {
        display: block;
        margin: 0 auto;
        padding: 0 12px;
        max-width: 1024px;
      }

      @media only screen and (max-width: 900px) {
        :host {
          padding: 0;
        }
      }
    `;
  }

  render(){
    return html`
      <slot></slot>
    `;
  }
}