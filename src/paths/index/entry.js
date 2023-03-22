import { LitElement, html, css, customElement, property } from 'lit-element';

import PageContent from 'src/shared/components/PageContent';
import SharedNavigation from 'src/shared/components/SharedNavigation';
import IndexHeader from "./components/IndexHeader";
import IndexDescription from "./components/IndexDescription";

import VersionList from "./components/versions/VersionList";

@customElement('entry-component')
export default class EntryComponent extends LitElement {
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

          :host .versions {
            display: flex;
            padding: 24px 0;
          }

          @media only screen and (max-width: 900px) {
            :host .versions {
              flex-wrap: wrap;
            }
          }
        `;
    }

    constructor() {
        super();

        this._entryRequested = false;
        this._isLoading = true;
        this._loadingVersions = [];

        this._versions = [];
        this._versionData = {};

        this._selectedRepository = "godotengine/godot";
        this._selectedVersion = "";
        this._selectedRelease = "";

        this._restoreUserPreferences();
        this._requestData();
    }

    performUpdate() {
        this._requestData();
        super.performUpdate();
    }

    _restoreUserPreferences() {
        const userPreferences = greports.util.getLocalPreferences();

        // ...
    }

    _saveUserPreferences() {
        const currentPreferences = {
            // ...
        };

        greports.util.setLocalPreferences(currentPreferences);
    }

    async _requestData() {
        if (this._entryRequested) {
            return;
        }
        this._entryRequested = true;
        this._isLoading = true;

        const data = await greports.api.getVersionList(this._selectedRepository);

        if (data) {
            this._versions = data;

            this._versions.forEach((version) => {
                version.pull_count = 0;
                version.releases.forEach((release) => {
                    release.pull_count = 0;
                });
            });
        } else {
            this._versions = [];
        }

        this._isLoading = false;
        this.requestUpdate();

        this._versions.forEach((version) => {
            this._requestVersionData(version);
        });
    }

    async _requestVersionData(version) {
        // Start loading, show the indicator.
        this._loadingVersions.push(version.name);
        
        const versionData = await greports.api.getVersionData(this._selectedRepository, version.name);
        this._versionData[version.name] = versionData;

        // Calculate number of changes for the version, and each if its releases.
        const commitLog = versionData.log;
        commitLog.reverse();

        version.pull_count = commitLog.length;
        version.releases.forEach((release) => {
            release.pull_count = 0;

            let counting = false;
            commitLog.forEach((commitHash, index) => {
                if (counting) {
                    release.pull_count += 1;
                }

                // We need to check indices for some refs, because they are not written
                // in the commit hash format.

                // Start counting.
                if (release.from_ref === version.from_ref && index === 0) {
                    counting = true;
                    // HACK: Exclude the lower end by default, but include for the first range.
                    release.pull_count += 1;
                }
                else if (commitHash === release.from_ref) {
                    counting = true;
                }

                // Stop counting.
                if (release.ref === version.ref && index === (commitLog.length - 1)) {
                    counting = false;
                }
                else if (commitHash === release.ref) {
                    counting = false;
                }
            });
        });

        // Finish loading, hide the indicator.
        const index = this._loadingVersions.indexOf(version.name);
        this._loadingVersions.splice(index, 1);
        this.requestUpdate();
    }

    _onVersionClicked(event) {
        this._selectedVersion = event.detail.version;
        this._selectedRelease = event.detail.release;
        this.requestUpdate();

        window.scrollTo(0, 0);
    }

    render(){
        // Dereferencing to ensure it triggers an update.
        const [...versions] = this._versions;
        const [...loadingVersions] = this._loadingVersions;

        return html`
            <page-content>
                <shared-nav></shared-nav>
                <gr-index-entry></gr-index-entry>
                <gr-index-description></gr-index-description>

                ${(this._isLoading ? html`
                    <h3>Loading...</h3>
                ` : html`
                    <div class="versions">
                        <gr-version-list
                            .versions="${versions}"
                            .loadingVersions="${loadingVersions}"
                            .selectedVersion="${this._selectedVersion}"
                            .selectedRelease="${this._selectedRelease}"
                            @versionclick="${this._onVersionClicked}"
                        ></gr-version-list>
                    </div>
                `)}
            </page-content>
        `;
    }
}
