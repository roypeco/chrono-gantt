# Contributing

Contributions to Chrono Gantt are welcome — bug reports, feature requests, and pull requests alike.

[日本語版はこちら](CONTRIBUTING_ja.md)

## Issues

- **Bug reports**: include steps to reproduce, the expected behavior, and the actual behavior. If you can, add your Obsidian version and an example of the task frontmatter that triggers the problem
- **Feature requests**: describe what you want to do and why

For larger changes, please open an issue to discuss the approach before sending a pull request.

## Development setup

All you need is Docker.

```bash
git clone https://github.com/<your-account>/chrono-gantt
cd chrono-gantt
```

To output the build straight into your vault, create `docker-compose.override.yml` (already gitignored):

```yaml
services:
  dev:
    volumes:
      - /path/to/your/vault/.obsidian/plugins/chrono-gantt:/obsidian-plugin
```

| Task | Command |
|---|---|
| Watch mode | `docker compose up` |
| Production build | `docker compose run --rm dev npm run build` |
| Type check | `docker compose run --rm dev npm run typecheck` |

Reload the plugin in Obsidian after building to see your changes.

## Code structure and conventions

The role of each source file is described in [CLAUDE.md](CLAUDE.md). In particular:

- Always import Obsidian APIs (`Plugin`, `ItemView`, `TFile`, etc.) from `"obsidian"` (they must not be bundled)
- The build target is ES2018 / CJS
- Write CSS in `src/styles.ts`; it is injected as a `<style>` tag when the plugin loads (no `styles.css`)
- Read frontmatter via `app.metadataCache.getFileCache(file)?.frontmatter`

## Specifications

Feature specs live in `specs/`, one folder per version (`specs/v1/`, `specs/v2/`, …).

- If your pull request changes behavior, update the spec for the relevant version
- Update both the Japanese (`overview_ja.md`) and English (`overview.md`) versions

## Pull request workflow

1. Fork the repository and create a branch from `main` (e.g. `feature/xxx`, `fix/xxx`)
2. Make your changes and make sure the type check and build pass
3. Check the behavior in Obsidian
4. Open a pull request against `main`, describing what you changed and how you tested it

GitHub Actions runs the type check and build automatically on every pull request. Please fix any failures.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE), the same as this repository.
