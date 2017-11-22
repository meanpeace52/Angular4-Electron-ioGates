import { IOGates } from '../../lib/iogates';
import * as Type from '../../lib/types';

const shareUrl = 'https://share-web02-transferapp.iogates.com/show/15/59817e24914f1/bb56d48bc997112f511304b18b51806b/dir/373/373/0/0/0';

describe.skip('IOGate', () => {
  let ioGates: IOGates;

  // Act before assertions
  beforeAll(() => {
    ioGates = new IOGates();
  });

  // Assert if setTimeout was called properly
  it('should have a `authenticate` method', () => {
    expect(ioGates.authenticateFromUrl).toBeDefined();
  });

  it('should have `readFiles` method', () => {
    expect(ioGates.readFiles).toBeDefined();
  });

  describe('flow through and', () => {
    beforeAll(async () => {
      const share = new Type.Share({
        shareUrl: shareUrl
      });
      await ioGates.authenticateFromUrl(share);
    });

    it('retrieve files from server', () => {
      return ioGates
        .readFiles()
        .then((response : Type.Files) => {
          expect(response.files).toBeDefined();
          expect(response.files).toHaveLength(2);
        });
    });
  });

});
