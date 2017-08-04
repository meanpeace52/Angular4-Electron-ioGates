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
    const tmpPath = '/tmp';
    const shareUrl = 'https://share-web02-transferapp.iogates.com/show/15/59817e24914f1/bb56d48bc997112f511304b18b51806b/dir/373/373/0/0/0';

    return commands
      .exec(`download -m ${tmpPath} ${shareUrl}`)
      .then((response: any) => {
        console.log(response);
        expect(true).toBe(true);
      });
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  });
});
