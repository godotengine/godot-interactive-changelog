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
            background-color: rgba(0, 0, 0, 0.08);
            filter: saturate(0.35) brightness(1.0);
            padding: 4px 0 4px 12px;
          }
          @media (prefers-color-scheme: dark) {
            :host .version-list-sub {
              background-color: rgba(255, 255, 255, 0.08);
              filter: saturate(0.15) brightness(1.1);
            }
          }

          @media only screen and (max-width: 900px) {
            :host {
              width: 100%
            }

            :host .version-list {
              width: 100% !important;
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

    update(changedProperties) {
        // Check if the version list was set, this should only happen once.
        if (changedProperties.size > 0) {
            const oldVersions = changedProperties.get("versions");
            // When this happens, we should unfold the selected version,
            // because it came from the URL slug.
            if (typeof oldVersions === "undefined" && typeof this.versions !== "undefined") {
                this._toggleEntry("main", this.selectedVersion);
            }
        }

        super.update(changedProperties);
    }

    render() {
        return html`
            <div class="version-list">
                ${this.versions.map((item) => {
                    let versionFlavor = "patch";
                    let versionBits = item.name.split(".");
                    if (versionBits.length === 2) {
                        versionFlavor = (versionBits[1] === "0" ? "major" : "minor");
                    }

                    return html`
                        <div class="version-list-main">
                            <gr-version-item
                                .name="${item.name}"
                                .type="${"main"}"
                                .flavor="${versionFlavor}"
                                .pull_count="${item.commit_log.length}"
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
                                                .flavor="${"preview"}"
                                                .pull_count="${release.commit_log.length}"
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
