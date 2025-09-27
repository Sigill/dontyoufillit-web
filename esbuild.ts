import { Command } from 'commander';
import * as esbuild from 'esbuild';
import * as path from 'path';
import appRootDir from 'app-root-dir';

// Otherwise the serve port from the previous build might not be fully released.
await new Promise(resolve => setTimeout(resolve, 500));

const root = appRootDir.get();

const logRebuildPlugin: esbuild.Plugin = {
  name: 'rebuild-log',
  setup({ onStart, onEnd }) {
    let t: number;
    onStart(() => {
      t = Date.now();
    });
    onEnd(() => {
      console.log(`Build finished in`, Date.now() - t, 'ms');;
    });
  },
}

const distdir = path.join(root, 'dist');

const program = new Command();
program.option('--watch', 'Rebuild upon change', false);
program.option('--serve', 'Serve using esbuild webserver', false);
program.option('--live-reload', 'Enable live-reload', false);
program.action(async ({ watch, serve, liveReload }: { watch: boolean; serve: boolean; liveReload: boolean; }) => {
  const ctx = await esbuild.context({
    platform: 'browser',
    target: 'esnext',
    format: 'esm',
    bundle: true,
    minify: false,
    outdir: distdir,
    entryPoints: [
      { in: 'src/app.ts', out: 'www/app' },
      { in: 'src/app.css', out: 'www/app' },
      { in: 'dev/wall-collision.ts', out: 'dev/wall-collision' },
      { in: 'dev/ball-collision.ts', out: 'dev/ball-collision' },
    ],
    loader: {
      '.html': 'text'
    },
    plugins: [
      logRebuildPlugin
    ],
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

  if (watch) {
    console.log('Starting watch');
    await ctx.watch();
  } else {
    ctx.rebuild();
  }

  if (serve) {
    const { hosts, port } = await ctx.serve({ servedir: root });
    console.log(`Serving on http://${hosts[0]}:${port}`);
  }

  if (!watch && !serve) {
    await ctx.dispose();
  }
}).parse();
