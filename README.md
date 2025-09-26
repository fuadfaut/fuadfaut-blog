# Personal Web fuad

<h5 align="left">Personal Technical Notes, built with Hugo and Tina CMS.</h5>

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server with Tina CMS:
   ```bash
   npx tinacms server:start -c "hugo server -D"
   ```

3. Access the admin interface at `/admin/index.html`

## Features

- Hugo-powered static site
- Tina CMS for content management
- Support for posts, pages, and portfolio items
- Git-based content storage

## Configuration

Tina CMS is configured in `tina/config.ts` with collections for:
- Posts (content/posts)
- Pages (content/about)
- Portfolio (content/portfolio)

## Deployment

### Deploy to Cloudflare Pages

This site is configured for deployment to Cloudflare Pages. To deploy:

1. Fork this repository to your GitHub account
2. In Cloudflare Pages, create a new project and connect it to your GitHub repository
3. Set the build configuration:
   - Build command: `npm run build`
   - Build output directory: `public`
   - Environment variables (if using Tina Cloud):
     - `TINA_CLIENT_ID`: Your Tina Cloud client ID
     - `TINA_TOKEN`: Your Tina Cloud token
     - (Optional) `HUGO_TINA_DEV`: Set to "true" if you want TinaCMS to be active in production
4. Deploy!

### GitHub Actions Deployment

This repository includes a GitHub Actions workflow for deploying to Cloudflare Pages. To use it:

1. Add the following secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
2. The site will automatically deploy when you push to the `main` branch
