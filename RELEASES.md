# Release Process

VeridianOS uses [standard-version](https://github.com/conventional-changelog/standard-version) for automated versioning and changelog generation.

## Quick Release

```bash
# Automatic version bump based on commit history
npm run release

# Preview what would be released (dry run)
npm run release:dry-run
```

## Manual Version Control

```bash
# Force specific version bumps
npm run release:patch  # 0.3.0 → 0.3.1
npm run release:minor  # 0.3.0 → 0.4.0  
npm run release:major  # 0.3.0 → 1.0.0
```

## How It Works

Standard-version automatically:

1. **Analyzes git commits** since the last tag
2. **Determines version bump** based on commit types:
   - `fix:` → patch version (0.3.0 → 0.3.1)
   - `feat:` → minor version (0.3.0 → 0.4.0)
   - `BREAKING CHANGE:` → major version (0.3.0 → 1.0.0)
3. **Updates all package.json files** (root, client, server)
4. **Generates CHANGELOG.md** from commit messages
5. **Creates git commit** with version changes
6. **Creates annotated git tag** (e.g., v0.4.0)

## Commit Message Format

Use [Conventional Commits](https://conventionalcommits.org/) for automatic changelog generation:

```bash
# Features (minor version bump)
git commit -m "feat: add WiFi capabilities to Arduino sensors"
git commit -m "feat(client): add dark mode toggle"

# Bug fixes (patch version bump) 
git commit -m "fix: resolve WiFi connection timeout issues"
git commit -m "fix(server): handle malformed sensor data"

# Breaking changes (major version bump)
git commit -m "feat!: redesign API endpoints" 
git commit -m "feat: new auth system

BREAKING CHANGE: requires new authentication tokens"

# Infrastructure/docs (appear in changelog but no version bump)
git commit -m "chore: update dependencies"
git commit -m "docs: improve setup instructions"
```

## Publishing Releases

After running `npm run release`:

```bash
# Push commits and tags to remote
git push --follow-tags origin main

# Or if you want to push separately:
git push origin main
git push origin --tags
```

## Monorepo Handling

The configuration automatically handles:
- ✅ **Synchronized versions** across all packages (root, client, server)
- ✅ **Workspace-aware** changelog generation
- ✅ **Unified release process** for the entire project

## Rollback Process

If you need to undo a release:

```bash
# Remove the tag
git tag -d v0.4.0
git push origin :refs/tags/v0.4.0

# Reset to previous commit
git reset --hard HEAD~1

# Or use interactive rebase to edit
git rebase -i HEAD~2
```

## Configuration

Release behavior is controlled by `.versionrc.json`:
- **Package files**: Which files to read version from
- **Bump files**: Which files to update with new version
- **Commit types**: How different commit types are categorized in changelog
- **Scripts**: Pre/post hooks for custom actions

## Examples

### Standard workflow:
```bash
# 1. Make your changes with conventional commits
git commit -m "feat: add plant watering reminders"
git commit -m "fix: resolve sensor calibration bug"

# 2. Release (analyzes commits, bumps minor version)
npm run release

# 3. Push
git push --follow-tags origin main
```

### Force specific version:
```bash
# Force a major version bump regardless of commits
npm run release:major

git push --follow-tags origin main
```

This automated process ensures consistent versioning across your monorepo while maintaining detailed changelogs for each release.
