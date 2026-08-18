// Converts Tiptap StarterKit HTML output (headings, bold/italic, lists, blockquote,
// paragraphs, marks) to Markdown. Only handles the tags StarterKit + Highlight
// actually produce — not a general-purpose HTML→MD converter.

function inlineToMarkdown(node) {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent;
      return;
    }
    const tag = child.tagName?.toLowerCase();
    const inner = inlineToMarkdown(child);
    switch (tag) {
      case "strong":
      case "b":
        out += `**${inner}**`;
        break;
      case "em":
      case "i":
        out += `*${inner}*`;
        break;
      case "mark":
        out += `==${inner}==`;
        break;
      case "code":
        out += `\`${inner}\``;
        break;
      case "br":
        out += "\n";
        break;
      default:
        out += inner;
    }
  });
  return out;
}

export function htmlToMarkdown(html) {
  if (typeof window === "undefined" || !html) return "";
  const container = document.createElement("div");
  container.innerHTML = html;

  const lines = [];

  container.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();

    if (tag === "h1") lines.push(`# ${inlineToMarkdown(node)}`);
    else if (tag === "h2") lines.push(`## ${inlineToMarkdown(node)}`);
    else if (tag === "h3") lines.push(`### ${inlineToMarkdown(node)}`);
    else if (tag === "blockquote") lines.push(`> ${inlineToMarkdown(node)}`);
    else if (tag === "ul") {
      node.querySelectorAll(":scope > li").forEach((li) => lines.push(`- ${inlineToMarkdown(li)}`));
    } else if (tag === "ol") {
      let i = 1;
      node.querySelectorAll(":scope > li").forEach((li) => lines.push(`${i++}. ${inlineToMarkdown(li)}`));
    } else if (tag === "p") {
      lines.push(inlineToMarkdown(node));
    } else {
      const text = inlineToMarkdown(node);
      if (text.trim()) lines.push(text);
    }
    lines.push("");
  });

  return lines.join("\n").trim() + "\n";
}

export function downloadMarkdown(html, filename) {
  const md = htmlToMarkdown(html);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
