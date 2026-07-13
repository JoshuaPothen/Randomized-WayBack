import { extractTitle, extractMetaDescription, extractFirstParagraphText, buildDescription, extractVisibleText, decodeEntities } from '../excerpt';

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

  it('extracts meta description when content attribute comes before name attribute', () => {
    const REVERSED_ATTR_HTML = `
      <html>
        <head>
          <title>Reversed Attrs</title>
          <meta content="A page with reversed attribute order." name="description">
        </head>
        <body><p>Some body text.</p></body>
      </html>
    `;
    expect(extractMetaDescription(REVERSED_ATTR_HTML)).toBe('A page with reversed attribute order.');
  });

  it('extracts meta description with reversed attribute order when the content contains an apostrophe', () => {
    const REVERSED_ATTR_WITH_APOSTROPHE_HTML = `
      <html>
        <head>
          <meta content="It's a reversed-order description." name="description">
        </head>
        <body><p>Some body text.</p></body>
      </html>
    `;
    expect(extractMetaDescription(REVERSED_ATTR_WITH_APOSTROPHE_HTML)).toBe("It's a reversed-order description.");
  });
});

describe('decodeEntities', () => {
  it('decodes numeric decimal character references', () => {
    expect(decodeEntities('Rock &#8217;n&#8217; Roll')).toBe('Rock ’n’ Roll');
  });

  it('decodes numeric hex character references', () => {
    expect(decodeEntities('Caf&#xE9; &#x2014; a great spot')).toBe('Café — a great spot');
  });

  it('still decodes named entities alongside numeric ones', () => {
    expect(decodeEntities('Tom &amp; Jerry &#8212; friends')).toBe('Tom & Jerry — friends');
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
