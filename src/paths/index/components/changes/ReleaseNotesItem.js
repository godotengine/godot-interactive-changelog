import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-release-notes')
export default class ReleaseNotesItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
            --changes-type-color-hover: #2862cd;
            --changes-type-color-active: #2054b5;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
              --changes-type-color-hover: #5b87de;
              --changes-type-color-active: #6b9aea;
            }
          }

          /** Component styling **/
          :host {
            border-bottom: 3px solid var(--item-border-color);
            display: block;
            padding: 14px 12px 20px 12px;
          }

          :host a {
            color: var(--link-font-color);
            text-decoration: none;
          }
          :host a:hover {
            color: var(--link-font-color-hover);
          }

          :host .item-changes-types {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            gap: 16px;
          }

          :host .item-changes-type {
            color: var(--light-font-color);
            cursor: pointer;
          }
          :host .item-changes-type:hover {
            color: var(--link-font-color-hover);
          }
          :host .item-changes-type.item-changes--active {
            color: var(--changes-type-color-active);
            text-decoration: underline;
          }
          :host .item-changes-type.item-changes--active:hover {
            color: var(--changes-type-color-hover);
          }

          :host .item-changes-list {
            display: none;
            line-height: 24px;
            padding-left: 20px;
          }
          :host .item-changes-list.item-changes--active {
            display: block;
          }

          :host .item-changes-markdown {
            display: none;
            background: var(--g-background-color);
            border-radius: 4px 4px;
            font-size: 14px;
            margin-top: 12px;
            padding: 12px 16px;
          }
          :host .item-changes-markdown.item-changes--active {
            display: block;
          }

          :host .item-change-group {
            font-weight: 600;
          }

          @media only screen and (max-width: 900px) {
            :host {
              padding: 14px 0 20px 0;
            }
          }

          @media only screen and (max-width: 640px) {
            :host .item-container {
                padding: 0 10px;
            }
          }
        `;
    }

    @property({ type: Array }) pulls = [];

    @property({ type: String }) repository = '';

    constructor() {
        super();

        this._viewMode = "pretty";

        this._sorted_notes = [];
    }

    _onModeClicked(type) {
        if (type === this._viewMode) {
            return;
        }

        this._viewMode = type;
        this.requestUpdate();
    }

    _humanizeName(name) {
        switch (name) {
            case "2d":
                return "2D";
            case "3d":
                return "3D";
            case "dotnet":
                return "C#";
            case "gdextension":
                return "GDExtension";
            case "gdscript":
                return "GDScript";
            case "gui":
                return "GUI";
            case "visualscript":
                return "VisualScript";
            case "xr":
                return "XR";
        }

        return name.charAt(0).toUpperCase() + name.substring(1);
    }

    _updateNotes() {
        this._sorted_notes = [];

        const generalTopics = [
            "buildsystem", "porting", "tests", "thirdparty", "2d", "3d", "editor", "codestyle", "core"
        ];
        let groupedNotes = {};
        this.pulls.forEach((pull) => {
            // We use labels to deduce which category does the change
            // fall under. We consider more specific groups before more
            // general ones. When in doubt, pick any group.
            let groupName = "core";

            // Simplify the array.
            const allLabels = pull.labels.map(item => item.name);

            // Extract all applied topical labels.
            let topicLabels = allLabels
                .filter((item) => {
                    return item.startsWith("topic:");
                })
                .map((item) => {
                    return item.substring(6);
                });

            // Find the first topical label which is not generic, and
            // use it.
            const firstLabel = topicLabels.find((item) => {
                return generalTopics.indexOf(item) < 0;
            });

            if (firstLabel) {
                groupName = firstLabel;
            } else {
                // If there is none, pick a general topic, in order of relevance.
                let topicFound = false;
                for (let name of generalTopics) {
                    if (topicLabels.indexOf(name) >= 0) {
                        groupName = name;
                        topicFound = true;
                        break;
                    }
                }

                // Besides topical labels, we can also check some other ones.
                if (!topicFound) {
                    if (allLabels.indexOf("documentation") >= 0) {
                        groupName = "documentation";
                    }
                    else if (allLabels.indexOf("usability") >= 0) {
                        groupName = "editor";
                    }
                }
            }

            // If no group was detected, we just stay on "core".

            // Store under the determined group.
            const humanizedName = this._humanizeName(groupName);
            if (typeof groupedNotes[humanizedName] === "undefined") {
                groupedNotes[humanizedName] = [];
            }
            groupedNotes[humanizedName].push(pull);
        });

        const groupNames = Object.keys(groupedNotes);
        groupNames.sort((a, b) => {
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            return 0;
        });

        groupNames.forEach((group) => {
            const pulls = groupedNotes[group];
            pulls.sort((a, b) => {
                if (a.public_id > b.public_id) return 1;
                if (a.public_id < b.public_id) return -1;
                return 0;
            });

            pulls.forEach((item) => {
                let cleanTitle = item.title;

                // Some PR titles contain the same group prefix already,
                // so we're going to remove it for a cleaner look.
                if (cleanTitle.startsWith(`${group}:`)) {
                    cleanTitle = cleanTitle.substring(group.length + 1).trim();
                }

                this._sorted_notes.push({
                    "group": group,
                    "title": cleanTitle,
                    "public_id": item.public_id,
                });
            });
        });
    }

    update(changedProperties) {
        // Only recalculate when class properties change; skip for manual updates.
        if (changedProperties.size > 0) {
            this._updateNotes();
        }

        super.update(changedProperties);
    }

    render(){
        return html`
            <div class="item-container">
                <div class="item-changes">
                    <div class="item-changes-types">
                        <span
                            class="item-changes-type ${(this._viewMode === "pretty" ? "item-changes--active" : "")}"
                            @click="${this._onModeClicked.bind(this, "pretty")}"
                        >
                            pretty
                        </span>
                        <span
                            class="item-changes-type ${(this._viewMode === "markdown" ? "item-changes--active" : "")}"
                            @click="${this._onModeClicked.bind(this, "markdown")}"
                        >
                            markdown
                        </span>
                    </div>

                    <ul class="item-changes-list ${(this._viewMode === "pretty" ? "item-changes--active" : "")}"">
                        ${this._sorted_notes.map((item) => {
                            return html`
                                <li>
                                    <span class="item-change-group">
                                        ${item.group}:
                                    </span>
                                    <span>
                                        ${item.title}
                                    </span>
                                    <code>
                                        (<a
                                            class="item-changes-link"
                                            href="https://github.com/${this.repository}/pull/${item.public_id}"
                                            target="_blank"
                                        >GH-${item.public_id}</a>)
                                    </code>
                                </li>
                            `;
                        })}
                    </ul>

                    <div class="item-changes-markdown ${(this._viewMode === "markdown" ? "item-changes--active" : "")}"">
                        <code>
                            ${this._sorted_notes.map((item) => {
                                return html`
                                    - ${item.group}: ${item.title} ([GH-${item.public_id}](https://github.com/${this.repository}/pull/${item.public_id}))
                                    <br>
                                `;
                            })}
                        </code>
                    </div>
                </div>
            </div>
        `;
    }
}
