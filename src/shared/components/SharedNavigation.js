import { LitElement, html, css, customElement } from 'lit-element';

@customElement('shared-nav')
export default class SharedNavigation extends LitElement {
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

            :host .nav-container a {
                color: var(--link-font-color);
                text-decoration: none;
            }
            :host .nav-container a:hover {
                color: var(--link-font-color-hover);
            }

            :host .nav-container {
                display: flex;
                gap: 8px;
                margin-top: 8px;
                background: var(--g-background-color);
            }

            :host .nav-item {
                font-size: 16px;
                font-weight: 600;
                padding: 10px 16px;
            }
            :host .nav-item:hover {
                background-color: var(--g-background-extra2-color);
            }

            :host .nav-toggler {
                display: none;
                background-image: url('hamburger.svg');
                background-repeat: no-repeat;
                background-position: center;
                cursor: pointer;
                position: absolute;
                top: 0;
                left: 0;
                width: 48px;
                height: 48px;
            }
            :host .nav-toggler:hover {
                background-color: var(--g-background-extra2-color);
            }

            @media only screen and (max-width: 640px) {
                :host .nav-container {
                    display: none;
                    flex-direction: column;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    padding-top: 40px;
                    padding-bottom: 12px;
                }
                :host .nav-container.nav-active {
                    display: flex;
                }

                :host .nav-toggler {
                    display: block;
                }
            }
        `;
    }

    constructor() {
        super();

        this._mobileActive = false;
    }

    _onMobileToggled() {
        this._mobileActive = !this._mobileActive;
        this.requestUpdate();
    }

    render(){
        const containerClassList = [ "nav-container" ];
        if (this._mobileActive) {
            containerClassList.push("nav-active");
        }

        return html`
            <div class="${containerClassList.join(" ")}">
                <a href="https://godotengine.github.io/doc-status/" target="_blank" class="nav-item">
                    ClassRef Status
                </a>
                <a href="https://godot-proposals-viewer.github.io/" target="_blank" class="nav-item">
                    Proposal Viewer
                </a>
                <a href="https://godotengine.github.io/godot-team-reports/" target="_blank" class="nav-item">
                    Team Reports
                </a>
                <a href="https://godotengine.github.io/godot-prs-by-file/" target="_blank" class="nav-item">
                    PRs by File
                </a>
                <a href="https://godotengine.github.io/godot-commit-artifacts/" target="_blank" class="nav-item">
                    Commit Artifacts
                </a>
            </div>
            <div
                class="nav-toggler"
                @click="${this._onMobileToggled}"
            ></div>
        `;
    }
}
