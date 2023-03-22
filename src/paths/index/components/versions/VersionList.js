import { LitElement, html, css, customElement, property } from 'lit-element';

import VersionItem from "./VersionItem";

@customElement('gr-version-list')
export default class VersionList extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --versions-background-color: #fcfcfa;
            --versions-border-color: #515c6c;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --versions-background-color: #0d1117;
              --versions-border-color: #515c6c;
            }
          }

          /** Component styling **/
          :host {
            position: relative;
          }

          :host .version-list {
            background-color: var(--versions-background-color);
            border-right: 2px solid var(--versions-border-color);
            width: 200px;
            min-height: 216px;
          }

          :host .version-list-sub {
            filter: saturate(0.35) brightness(1.0);
            margin: 4px 0 4px 12px;
          }
          @media (prefers-color-scheme: dark) {
            :host .version-list-sub {
              filter: saturate(0.15) brightness(1.1);
            }
          }

          :host .branch-selector {
            display: none;
            position: absolute;
            top: 32px;
            left: 0;
            right: 0;
            flex-direction: column;
            gap: 4px;
            background-color: var(--g-background-extra2-color);
            border-top: 2px solid var(--g-background-color);
            border-bottom: 2px solid var(--g-background-color);
            padding: 10px 14px;
          }
          :host .branch-selector.branch-selector--active {
            display: flex;
          }

          :host .branch-selector ul {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
            list-style: none;
            margin: 0;
            padding: 0;
          }

          :host .branch-selector ul li {
            color: var(--link-font-color);
            cursor: pointer;
            padding: 2px 0;
          }
          :host .branch-selector ul li:hover {
            color: var(--link-font-color-hover);
          }

          @media only screen and (max-width: 900px) {
            :host {
              width: 100%
            }

            :host .version-list {
              width: 100% !important;
            }

            :host .branch-selector {
              border-top-width: 4px;
              border-bottom-width: 4px;
              font-size: 105%;
              padding: 16px 24px;
              top: 40px;
            }

            :host .branch-selector ul {
              gap: 4px;
            }

            :host .branch-selector ul li {
              padding: 4px 8px;
            }
          }
        `;
    }

    @property({ type: Array }) versions = [];

    @property({ type: Array }) loadingVersions = [];

    @property({ type: Array }) toggledVersions = [];
    @property({ type: String }) selectedVersion = "";
    @property({ type: String }) selectedRelease = "";

    constructor() {
        super();
    }

    _toggleEntry(versionType, versionName, failOnMatch) {
      if (versionType === "main") {
        const entryIndex = this.toggledVersions.indexOf(versionName);
        if (entryIndex >= 0) {
          if (!failOnMatch) {
            this.toggledVersions.splice(entryIndex, 1);
          }
        } else {
          this.toggledVersions.push(versionName);
        }

        this.requestUpdate();
      }
    }

    _onItemClicked(versionType, versionName, releaseName) {
      //this._toggleEntry(versionType, versionName, true);

      this.dispatchEvent(greports.util.createEvent("versionclick", {
          "type": versionType,
          "version": versionName,
          "release": releaseName,
      }));
    }

    _onItemIconClicked(versionType, versionName, releaseName) {
      this._toggleEntry(versionType, versionName, false);

      if (versionType === "sub") {
        this.dispatchEvent(greports.util.createEvent("versionclick", {
            "type": versionType,
            "version": versionName,
            "release": releaseName,
        }));
      }
    }

    render() {
        return html`
            <div class="version-list">
                ${this.versions.map((item) => {
                    return html`
                        <div class="version-list-main">
                            <gr-version-item
                                .name="${item.name}"
                                .type="${"main"}"
                                ?active="${this.selectedVersion === item.name}"
                                ?expanded="${this.toggledVersions.includes(item.name)}"
                                ?loading="${this.loadingVersions.includes(item.name)}"
                                @click="${this._onItemClicked.bind(this, "main", item.name, "")}"
                                @iconclick="${this._onItemIconClicked.bind(this, "main", item.name, "")}"
                            ></gr-version-item>

                            ${(this.toggledVersions.includes(item.name)) ? 
                              html`
                                <div class="version-list-sub">
                                    ${item.releases.map((release) => {
                                        return html`
                                            <gr-version-item
                                                .name="${release.name}"
                                                .type="${"sub"}"
                                                ?active="${this.selectedVersion === item.name && this.selectedRelease === release.name}"
                                                @click="${this._onItemClicked.bind(this, "sub", item.name, release.name)}"
                                                @iconclick="${this._onItemIconClicked.bind(this, "sub", item.name, release.name)}"
                                            ></gr-version-item>
                                        `; 
                                    })}
                                </div>
                              ` : null
                            }
                        </div>
                    `;
                })}
            </div>
        `;
    }
}
