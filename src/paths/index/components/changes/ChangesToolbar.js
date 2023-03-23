import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-changes-toolbar')
export default class ChangesToolbar extends LitElement {
  static get styles() {
    return css`
          /** Colors and variables **/
          :host {
            --changes-toolbar-color: #9bbaed;
            --changes-toolbar-accent-color: #5a6f90;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --changes-toolbar-color: #222c3d;
              --changes-toolbar-accent-color: #566783;
            }
          }

          /** Component styling **/
          :host {
          }

          :host .version-changes-toolbar {
            background: var(--changes-toolbar-color);
            border-radius: 4px;
            display: flex;
            flex-direction: row;
            gap: 20px;
            padding: 10px 14px;
            margin-bottom: 6px;
          }

          :host .changes-count {
            display: flex;
            flex-direction: row;
            gap: 6px;
            font-size: 15px;
          }
          :host .changes-count strong {
            font-size: 18px;
          }
          :host .changes-count-label {
            color: var(--dimmed-font-color);
          }

          @media only screen and (max-width: 900px) {
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

  @property({ type: Number }) pull_count = 0;
  @property({ type: Number }) commit_count = 0;
  @property({ type: Number }) author_count = 0;

  render() {
    return html`
        <div class="version-changes-toolbar">
            <div class="changes-count">
                <strong>${this.commit_count}</strong>
                <span class="changes-count-label">
                    ${(this.commit_count === 1 ? "commit" : "commits")}
                </span>
            </div>
            <div class="changes-count">
                <strong>${this.pull_count}</strong>
                <span class="changes-count-label">
                    ${(this.pull_count === 1 ? "pull-request" : "pull-requests")}
                </span>
            </div>
            <div class="changes-count">
                <strong>${this.author_count}</strong>
                <span class="changes-count-label">
                    ${(this.author_count === 1 ? "contributor" : "contributors")}
                </span>
            </div>
        </div>
    `;
  }
}
