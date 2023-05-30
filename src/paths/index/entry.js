import { LitElement, html, css, customElement, property } from 'lit-element';

import PageContent from 'src/shared/components/PageContent';
import SharedNavigation from 'src/shared/components/SharedNavigation';
import IndexHeader from "./components/IndexHeader";
import IndexDescription from "./components/IndexDescription";

import VersionList from "./components/versions/VersionList";
import ChangesList from "./components/changes/ChangesList";

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

            let releaseNames = {};
            this._versions.forEach((version) => {
                releaseNames[version.name] = [];

                version.commit_log = [];
                version.releases.forEach((release) => {
                    release.commit_log = [];

                    releaseNames[version.name].push(release.name);
                });
            });

            const requested_slug = greports.util.getHistoryHash();
            if (requested_slug !== "") {
                const slug_bits = requested_slug.split("-");

                if (slug_bits[0] !== "" && typeof releaseNames[slug_bits[0]] !== "undefined") {
                    this._selectedVersion = slug_bits[0];

                    if (slug_bits.length > 1 && releaseNames[slug_bits[0]].indexOf(slug_bits[1]) >= 0) {
                        this._selectedRelease = slug_bits[1];
                    } else {
                        this._selectedRelease = "";
                    }
                }
            }
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

        if (versionData) {
            versionData.config = version;
            this._versionData[version.name] = versionData;

            // Calculate number of changes for the version, and each if its releases.
            const [...commitLog] = versionData.log;
            commitLog.reverse();

            // We need to filter out all merge commits for display and the count.
            version.commit_log = [];
            commitLog.forEach((commitHash) => {
                const commit = versionData.commits[commitHash];
                if (commit.is_merge) {
                    return; // Continue.
                }

                version.commit_log.push(commitHash);
            });

            version.releases.forEach((release) => {
                release.commit_log = [];

                if (typeof versionData.release_logs[release.name] === "undefined") {
                    return; // Continue. This is a bug though.
                }

                const [...releaseLog] = versionData.release_logs[release.name];
                releaseLog.reverse();

                releaseLog.forEach((commitHash) => {
                    const commit = versionData.commits[commitHash];
                    if (commit.is_merge) {
                        return; // Continue.
                    }

                    release.commit_log.push(commitHash);
                });
            });
        }

        // Finish loading, hide the indicator.
        const index = this._loadingVersions.indexOf(version.name);
        this._loadingVersions.splice(index, 1);
        this.requestUpdate();
    }

    _onVersionClicked(event) {
        this._selectedVersion = event.detail.version;
        this._selectedRelease = event.detail.release;
        this.requestUpdate();

        let versionString = event.detail.version;
        if (event.detail.release !== "") {
            versionString += `-${event.detail.release}`;
        }
        greports.util.setHistoryHash(versionString);
        window.scrollTo(0, 0);
    }

    render() {
        // Dereferencing to ensure it triggers an update.
        const [...versions] = this._versions;
        const [...loadingVersions] = this._loadingVersions;

        let version = {};
        let authors = {};
        let commits = {};
        let pulls = {};

        if (this._selectedVersion !== "" && typeof this._versionData[this._selectedVersion] !== "undefined") {
            const versionData = this._versionData[this._selectedVersion];

            version = versionData.config;
            authors = versionData.authors;
            commits = versionData.commits;
            pulls = versionData.pulls;
        }

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

                        ${(this._selectedVersion !== "" ? html`
                            <gr-changes-list
                                .version=${version}
                                .authors="${authors}"
                                .commits="${commits}"
                                .pulls="${pulls}"

                                .selectedRepository="${this._selectedRepository}"
                                .selectedVersion="${this._selectedVersion}"
                                .selectedRelease="${this._selectedRelease}"
                                ?loading="${loadingVersions.indexOf(this._selectedVersion) >= 0}"
                            ></gr-changes-list>
                        ` : null)}
                    </div>
                `)}
            </page-content>
        `;
    }
}
