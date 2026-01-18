# DontYouFillIt (HTML5 version)

DontYouFillIt is a Breakout-style game mixed with snooker.

It has been developed with HTML5 technologies, so it should work on any modern browser (including mobile ones).

You can [play the game online](https://sigill.github.io/dontyoufillit/).

## Building the Project

This project uses Make and npm scripts. The following commands are available:

### Build Commands

- `make` - Build the project.
- `./ci.sh` - Perform an out-of-source build in a Docker container. This requires all changes to be committed first.

### Development

- `npm run dev` - Start the development server with watch mode and hot reload.

### Code Quality

- `npm run typecheck` - Run TypeScript type checking.
- `npm run lint` - Run ESLint on the source code.
- `npm run test` - Run tests using Web Test Runner.

## License

This game is released under the terms of the MIT License. See the LICENSE file for more details.

Some parts of the game use:

- The stats.js library, which is licensed under MIT (see [license](https://github.com/mrdoob/stats.js/blob/master/LICENSE)).
