# Beekeeping App 2

React + Vite beekeeping app copied from the original beekeeping app.

## Live site

https://troianb.github.io/beekeeping-app2/

## Local development

```bash
npm install
npm run dev
```

## Deployment

GitHub Actions builds the Vite app and publishes the built `dist` folder to the `gh-pages` branch.

For GitHub Pages, use:

```text
Settings → Pages
Source: Deploy from a branch
Branch: gh-pages
Folder: / root
```

This repo does not use `actions/configure-pages@v5`, so the old Pages API error should not happen on new runs.
