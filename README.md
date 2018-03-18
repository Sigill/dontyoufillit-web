# DontYouFillIt

DontYouFillIt is a Breakout-style game mixed with snooker. It has been developed with HTML5 technologies, so it should work on any modern browser (including mobile ones).

## How to build

The build script has been designed to run on any Unix system, provided that the following tools are available from the command line:

- ruby
- inkscape
- pngcrush
- imagemagick
- closure-compiler
- cssmin
- zip
- openssl

The build script will build an online version of the game together with hosted and packaged applications for the Chrome platform. To build everything, run the following command from the command line:

```
./build.sh <publication url> <chrome hosted app private key> <chrome packaged app private key> <version>
```

For example:

```
./build.sh http://example.com/path/to/game/ chrome-hosted.pem chrome-packaged.pem 0.1.2
```

## License

This game is released under the terms of the MIT License. See the LICENSE file for more details.

Some parts of the game use:

- The stats.js library, which is licensed under MIT (see [license](https://github.com/mrdoob/stats.js/blob/master/LICENSE)).
- The requestAnimationFrame polyfill, which is licensed under MIT (see [license](https://raw.githubusercontent.com/darius/requestAnimationFrame/master/LICENSE)).
