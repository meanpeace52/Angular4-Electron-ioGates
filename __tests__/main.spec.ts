// const main = require('../src/main');
import * as vorpal from '../src/main';

describe('boot', () => {
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
  });
  const commands: any  = vorpal;
  it('should export vorpal', () => {
    expect(commands).toBeDefined();
  });

  it('should run download command', () => {
    const tmpPath = '/tmp/random-folder';
    const shareUrl = 'https://share-web02-transferapp.iogates.com/show/16/5989522a1b0a6/d5239e67c69a3ef76a807ae25ebf750b/dir/272/272/0/0/0';

    return commands
      .exec(`download -m ${tmpPath} ${shareUrl}`)
      .then((response: any) => {
        expect(true).toBe(true);
      });
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  });
});
