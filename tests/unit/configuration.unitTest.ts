/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Configuration } from '../../src/utils/Configuration';

describe('The configuration service', () => {
  let branch: string | undefined = '';
  beforeAll(() => {
    branch = process.env.BRANCH;
  });
  afterAll(() => {
    process.env.BRANCH = branch;
  });

  context('with good config file', () => {
    it('should return local versions of the config if specified', () => {
      process.env.BRANCH = 'local';
      const configService = Configuration.getInstance();
      const functions = configService.getFunctions();
      expect(functions).toHaveLength(6);
      expect(functions[0].name).toBe('generateTestNumber');
      expect(functions[1].name).toBe('generateTrailerId');
      expect(functions[2].name).toBe('generateSystemNumber');
      expect(functions[3].name).toBe('generatePlateSerialNumber');
      expect(functions[4].name).toBe('generateZNumber');
      expect(functions[5].name).toBe('generateTNumber');

      const DBConfig = configService.getDynamoDBConfig();
      expect(DBConfig).toEqual(configService.getConfig().dynamodb.local);
    });

    it('should return local-global versions of the config if specified', () => {
      process.env.BRANCH = 'local-global';
      const configService = Configuration.getInstance();
      const functions = configService.getFunctions();
      expect(functions).toHaveLength(6);
      expect(functions[0].name).toBe('generateTestNumber');
      expect(functions[1].name).toBe('generateTrailerId');
      expect(functions[2].name).toBe('generateSystemNumber');
      expect(functions[3].name).toBe('generatePlateSerialNumber');
      expect(functions[4].name).toBe('generateZNumber');
      expect(functions[5].name).toBe('generateTNumber');

      const DBConfig = configService.getDynamoDBConfig();
      expect(DBConfig).toEqual(configService.getConfig().dynamodb['local-global']);
    });

    it('should return remote versions of the config by default', () => {
      process.env.BRANCH = 'CVSB-XXX';
      const configService = Configuration.getInstance();
      const functions = configService.getFunctions();
      expect(functions).toHaveLength(6);
      expect(functions[0].name).toBe('generateTestNumber');
      expect(functions[1].name).toBe('generateTrailerId');
      expect(functions[2].name).toBe('generateSystemNumber');
      expect(functions[3].name).toBe('generatePlateSerialNumber');
      expect(functions[4].name).toBe('generateZNumber');
      expect(functions[5].name).toBe('generateTNumber');

      const DBConfig = configService.getDynamoDBConfig();
      expect(DBConfig).toEqual(configService.getConfig().dynamodb.remote);
    });
  });

  context('with bad config file', () => {
    it('should return an error for missing functions from getFunctions', () => {
      const config = new Configuration('../../tests/resources/badConfig.yml');
      try {
        config.getFunctions();
      } catch (e) {
        expect(e.message).toBe('Functions were not defined in the config file.');
      }
    });

    it('should return an error for missing DB Config from getDynamoDBConfig', () => {
      const config = new Configuration('../../tests/resources/badConfig.yml');
      try {
        config.getDynamoDBConfig();
      } catch (e) {
        expect(e.message).toBe('DynamoDB config is not defined in the config file.');
      }
    });
  });
});
