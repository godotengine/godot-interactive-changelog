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

    @property({ type: String }) current_mode = "";

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
            </div>
        `;
    }
}
