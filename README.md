# paulot123.github.io

Portfolio website.

## Private GitHub Contribution Sync (Free)

The contribution chart reads from `data/github-contributions.json`, which is updated by GitHub Actions.

### One-time setup

1. Go to this repository on GitHub.
2. Open `Settings` -> `Secrets and variables` -> `Actions`.
3. Add a new repository secret:
   - Name: `GH_CONTRIB_TOKEN`
   - Value: a personal access token from your GitHub account.
4. Token scopes:
   - Fine-grained token: allow read access to your account contribution data and private repos.
   - Classic token: `repo` and `read:user`.
5. Run the workflow manually once from the `Actions` tab:
   - Workflow: `Update GitHub Contributions`
   - Click `Run workflow`.

After that, it runs automatically daily and stays free on GitHub Actions usage.
