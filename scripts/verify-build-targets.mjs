// Checks that every compiled build step names a target present in the page.
const decode = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

export function verifyBuildTargets(html) {
  const problems = [];
  for (const m of html.matchAll(
    /<section\b[^>]*?\sdata-build="([^"]*)"[^>]*>/g,
  )) {
    let timeline;
    try {
      timeline = JSON.parse(decode(m[1]));
    } catch {
      const id = /\sid="([^"]*)"/.exec(m[0])?.[1] ?? 'unknown';
      problems.push(`build script "${id}": data-build is not valid JSON`);
      continue;
    }
    timeline.steps.forEach((step, i) => {
      if (!html.includes(`data-build-target="${step.target}"`)) {
        problems.push(
          `build script "${timeline.section}" step ${i} (${step.call}): target "${step.target}" not found in the page`,
        );
      }
    });
  }
  return problems;
}
