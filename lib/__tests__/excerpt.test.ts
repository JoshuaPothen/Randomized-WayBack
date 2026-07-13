import { extractTitle, extractMetaDescription, extractFirstParagraphText, buildDescription, extractVisibleText } from '../excerpt';

const SAMPLE_HTML = `
  <html>
    <head>
      <title>Dave's Reef Tank</title>
      <meta name="description" content="A 20-gallon reef tank journal.">
    </head>
    <body>
      <script>trackVisitor();</script>
      <p>Welcome to my reef tank page, updated every week since 1999 with photos and water chemistry logs.</p>
    </body>
  </html>
`;

const NO_META_HTML = `
  <html>
    <head><title>Plain Page</title></head>
    <body><p>Just a short paragraph about not much at all here really.</p></body>
  </html>
`;

describe('extractTitle', () => {
  it('extracts the title text', () => {
    expect(extractTitle(SAMPLE_HTML)).toBe("Dave's Reef Tank");
  });

  it('returns null when no title tag exists', () => {
    expect(extractTitle('<html><body>no title</body></html>')).toBeNull();
  });
});

describe('extractMetaDescription', () => {
  it('extracts meta description content', () => {
    expect(extractMetaDescription(SAMPLE_HTML)).toBe('A 20-gallon reef tank journal.');
  });

  it('returns null when no meta description exists', () => {
    expect(extractMetaDescription(NO_META_HTML)).toBeNull();
  });
});

describe('extractVisibleText', () => {
  it('strips scripts and tags', () => {
    const text = extractVisibleText(SAMPLE_HTML);
    expect(text).not.toContain('trackVisitor');
    expect(text).toContain('Welcome to my reef tank page');
  });
});

describe('extractFirstParagraphText', () => {
  it('returns a truncated visible-text excerpt', () => {
    const result = extractFirstParagraphText(NO_META_HTML, 10, 200);
    expect(result).toContain('Just a short paragraph');
  });

  it('returns null when visible text is too short', () => {
    expect(extractFirstParagraphText('<html><body>hi</body></html>', 40, 200)).toBeNull();
  });
});

describe('buildDescription', () => {
  it('prefers meta description when present', () => {
    expect(buildDescription(SAMPLE_HTML)).toBe('A 20-gallon reef tank journal.');
  });

  it('falls back to first-paragraph text when no meta description', () => {
    expect(buildDescription(NO_META_HTML)).toContain('Just a short paragraph');
  });

  it('falls back to a default string when nothing usable is found', () => {
    expect(buildDescription('<html><body></body></html>')).toBe('No description available.');
  });
});
