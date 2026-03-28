import { Command } from 'commander';
import * as esbuild from 'esbuild';
import * as path from 'path';
import appRootDir from 'app-root-dir';

// Otherwise the serve port from the previous build might not be fully released.
await new Promise(resolve => setTimeout(resolve, 500));

const root = appRootDir.get();

const logRebuildPlugin: esbuild.Plugin = {
  name: 'rebuild-log',
  // eslint-disable-next-line @typescript-eslint/unbound-method
  setup({ onStart, onEnd }) {
    let t: number;
    onStart(() => {
      t = Date.now();
    });
    onEnd(() => {
      console.log(`Build finished in`, Date.now() - t, 'ms');;
    });
  },
};

const distdir = path.join(root, 'dist');

const program = new Command();
program.option('--watch', 'Rebuild upon change', false);
program.option('--serve', 'Serve using esbuild webserver', false);
program.option('--live-reload', 'Enable live-reload', false);
program.action(async ({ watch, serve, liveReload }: { watch: boolean; serve: boolean; liveReload: boolean; }) => {
  const browserCtx = await esbuild.context({
    platform: 'browser',
    target: 'esnext',
    format: 'esm',
    bundle: true,
    minify: false,
    outdir: distdir,
    entryPoints: [
      { in: 'src/game/app.ts', out: 'www/app' },
      { in: 'src/game/app.css', out: 'www/app' },
      { in: 'src/dev/ball-engine-comparator.ts', out: 'dev/ball-engine-comparator' },
      { in: 'src/dev/wall-collision.ts', out: 'dev/wall-collision' },
      { in: 'src/dev/ball-collision.ts', out: 'dev/ball-collision' },
      { in: 'src/dev/debug.ts', out: 'dev/debug' },
      { in: 'src/bot/bot.ts', out: 'bot/bot' },
      { in: 'src/core/evaluate-move.worker.ts', out: 'www/evaluate-move.worker' },
      // { in: 'src/core/evaluate-move.thread.ts', out: 'www/evaluate-move.thread' },
      // npx esbuild --platform=node src/core/evaluate-move.thread.ts --outdir=dist/www/ --allow-overwrite --bundle --format=esm
    ],
    loader: {
      '.html': 'text'
    },
    plugins: [
      logRebuildPlugin
    ],
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    sourcemap: 'linked',
    footer: {
      ...(liveReload
        ? {
          js: `if (typeof process !== 'object') { new EventSource('/esbuild').addEventListener('change', () => location.reload()); }`
        }
        : {}
      )
    }
  });

  const nodeCtx = await esbuild.context({
    platform: 'node',
    target: 'esnext',
    format: 'esm',
    bundle: true,
    minify: false,
    outdir: distdir,
    entryPoints: [
      { in: 'src/core/evaluate-move.thread.ts', out: 'evaluate-move.thread' },
    ],
    plugins: [
      logRebuildPlugin
    ],
    sourcemap: 'linked',
  });

  if (watch) {
    console.log('Starting watch');
    await browserCtx.watch();
    await nodeCtx.watch();
  } else {
    await browserCtx.rebuild();
    await nodeCtx.rebuild();
  }

  if (serve) {
    const { hosts, port } = await browserCtx.serve({ servedir: root });
    console.log(`Serving on http://${hosts[0]}:${port}`);
  }

  if (!watch && !serve) {
    await browserCtx.dispose();
    await nodeCtx.dispose();
  }
}).parse();
