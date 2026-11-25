import { EmphasizePipe } from './emphasize.pipe';

describe('EmphasizePipe', () => {
  const pipe = new EmphasizePipe();

  it('should wrap the matches in <em> tags', () => {
    expect(pipe.transform('Smith, Sam', 's')).toEqual('<em>S</em>mith, <em>S</em>am');
  });

  it('should escape markup in the value', () => {
    expect(pipe.transform('Smith & Co <img src="x">', 'smi')).toEqual('<em>Smi</em>th &amp; Co &lt;img src=&quot;x&quot;&gt;');
  });
});
