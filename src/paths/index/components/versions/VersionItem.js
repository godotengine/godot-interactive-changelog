import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('gr-version-item')
export default class VersionItem extends LitElement {
    static get styles() {
        return css`
          /** Colors and variables **/
          :host {
            --tab-hover-background-color: rgba(0, 0, 0, 0.14);
            --tab-active-background-color: #d6e6ff;
            --tab-active-border-color: #397adf;
          }
          @media (prefers-color-scheme: dark) {
            :host {
              --tab-hover-background-color: rgba(255, 255, 255, 0.14);
              --tab-active-background-color: #2c3c55;
              --tab-active-border-color: #397adf;
            }
          }

          /** Component styling **/
          :host {
            max-width: 200px;
          }

          :host .version-item {
            border-left: 5px solid transparent;
            color: var(--g-font-color);
            cursor: pointer;
            display: flex;
            flex-direction: row;
            gap: 6px;
            padding: 6px 16px 6px 4px;
            align-items: center;
          }
          :host .version-item:hover {
            background-color: var(--tab-hover-background-color);
          }
          :host .version-item--active {
            background-color: var(--tab-active-background-color);
            border-left: 5px solid var(--tab-active-border-color);
          }

          :host .version-item--sub {
            padding: 4px 16px 4px 20px;
          }

          :host .version-icon {
            display: none;
          }

          :host .version-icon--main {
            background-image: url('dropdown.svg');
            background-size: 20px 20px;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            border-radius: 2px;
            display: inline-block;
            width: 22px;
            height: 22px;
            min-width: 22px;
            transform: rotate(-90deg);
            transition: transform .2s;
          }

          :host .version-item--expanded .version-icon--main {
            transform: rotate(0deg);
          }

          @media (prefers-color-scheme: light) {
            :host .version-icon--main {
              filter: invert(1);
            }
          }

          :host .version-title {
            font-size: 15px;
            white-space: nowrap;
            overflow: hidden;
          }

          :host .version-pull-count {
            color: var(--dimmed-font-color);
            flex-grow: 1;
            font-size: 15px;
            text-align: right;
          }
          :host .version-pull-count--hot {
            color: var(--g-font-color);
            font-weight: 700;
          }

          @keyframes loader-rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          :host .version-loader {
            background-image: url('loader.svg');
            background-size: 20px 20px;
            background-position: 50% 50%;
            background-repeat: no-repeat;
            border-radius: 2px;
            display: inline-block;
            width: 20px;
            height: 20px;
            min-width: 20px;
            animation-name: loader-rotate;
            animation-duration: 1.25s;
            animation-timing-function: steps(8);
            animation-iteration-count: infinite;
          }

          @media (prefers-color-scheme: light) {
            :host .version-loader {
              filter: invert(1);
            }
          }

          @media only screen and (max-width: 900px) {
            :host .version-item {
              padding: 10px 20px 10px 8px;
            }

            :host .version-item--sub {
              padding: 8px 20px 8px 24px;
            }

            :host .version-title,
            :host .version-pull-count {
              font-size: 18px;
            }
          }
        `;
    }

    @property({ type: String }) path = "";
    @property({ type: String, reflect: true }) name = "";
    @property({ type: String, reflect: true }) type = "";
    @property({ type: Boolean, reflect: true }) active = false;
    @property({ type: Boolean, reflect: true }) expanded = false;
    @property({ type: Boolean, reflect: true }) loading = false;
    @property({ type: Number }) pull_count = 0;

    _onIconClicked(event) {
      event.preventDefault();
      event.stopPropagation();
      this.dispatchEvent(greports.util.createEvent("iconclick"), {});
    }

    render(){
        const classList = [ "version-item", "version-item--" + this.type ];
        if (this.active) {
            classList.push("version-item--active");
        }
        if (this.expanded) {
          classList.push("version-item--expanded");
        }

        const iconClassList = [ "version-icon", "version-icon--" + this.type ];

        const countClassList = [ "version-pull-count" ];
        if (this.pull_count > 200) {
            countClassList.push("version-pull-count--hot");
        }

        return html`
            <div
              class="${classList.join(" ")}"
              title="${this.path}"
            >
                <div
                  class="${iconClassList.join(" ")}"
                  title="${this.type === "main" ? "Show intermediate changelogs" : ""}"
                  @click="${this._onIconClicked}"
                ></div>
                <span class="version-title">
                    ${this.name}
                </span>

                <span
                  class="${countClassList.join(" ")}"
                  title="${this.loading ? "" : `${this.pull_count} changes since last release.`}"
                >
                    ${this.loading ? "" : this.pull_count}
                </span>

                ${(this.loading ? html`
                  <div class="version-loader"></div>
                ` : null)}
            </div>
        `;
    }
}
