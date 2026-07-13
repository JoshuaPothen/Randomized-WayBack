import { findFirstSuitableImage, extractPageColor, resolveImageUrl, resolveThumbnail } from '../thumbnail';

describe('findFirstSuitableImage', () => {
  it('finds the first non-junk image', () => {
    const html = '<body><img src="spacer.gif" width="1" height="1"><img src="photos/tank1.jpg" width="300" height="200"></body>';
    expect(findFirstSuitableImage(html)).toBe('photos/tank1.jpg');
  });

  it('skips images below the minimum dimension', () => {
    const html = '<body><img src="tiny.jpg" width="10" height="10"><img src="big.jpg" width="200" height="150"></body>';
    expect(findFirstSuitableImage(html)).toBe('big.jpg');
  });

  it('returns null when no suitable image exists', () => {
    const html = '<body><img src="spacer.gif" width="1" height="1"></body>';
    expect(findFirstSuitableImage(html)).toBeNull();
  });
});

describe('extractPageColor', () => {
  it('extracts a bgcolor attribute', () => {
    const html = '<body bgcolor="#336699">hi</body>';
    expect(extractPageColor(html)).toBe('#336699');
  });

  it('extracts a background-color inline style', () => {
    const html = '<body style="background-color: #ffcc00;">hi</body>';
    expect(extractPageColor(html)).toBe('#ffcc00');
  });

  it('returns null when no color is present', () => {
    const html = '<body>hi</body>';
    expect(extractPageColor(html)).toBeNull();
  });
});

describe('resolveImageUrl', () => {
  it('wraps an absolute image URL with the archive timestamp', () => {
    expect(resolveImageUrl('http://example.com/img.jpg', 'http://example.com/page.html', '19990101000000')).toBe(
      'https://web.archive.org/web/19990101000000if_/http://example.com/img.jpg'
    );
  });

  it('resolves a relative image URL against the original page URL', () => {
    expect(resolveImageUrl('photos/tank1.jpg', 'http://example.com/reef/index.html', '19990101000000')).toBe(
      'https://web.archive.org/web/19990101000000if_/http://example.com/reef/photos/tank1.jpg'
    );
  });
});

describe('resolveThumbnail', () => {
  it('prefers an image when one is found', () => {
    const html = '<body><img src="photo.jpg" width="200" height="150"></body>';
    const result = resolveThumbnail(html, 'http://example.com/page.html', '19990101000000');
    expect(result.imageUrl).toBe('https://web.archive.org/web/19990101000000if_/http://example.com/photo.jpg');
  });

  it('falls back to an extracted color when no image is found', () => {
    const html = '<body bgcolor="#123456">hi</body>';
    const result = resolveThumbnail(html, 'http://example.com/page.html', '19990101000000');
    expect(result.imageUrl).toBeNull();
    expect(result.color).toBe('#123456');
  });

  it('falls back to the default color when neither image nor color is found', () => {
    const html = '<body>hi</body>';
    const result = resolveThumbnail(html, 'http://example.com/page.html', '19990101000000');
    expect(result.imageUrl).toBeNull();
    expect(result.color).toBe('#e8e2d0');
  });
});
