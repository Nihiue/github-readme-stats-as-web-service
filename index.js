import Koa from 'koa';

import { renderStatsCard } from "./github-readme-stats/src/cards/stats-card.js";
import { fetchStats } from "./github-readme-stats/src/fetchers/stats-fetcher.js";

import { renderTopLanguages } from "./github-readme-stats/src/cards/top-languages-card.js";
import { fetchTopLanguages } from "./github-readme-stats/src/fetchers/top-languages-fetcher.js";

import { fetchRepo } from "./github-readme-stats/src/fetchers/repo-fetcher.js";
import { renderRepoCard } from "./github-readme-stats/src/cards/repo-card.js";

import Cache from 'cache';

const app = new Koa();
const myCache = new Cache(8 * 60 * 60 * 1000);

// "PAT_1" with your [GitHub Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).
// process.env.PAT_1 = '';
const USER = process.env.CONFIG_USER || '';

async function cardHandler(ctx) {
    const theme = ctx.query.theme || 'default';
    const cacheKey = `card:${theme}`;

    let ret = myCache.get(cacheKey);
    if (!ret) {
      console.log('fetch', cacheKey);

      const count_private = true;
      const include_all_commits = true;
      const exclude_repo = [];
      const stats = await fetchStats(
        USER,
        count_private,
        include_all_commits,
        exclude_repo,
      );

      ret = renderStatsCard(stats, {
        hide: [],
        show_icons: true,
        hide_title: false,
        hide_border: false,
        // card_width: parseInt(card_width, 10),
        hide_rank: false,
        include_all_commits: true,
        // line_height,
        // title_color,
        // icon_color,
        // text_color,
        // text_bold: parseBoolean(text_bold),
        // bg_color,
        theme,
        // custom_title,
        // border_radius,
        // border_color,
        // locale: locale ? locale.toLowerCase() : null,
        disable_animations: false,
      });

      myCache.put(cacheKey, ret);
    }

    ctx.set('Content-Type', 'image/svg+xml');
    ctx.set('Cache-Control', 'public, max-age=86400');
    ctx.body = ret;
}

async function topLangHandler(ctx) {
  const theme = ctx.query.theme || 'default';
  const cacheKey = `toplang:${theme}`;

  let ret = myCache.get(cacheKey);
  if (!ret) {
    console.log('fetch', cacheKey);

    const topLangs = await fetchTopLanguages(
      USER,
      [
        'nihiue.github.io',
        'aliyun-deployment',
        'little-byte-demo'
      ],
    );

    ret = renderTopLanguages(topLangs, {
      // custom_title,
      hide_title: false,
      hide_border: false,
      // card_width: parseInt(card_width, 10),
      hide: [],

      // title_color,
      // text_color,
      // bg_color,
      theme,
      layout: 'compact',
      langs_count: 10,
      // border_radius,
      // border_color,
      // locale: locale ? locale.toLowerCase() : null,
    }),

    myCache.put(cacheKey, ret);
  }

  ctx.set('Content-Type', 'image/svg+xml');
  ctx.set('Cache-Control', 'public, max-age=86400');
  ctx.body = ret;
}

async function pinHandler(ctx) {
  const repo = ctx.query.repo;
  const theme = ctx.query.theme || 'default';
  if (!repo) {
    return;
  }
  const cacheKey = `pin:${theme}:${repo}`;
  let ret = myCache.get(cacheKey);
  if (!ret) {
    console.log('fetch', cacheKey);
    const repoData = await fetchRepo(USER, repo);
    ret = renderRepoCard(repoData, {
      hide_border: false,
      // title_color,
      // icon_color,
      // text_color,
      // bg_color,
      theme,
      // border_radius,
      // border_color,
      show_owner: false,
      // locale: locale ? locale.toLowerCase() : null,
    });

    myCache.put(cacheKey, ret);
  }

  ctx.set('Content-Type', 'image/svg+xml');
  ctx.set('Cache-Control', 'public, max-age=86400');
  ctx.body = ret;
}

const routerTable = {
  'GET:/card': cardHandler,
  'GET:/toplang': topLangHandler,
  'GET:/pin': pinHandler,
};


app.use(async function router(ctx) {
  const handler = routerTable[`${ctx.method}:${ctx.path}`];
  if (handler) {
    await handler(ctx);
  }
});

const port = 3000;

app.listen(port);

console.log(`listen on ${port}`);
