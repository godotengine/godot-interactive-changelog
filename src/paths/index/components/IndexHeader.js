import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-index-entry')
export default class IndexHeader extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --header-meta-color: #98a5b8;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --header-meta-color: #515c6c;
            }
          }

          /** Component styling **/
          :host {
          }

          :host .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          :host .header-metadata {
            color: var(--header-meta-color);
            text-align: right;
          }
          :host .header-metadata a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host .header-metadata a:hover {
            color: var(--link-font-color-hover);
          }

          @media only screen and (max-width: 900px) {
            :host .header {
              flex-wrap: wrap;
              text-align: center;
            }
            :host .header-title,
            :host .header-metadata {
              width: 100%;
            }
            :host .header-metadata {
              padding-bottom: 12px;
              text-align: center;
            }
          }
        `;
    }

    @property({ type: Date }) generated_at = null;

    constructor() {
        super();

        // Auto-refresh about once a minute so that the relative time of generation is always actual.
        this._refreshTimeout = setTimeout(this._refresh.bind(this), 60 * 1000);
    }

    _refresh() {
        this.requestUpdate();

        // Continue updating.
        this._refreshTimeout = setTimeout(this._refresh.bind(this), 60 * 1000);
    }

    render() {
        let generatedAt = "";
        let generatedRel = "";

        if (this.generated_at) {
            generatedAt = greports.format.formatTimestamp(this.generated_at);

            let timeValue = (Date.now() - this.generated_at) / (1000 * 60);
            let timeUnit = "minute";

            if (timeValue < 1) {
                generatedRel = "just now";
            } else {
                if (timeValue > 60) {
                    timeValue = timeValue / 60;
                    timeUnit = "hour";
                }

                generatedRel = greports.format.formatTimespan(-Math.round(timeValue), timeUnit);
            }
        }

        return html`
            <div class="header">
                <h1 class="header-title">
                    Godot Interactive Changelog
                </h1>
                <div class="header-metadata">
                    ${(this.generated_at ? html`
                        <span title="${generatedAt}">
                            data generated ${generatedRel}
                        </span>
                    ` : '')}
                    <br/>
                    <a
                            href="https://github.com/godotengine/godot-interactive-changelog"
                            target="_blank"
                    >
                        contribute on GitHub
                    </a>
                </div>
            </div>
        `;
    }
}