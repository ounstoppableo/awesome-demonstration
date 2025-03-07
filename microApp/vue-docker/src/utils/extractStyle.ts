export default function extractStyledBlocks(code: string) {
  const regex =
    /<style[^>]*lang=["'](scss|sass|less)["'][^>]*>([\s\S]*?)<\/style>/g;
  let match;
  const results = [];

  while ((match = regex.exec(code)) !== null) {
    results.push({
      lang: match[1], // 语言类型 (scss/sass/less)
      content: match[2], // 样式内容
    });
  }

  return results;
}
