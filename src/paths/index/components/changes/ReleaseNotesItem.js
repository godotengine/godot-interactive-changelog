import { LitElement, html, css, customElement, property } from 'lit-element';
import marked from 'marked';

@customElement('gr-release-notes')
export default class ReleaseNotesItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --item-border-color: #fcfcfa;
            --changes-type-color-hover: #2862cd;
            --changes-type-color-active: #2054b5;
            --copy-status-color-success: #69be00;
            --copy-status-color-failure: #f53e13;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --item-border-color: #0d1117;
              --changes-type-color-hover: #5b87de;
              --changes-type-color-active: #6b9aea;
              --copy-status-color-success: #74cb23;
              --copy-status-color-failure: #e34c28;
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
            gap: 14px;
          }

          :host .item-changes-type {
            color: var(--light-font-color);
            cursor: pointer;
            font-weight: 600;
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

          @keyframes status-change-success {
            from {
              color: var(--copy-status-color-success);
            }
            to {
              color: var(--light-font-color);
            }
          }

          @keyframes status-change-failure {
            from {
              color: var(--copy-status-color-failure);
            }
            to {
              color: var(--light-font-color);
            }
          }

          :host .item-changes-status--success {
            animation-name: status-change-success;
            animation-duration: 2.5s;
            animation-timing-function: cubic-bezier(0, 0, 1, -0.1);
          }
          :host .item-changes-status--failure {
            animation-name: status-change-failure;
            animation-duration: 2.5s;
            animation-timing-function: cubic-bezier(0, 0, 1, -0.1);
          }

          :host .item-changes-list {
            display: none;
            line-height: 24px;
          }
          :host .item-changes-list.item-changes--active {
            display: block;
          }

          :host .item-changes-list ul {
            padding-left: 20px;
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

          :host .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 100;
            background: #1f2430;
            border: 1px solid #383d4c;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            min-width: 180px;
            margin-top: 5px;
            padding: 8px 0;
            color: #c6d0e0;
          }

          :host .dropdown-header {
            padding: 5px 15px;
            font-size: 12px;
            color: #8992a4;
            border-bottom: 1px solid #383d4c;
          }

          :host .dropdown-item {
            padding: 8px 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
          }

          :host .dropdown-item input {
            margin-right: 8px;
          }

          :host .dropdown-item:hover, :host .dropdown-item.selected {
            background: #2c3241;
          }

          :host .dropdown-clear {
            padding: 8px 15px;
            cursor: pointer;
            border-top: 1px solid #383d4c;
            color: #3f8cff;
          }

          :host .item-changes-filter {
            position: relative;
            display: inline-block;
          }
        `;
    }

    @property({ type: Array }) pulls = [];

    @property({ type: String }) repository = '';

    constructor() {
        super();

        this._viewMode = "pretty";
        this._groupMode = "grouped";

        this._sortedNotes = [];
        this._groupedNotes = [];
        this._copiableUnifiedText = "";
        this._copiableGroupedText = "";
        this._copyStatus = "idle";

        // Available label filters
        this._availableLabels = ['bug', 'regression', 'enhancement', 'documentation'];
        this._selectedLabels = [];
        this._dropdownOpen = false;
    }

    _onViewModeClicked(type) {
        if (type === this._viewMode) {
            return;
        }

        this._viewMode = type;
        this.requestUpdate();
    }

    _onGroupModeClicked(type) {
        if (type === this._groupMode) {
            return;
        }

        this._groupMode = type;
        this.requestUpdate();
    }

    _onCopyClicked() {
      this._copyStatus = "idle";
      this.requestUpdate();

      const copiableText = (this._groupMode === "grouped" ? this._copiableGroupedText : this._copiableUnifiedText);

      navigator.clipboard
          .writeText(copiableText)
          .then((res) => {
            this._copyStatus = "success";
            this.requestUpdate();
          })
          .catch((err) => {
              console.error("Copying failed: " + err);
              this._copyStatus = "failure";
              this.requestUpdate();
          });
    }

    _toggleDropdown() {
        this._dropdownOpen = !this._dropdownOpen;
        this.requestUpdate();
    }

    _toggleLabel(labelName) {
        if (this._selectedLabels.includes(labelName)) {
            this._selectedLabels = this._selectedLabels.filter(label => label !== labelName);
        } else {
            this._selectedLabels = [...this._selectedLabels, labelName];
        }

        this._updateNotes();
        this.requestUpdate();
    }

    _clearLabelFilters() {
        this._selectedLabels = [];
        this._updateNotes();
        this.requestUpdate();
    }

    _updateNotes() {
        this._sortedNotes = [];
        this._groupedNotes = [];
        this._copiableUnifiedText = "";
        this._copiableGroupedText = "";

        // Filter pulls based on selected labels (if any)
        const filteredPulls = this._selectedLabels.length === 0
            ? this.pulls
            : this.pulls.filter((pull) => {
                if (!pull.labels) return false;

                return pull.labels.some(label =>
                    this._selectedLabels.includes(label.name)
                );
            });

        let groupedNotes = {};
        filteredPulls.forEach((pull) => {
            // Store under the determined group.
            if (typeof groupedNotes[pull.group_name] === "undefined") {
                groupedNotes[pull.group_name] = [];
            }
            groupedNotes[pull.group_name].push(pull);
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

            if (this._copiableGroupedText !== "") {
                this._copiableGroupedText += "\n";
            }
            this._copiableGroupedText += `#### ${group}\n\n`

            let groupItems = [];
            pulls.forEach((pull) => {
                const item = {
                  "group": group,
                  "title": pull.title,
                  "public_id": pull.public_id,
              };

                this._sortedNotes.push(item);
                groupItems.push(item);

                this._copiableUnifiedText += `- ${group}: ${pull.title} ([GH-${pull.public_id}](https://github.com/${this.repository}/pull/${pull.public_id})).\n`;
                this._copiableGroupedText += `- ${pull.title} ([GH-${pull.public_id}](https://github.com/${this.repository}/pull/${pull.public_id})).\n`;
            });

            this._groupedNotes.push({
              "name": group,
              "pulls": groupItems,
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

    _parseMarkdown(text) {
        // Parse markdown but only return the inner content without wrapping <p> tags
        return marked(text).replace(/<\/?p>/g, '');
    }

    _renderUnifiedItem(viewMode, item) {
        return (viewMode === "pretty" ? html`
            <li>
                <span class="item-change-group">
                    ${item.group}:
                </span>
                <span>
                    ${html([this._parseMarkdown(item.title)])}
                </span>
                <code>
                    (<a
                        class="item-changes-link"
                        href="https://github.com/${this.repository}/pull/${item.public_id}"
                        target="_blank"
                    >GH-${item.public_id}</a>).
                </code>
            </li>
        ` : html`
            - ${item.group}: ${item.title} ([GH-${item.public_id}](https://github.com/${this.repository}/pull/${item.public_id})).
            <br>
        `);
    }

    _renderGroupedItem(viewMode, item) {
        return (viewMode === "pretty" ? html`
            <li>
                <span>
                    ${html([this._parseMarkdown(item.title)])}
                </span>
                <code>
                    (<a
                        class="item-changes-link"
                        href="https://github.com/${this.repository}/pull/${item.public_id}"
                        target="_blank"
                    >GH-${item.public_id}</a>).
                </code>
            </li>
        ` : html`
            - ${item.title} ([GH-${item.public_id}](https://github.com/${this.repository}/pull/${item.public_id})).
            <br>
        `);
    }

    render(){
        return html`
            <div class="item-container">
                <div class="item-changes">
                    <div class="item-changes-types">
                        <div class="item-changes-filter">
                            <span
                                class="item-changes-type"
                                @click="${this._toggleDropdown}"
                                style="cursor: pointer;"
                            >
                                ${this._selectedLabels.length ?
                                    `Filtered (${this._selectedLabels.length})` :
                                    'Filter Labels'} ▼
                            </span>
                            ${this._dropdownOpen ? html`
                                <div class="dropdown-menu">
                                    <div class="dropdown-header">
                                        Select labels to show:
                                    </div>
                                    ${this._availableLabels.map(label => html`
                                        <div class="dropdown-item ${this._selectedLabels.includes(label) ? 'selected' : ''}" @click="${(e) => this._toggleLabel(label, e)}">
                                            <input type="checkbox" .checked="${this._selectedLabels.includes(label)}">
                                            ${label}
                                        </div>
                                    `)}
                                    ${this._selectedLabels.length ? html`
                                        <div class="dropdown-clear" @click="${this._clearLabelFilters}">
                                            Clear all filters
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                        |
                        <span
                            class="item-changes-type ${(this._viewMode === "pretty" ? "item-changes--active" : "")}"
                            @click="${this._onViewModeClicked.bind(this, "pretty")}"
                        >
                            pretty
                        </span>
                        <span
                            class="item-changes-type ${(this._viewMode === "markdown" ? "item-changes--active" : "")}"
                            @click="${this._onViewModeClicked.bind(this, "markdown")}"
                        >
                            markdown
                        </span>
                        |
                        <span
                            class="item-changes-type ${(this._groupMode === "unified" ? "item-changes--active" : "")}"
                            @click="${this._onGroupModeClicked.bind(this, "unified")}"
                        >
                            unified
                        </span>
                        <span
                            class="item-changes-type ${(this._groupMode === "grouped" ? "item-changes--active" : "")}"
                            @click="${this._onGroupModeClicked.bind(this, "grouped")}"
                        >
                            grouped
                        </span>
                        |
                        <span
                            class="item-changes-type item-changes-status--${this._copyStatus}"
                            @click="${this._onCopyClicked.bind(this)}"
                        >
                            copy active
                        </span>
                    </div>

                    <div class="item-changes-list ${(this._viewMode === "pretty" ? "item-changes--active" : "")}"">
                        ${this._groupMode === "grouped" ? html`
                            ${this._groupedNotes.map((groupItem) => {
                              return html`
                                  <h4>${groupItem.name}</h4>
                                  <ul>
                                      ${groupItem.pulls.map((item) => {
                                          return this._renderGroupedItem("pretty", item);
                                      })}
                                  </ul>
                              `;
                            })}
                        ` : html`
                            <ul>
                                ${this._sortedNotes.map((item) => {
                                    return this._renderUnifiedItem("pretty", item);
                                })}
                            </ul>
                        `}
                    </div>

                    <div class="item-changes-markdown ${(this._viewMode === "markdown" ? "item-changes--active" : "")}"">
                        <code id="item-release-notes">
                            ${this._groupMode === "grouped" ? html`
                                ${this._groupedNotes.map((groupItem, index) => {
                                    return html`
                                      ${index > 0 ? html`<br>` : ""}
                                      #### ${groupItem.name}
                                      <br><br>

                                      ${groupItem.pulls.map((item) => {
                                          return this._renderGroupedItem("markdown", item);
                                      })}
                                    `;
                                })}
                            ` : html `
                                ${this._sortedNotes.map((item) => {
                                    return this._renderUnifiedItem("markdown", item);
                                })}
                            `}
                        </code>
                    </div>
                </div>
            </div>
        `;
    }
}
