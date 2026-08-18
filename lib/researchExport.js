// Formats an AI Research Workspace result into Markdown/PDF for export.

export function researchToMarkdown(topic, result) {
  const lines = [`# Research: ${topic}`, ""];

  if (result.summary) {
    lines.push("## Summary");
    lines.push(`- Competition: ${result.summary.competition}`);
    lines.push(`- Best video length: ${result.summary.bestVideoLength}`);
    lines.push(`- Difficulty: ${result.summary.difficulty}`);
    lines.push(`- Opportunity score: ${result.summary.opportunityScore}%`);
    lines.push(`- Audience: ${result.summary.audience}`);
    lines.push(`- Common hook: ${result.summary.commonHook}`);
    lines.push("");
  }

  if (result.recommendation) {
    lines.push("## AI Recommendation");
    lines.push(`- Ideal length: ${result.recommendation.idealLength}`);
    lines.push(`- Color palette: ${result.recommendation.colorPalette}`);
    lines.push(`- Target audience: ${result.recommendation.targetAudience}`);
    if (result.recommendation.include?.length) {
      lines.push("- Include:");
      result.recommendation.include.forEach((i) => lines.push(`  - ${i}`));
    }
    if (result.recommendation.avoid?.length) {
      lines.push("- Avoid:");
      result.recommendation.avoid.forEach((i) => lines.push(`  - ${i}`));
    }
    lines.push("");
  }

  if (result.titles?.length) {
    lines.push("## Suggested Titles");
    result.titles.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }

  if (result.scriptOutline) {
    lines.push("## Script Outline");
    lines.push(`**Hook:** ${result.scriptOutline.hook}`);
    lines.push("");
    (result.scriptOutline.mainPoints || []).forEach((mp) => {
      lines.push(`### ${mp.heading}`);
      lines.push(mp.content);
      lines.push("");
    });
    lines.push(`**CTA:** ${result.scriptOutline.cta}`);
    lines.push("");
  }

  if (result.thumbnailIdeas?.length) {
    lines.push("## Thumbnail Ideas");
    result.thumbnailIdeas.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }

  if (result.contentGap) {
    lines.push("## Content Gap");
    if (result.contentGap.covered?.length) {
      lines.push("**Already covered:**");
      result.contentGap.covered.forEach((c) => lines.push(`- ${c}`));
    }
    if (result.contentGap.gaps?.length) {
      lines.push("**Underserved (opportunity):**");
      result.contentGap.gaps.forEach((g) => lines.push(`- ${g.topic} (${g.opportunityScore}%)`));
    }
    if (result.contentGap.suggestedVideo) {
      lines.push(`**Suggested video:** ${result.contentGap.suggestedVideo.title} (${result.contentGap.suggestedVideo.opportunityScore}%)`);
    }
    lines.push("");
  }

  if (result.trendingKeywords?.length) {
    lines.push("## Trending Keywords");
    lines.push(result.trendingKeywords.join(", "));
    lines.push("");
  }

  if (result.commonQuestions?.length) {
    lines.push("## Common Questions");
    result.commonQuestions.forEach((q) => lines.push(`- ${q}`));
    lines.push("");
  }

  if (result.competitorVideos?.length) {
    lines.push("## Competitor Videos");
    result.competitorVideos.forEach((v) => lines.push(`- [${v.title}](${v.url}) — ${v.channelTitle}`));
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

export function downloadMarkdownText(markdown, filename) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportResearchPDF(topic, markdown, filename) {
  const win = window.open("", "_blank");
  if (!win) return;
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  win.document.write(`<!DOCTYPE html><html><head><title>${filename}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 40px auto; line-height: 1.6; color: #111; padding: 0 20px; white-space: pre-wrap; }
      h1 { font-size: 22px; margin-bottom: 24px; }
    </style>
  </head><body>${escaped}</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 200);
}
