# ioGates Transfer App

## Quick start

1. Install dependencies `npm update`
2. Build the app `npm run build`
3. Run the app `node build/src/main.js`

### Packaging

1. Install pkg globally `npm install -g pkg`
2. Package `npm run pkg`

Pagackaged version will be in `./dist`.

#### Prefetching sqlite3
1. cd node_modules/sqlite3
2. node-pre-gyp install --target_arch=x64 --target_platform=win32
3. node-pre-gyp install --target_arch=ia32 --target_platform=win32
4. node-pre-gyp install --target_arch=x64 --target_platform=darwin
5. node-pre-gyp install --target_arch=x64 --target_platform=linux
6. Copy node_sqlite3.node for each platform in to assets

## Available scripts

+ `clean` - remove coverage data, Jest cache and transpiled files,
+ `build` - transpile TypeScript to ES6,
+ `watch` - interactive watch mode to automatically transpile source files, 
+ `lint` - lint source files and tests,
+ `test` - run tests,
+ `test:watch` - interactive watch mode to automatically re-run tests

## License
