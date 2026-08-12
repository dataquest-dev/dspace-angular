import { buildOptionalRobotsDisallows } from './robots.util';
import { RobotsConfig } from './robots-config.interface';

describe('buildOptionalRobotsDisallows', () => {
  const allOff: RobotsConfig = {
    disallowHandle: false,
    disallowBrowse: false,
    disallowBitstreams: false,
  };

  it('emits nothing when every toggle is off', () => {
    expect(buildOptionalRobotsDisallows(allOff)).toBe('');
  });

  it('emits only /browse when disallowBrowse is on', () => {
    expect(buildOptionalRobotsDisallows({ ...allOff, disallowBrowse: true }))
      .toBe('\nDisallow: /browse');
  });

  it('emits only /handle when disallowHandle is on', () => {
    expect(buildOptionalRobotsDisallows({ ...allOff, disallowHandle: true }))
      .toBe('\nDisallow: /handle');
  });

  it('emits both bitstream rules when disallowBitstreams is on', () => {
    const out = buildOptionalRobotsDisallows({ ...allOff, disallowBitstreams: true });
    expect(out).toContain('Disallow: /bitstream/');
    expect(out).toContain('Disallow: /bitstreams/');
  });

  it('leads with a newline and never a blank line, so the block stays inside the group', () => {
    const out = buildOptionalRobotsDisallows({
      disallowHandle: true,
      disallowBrowse: true,
      disallowBitstreams: true,
    });
    expect(out.startsWith('\n')).toBeTrue();
    expect(out).not.toContain('\n\n');
  });
});
