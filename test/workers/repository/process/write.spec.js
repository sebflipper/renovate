const {
  writeUpdates,
} = require('../../../../lib/workers/repository/process/write');
const branchWorker = require('../../../../lib/workers/branch');
const limits = require('../../../../lib/workers/repository/process/limits');

branchWorker.processBranch = jest.fn();
limits.getPrsRemaining = jest.fn(() => 99);

let config;
beforeEach(() => {
  jest.resetAllMocks();
  config = { ...require('../../../_fixtures/config') };
});

describe('workers/repository/write', () => {
  describe('writeUpdates()', () => {
    const packageFiles = {};
    it('runs pins first', async () => {
      const branches = [{ type: 'pin' }, {}, {}];
      const res = await writeUpdates(config, packageFiles, branches);
      expect(res).toEqual('done');
      expect(branchWorker.processBranch.mock.calls).toHaveLength(1);
    });
    it('stops after automerge', async () => {
      const branches = [{}, {}, {}, {}];
      branchWorker.processBranch.mockReturnValueOnce('created');
      branchWorker.processBranch.mockReturnValueOnce('delete');
      branchWorker.processBranch.mockReturnValueOnce('automerged');
      const res = await writeUpdates(config, packageFiles, branches);
      expect(res).toEqual('automerged');
      expect(branchWorker.processBranch.mock.calls).toHaveLength(3);
    });
  });
});
