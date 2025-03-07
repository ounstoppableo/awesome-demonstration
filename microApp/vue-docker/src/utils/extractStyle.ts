export default function parseStyleTags(styleString: string) {
  const regex =
    /<style\b(?:\s+(scoped))?(?:\s+lang=["']?(sass|scss|less|css)["']?)?[^>]*>([\s\S]*?)<\/style>/gi;
  const matches = [...styleString.matchAll(regex)];

  return matches.map((match) => {
    const lang = match[2] || 'css'; // 默认 'css'
    const content = match[3].trim();

    // 单独检测 scoped 属性
    const scoped = /<style\b[^>]*\bscoped\b/i.test(match[0]);

    return {
      lang,
      scoped,
      content,
    };
  });
}
