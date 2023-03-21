# Godot Interactive Changelog

This project is provided for Godot Engine users and contributors to document
in a complete and comprehensive manner changes that go into each release and
developer preview of the engine. This project aims to largely remove the manual
labor from creating and maintaining a project changelog, and provides tools
to generate static information, such as CHANGELOG.md and release notes for the blog.

The benefit of this automated system is that it allows to track PRs as well as
individual commits, preserving important context for the work that goes into
each release. For example, it can also detect commits that were cherry-picked,
and identify their original PRs.

Live website: https://godotengine.github.io/godot-interactive-changelog/

## Contributing

This project is written in JavaScript and is built using Node.JS. HTML and CSS are
used for the presentation. The end result of the build process is completely static
and can be server from any web server, no Node.JS required.

Front-end is designed in a reactive manner using industry standard Web Components
(powered by `lit-element`). This provides native browser support, and results in a
small overhead from the build process.

To build the project locally you need to have Node.JS installed (12.x and newer
should work just fine).

This project uses GitHub's GraphQL API. To fetch live data you need to generate
a [personal OAuth token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token).
You can supply your token to the scripts using the `GRAPHQL_TOKEN` environment
variable. Note, that if you don't have member access to the organization, you
may not be able to access all the information used when generating the database.

1. Clone or download the project.
2. From the project root run `npm install` or `yarn` to install dependencies.
3. Run `npm run build` or `yarn run build` to build the pages.
4. Run `npm run compose-db` or `yarn run compose-db` to fetch the data from GitHub.
5. Serve the `out/` folder with your method of choice (e.g. using Python 3:
   `python -m http.server 8080 -d ./out`).

`rollup` is used for browser packing of scripts and copying of static assets. The
data fetching script is plain JavaScript with `node-fetch` used to polyfill
`fetch()`-like API.

## License

This project is provided under the [MIT License](LICENSE.md).
