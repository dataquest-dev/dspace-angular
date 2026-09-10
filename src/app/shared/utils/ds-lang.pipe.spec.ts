import { DsLangPipe } from './ds-lang.pipe';

describe('DsLangPipe', () => {
  let pipe: DsLangPipe;

  beforeEach(() => {
    pipe = new DsLangPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should normalize a Java-style locale to a BCP 47 tag', () => {
    expect(pipe.transform('en_US')).toEqual('en-US');
    expect(pipe.transform('cs_CZ')).toEqual('cs-CZ');
  });

  it('should return null for the wildcard, empty and nullish values', () => {
    expect(pipe.transform('*')).toBeNull();
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });
});
