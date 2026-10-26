import { TestBed } from '@angular/core/testing';
import { BitstreamUrlSerializer } from './bitstream-url-serializer';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';

describe('BitstreamUrlSerializer', () => {
  let serializer: BitstreamUrlSerializer;

  function pathSegments(tree: UrlTree): string[] {
    return tree.root.children.primary.segments.map((segment) => segment.path);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BitstreamUrlSerializer]
    });
    serializer = TestBed.inject(BitstreamUrlSerializer);
  });

  it('should be created', () => {
    expect(serializer).toBeTruthy();
  });

  it('should not modify URLs that do not start with /bitstream/', () => {
    const url = '/some/other/path/file.pdf';
    const result = serializer.parse(url);
    const expected = new DefaultUrlSerializer().parse(url);
    expect(result).toEqual(expected);
  });

  it('should encode special characters in the filename in /bitstream/ URLs', () => {
    const originalUrl = '/bitstream/id/123/456/some file(name)[v1].pdf';
    const expectedEncodedFilename = 'some%20file%28name%29%5Bv1%5D.pdf';
    const expectedUrl = `/bitstream/id/123/456/${expectedEncodedFilename}`;

    const result: UrlTree = serializer.parse(originalUrl);

    const resultUrl = new DefaultUrlSerializer().serialize(result);
    expect(resultUrl).toBe(expectedUrl);
  });

  it('should not modify /bitstream/ URL if there is no filename', () => {
    const url = '/bitstream/id/123/456';
    const result = serializer.parse(url);
    const expected = new DefaultUrlSerializer().parse(url);
    expect(result).toEqual(expected);
  });

  it('should encode the filename and preserve query parameters in /bitstream/ URLs', () => {
    const originalUrl = '/bitstream/handle/123/456/some file.pdf?sequence=3&isAllowed=y';
    const expectedEncodedFilename = 'some%20file.pdf';
    const expectedUrl = `/bitstream/handle/123/456/${expectedEncodedFilename}?sequence=3&isAllowed=y`;

    const result: UrlTree = serializer.parse(originalUrl);

    const resultUrl = new DefaultUrlSerializer().serialize(result);
    expect(resultUrl).toBe(expectedUrl);
  });

  it('should keep the whole query string when a query value contains a raw "?"', () => {
    const result: UrlTree = serializer.parse('/bitstream/handle/123/456/file.pdf?isAllowed=y?x&sequenceId=2');

    expect(pathSegments(result)).toEqual(['bitstream', 'handle', '123', '456', 'file.pdf']);
    expect(result.queryParams).toEqual({ isAllowed: 'y?x', sequenceId: '2' });
  });

  it('should not encode a fragment into the filename', () => {
    const result: UrlTree = serializer.parse('/bitstream/handle/123/456/file.pdf#page=2');

    expect(pathSegments(result)).toEqual(['bitstream', 'handle', '123', '456', 'file.pdf']);
    expect(result.fragment).toBe('page=2');
  });
});
