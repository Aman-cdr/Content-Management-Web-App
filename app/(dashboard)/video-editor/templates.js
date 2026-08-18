// CreatorCMS Video Editor Templates & Effects Library

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "title", label: "Title Cards" },
  { id: "lower-third", label: "Lower Thirds" },
  { id: "subscribe", label: "Subscribe / CTA" },
  { id: "callout", label: "Callouts & Effects" },
  { id: "caption", label: "Captions" }
];

// Safe zones defined as padding percentages to avoid collision with platform UI
// e.g., on 9:16 (TikTok/Reels), avoid the bottom 15% (captions) and right 12% (buttons)
export const SAFE_ZONES = {
  portrait: {
    top: 5,
    bottom: 15,
    left: 5,
    right: 15
  },
  landscape: {
    top: 5,
    bottom: 5,
    left: 5,
    right: 8
  },
  square: {
    top: 5,
    bottom: 8,
    left: 5,
    right: 5
  }
};

export const TEMPLATES = [
  // ── TITLE CARDS ───────────────────────────────────────────────────────────
  {
    id: "bold-center-title",
    name: "Bold Center Title",
    category: "title",
    description: "Large centered title with a clean subtitle",
    thumbnail: "📺",
    defaultDurationSeconds: 4,
    animation: { in: "fade-up", out: "fade", durationMs: 400 },
    layers: [
      {
        id: "bg-dim",
        type: "rect",
        anchor: "middle-center",
        w: "100%",
        h: "100%",
        bg: "rgba(0,0,0,0.45)"
      },
      {
        id: "title-text",
        type: "text",
        role: "title",
        content: "Video Title",
        anchor: "middle-center",
        offsetYPercent: -3,
        fontSizePercentOfHeight: 5.5,
        fontWeight: "900",
        color: "#FFFFFF",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: "2px",
        editable: true,
        orientationOverrides: {
          portrait: { fontSizePercentOfHeight: 4.2, offsetYPercent: -5 }
        }
      },
      {
        id: "title-line",
        type: "rect",
        anchor: "middle-center",
        offsetYPercent: 3,
        w: "80px",
        h: "4px",
        bg: "#6C5CE7",
        radius: 2
      },
      {
        id: "subtitle-text",
        type: "text",
        role: "subtitle",
        content: "Episode 1 · Season 2",
        anchor: "middle-center",
        offsetYPercent: 8,
        fontSizePercentOfHeight: 2.2,
        fontWeight: "500",
        color: "rgba(255, 255, 255, 0.75)",
        textAlign: "center",
        editable: true,
        orientationOverrides: {
          portrait: { fontSizePercentOfHeight: 1.8 }
        }
      }
    ]
  },
  {
    id: "chapter-marker",
    name: "Chapter Marker",
    category: "title",
    description: "Full-bleed section divider divider card",
    thumbnail: "🔖",
    defaultDurationSeconds: 3,
    animation: { in: "slide-right", out: "slide-left", durationMs: 500 },
    layers: [
      {
        id: "bg-solid",
        type: "rect",
        anchor: "middle-center",
        w: "100%",
        h: "100%",
        bg: "#0B0B0F"
      },
      {
        id: "chapter-label",
        type: "text",
        role: "chapter",
        content: "CHAPTER 1",
        anchor: "middle-center",
        offsetYPercent: -6,
        fontSizePercentOfHeight: 2.0,
        fontWeight: "800",
        color: "#A78BFA",
        letterSpacing: "4px",
        textAlign: "center",
        editable: true
      },
      {
        id: "chapter-title",
        type: "text",
        role: "title",
        content: "Getting Started",
        anchor: "middle-center",
        offsetYPercent: 2,
        fontSizePercentOfHeight: 4.8,
        fontWeight: "800",
        color: "#FFFFFF",
        textAlign: "center",
        editable: true,
        orientationOverrides: {
          portrait: { fontSizePercentOfHeight: 3.5 }
        }
      }
    ]
  },

  // ── LOWER THIRDS ──────────────────────────────────────────────────────────
  {
    id: "name-role-tag",
    name: "Name & Role Tag",
    category: "lower-third",
    description: "Bottom-left badge with accent stripe",
    thumbnail: "🏷️",
    defaultDurationSeconds: 5,
    animation: { in: "slide-right", out: "fade", durationMs: 400 },
    layers: [
      {
        id: "lt-bg",
        type: "rect",
        anchor: "bottom-left",
        offsetXPercent: 5,
        offsetYPercent: 8,
        w: "260px",
        h: "60px",
        bg: "rgba(15, 15, 20, 0.85)",
        radius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        blur: true,
        orientationOverrides: {
          portrait: { offsetYPercent: 18, w: "220px", h: "52px" } // avoid Reels captions safe zone
        }
      },
      {
        id: "lt-accent",
        type: "rect",
        anchor: "bottom-left",
        offsetXPercent: 5,
        offsetYPercent: 8,
        w: "4px",
        h: "60px",
        bg: "#6C5CE7",
        radius: 2,
        orientationOverrides: {
          portrait: { offsetYPercent: 18, h: "52px" }
        }
      },
      {
        id: "name-text",
        type: "text",
        role: "name",
        content: "Aman Sharma",
        anchor: "bottom-left",
        offsetXPercent: 7.5,
        offsetYPercent: 12,
        fontSizePercentOfHeight: 2.2,
        fontWeight: "700",
        color: "#FFFFFF",
        editable: true,
        orientationOverrides: {
          portrait: { offsetYPercent: 21.5, fontSizePercentOfHeight: 1.8 }
        }
      },
      {
        id: "role-text",
        type: "text",
        role: "role",
        content: "Founder, CreatorCMS",
        anchor: "bottom-left",
        offsetXPercent: 7.5,
        offsetYPercent: 9.5,
        fontSizePercentOfHeight: 1.4,
        fontWeight: "500",
        color: "rgba(255,255,255,0.5)",
        editable: true,
        orientationOverrides: {
          portrait: { offsetYPercent: 19.5, fontSizePercentOfHeight: 1.2 }
        }
      }
    ]
  },
  {
    id: "location-stamp",
    name: "Location & Date Stamp",
    category: "lower-third",
    description: "Elegant location tag with icon",
    thumbnail: "📍",
    defaultDurationSeconds: 4,
    animation: { in: "fade-up", out: "fade", durationMs: 300 },
    layers: [
      {
        id: "loc-bg",
        type: "rect",
        anchor: "bottom-left",
        offsetXPercent: 5,
        offsetYPercent: 8,
        w: "200px",
        h: "36px",
        bg: "rgba(0,0,0,0.7)",
        radius: 8,
        orientationOverrides: {
          portrait: { offsetYPercent: 18, w: "160px" } // safe zone offset
        }
      },
      {
        id: "loc-text",
        type: "text",
        role: "location",
        content: "📍 New Delhi, India",
        anchor: "bottom-left",
        offsetXPercent: 6.5,
        offsetYPercent: 9.5,
        fontSizePercentOfHeight: 1.6,
        fontWeight: "600",
        color: "#FFFFFF",
        editable: true,
        orientationOverrides: {
          portrait: { offsetYPercent: 19.5, fontSizePercentOfHeight: 1.3 }
        }
      }
    ]
  },

  // ── SUBSCRIBE / CTA ────────────────────────────────────────────────────────
  {
    id: "like-sub-bar",
    name: "Like & Subscribe Bar",
    category: "subscribe",
    description: "Red Subscribe button with heart badge",
    thumbnail: "❤️",
    defaultDurationSeconds: 6,
    animation: { in: "fade-up", out: "fade-down", durationMs: 450 },
    layers: [
      {
        id: "combo-bg",
        type: "rect",
        anchor: "bottom-center",
        offsetYPercent: 8,
        w: "320px",
        h: "54px",
        bg: "rgba(255, 255, 255, 0.95)",
        radius: 27,
        shadow: true,
        orientationOverrides: {
          portrait: { offsetYPercent: 18, w: "260px", h: "44px" } // safe zone offset + size reduction
        }
      },
      {
        id: "like-part",
        type: "text",
        role: "like-label",
        content: "💖 LIKE THIS VIDEO",
        anchor: "bottom-center",
        offsetXPercent: -45,
        offsetYPercent: 11.5,
        fontSizePercentOfHeight: 1.8,
        fontWeight: "800",
        color: "#1F2937",
        orientationOverrides: {
          portrait: { offsetYPercent: 20.5, fontSizePercentOfHeight: 1.4, offsetXPercent: -18 }
        }
      },
      {
        id: "sub-btn-rect",
        type: "rect",
        anchor: "bottom-center",
        offsetXPercent: 22,
        offsetYPercent: 9.5,
        w: "110px",
        h: "38px",
        bg: "#FF0000",
        radius: 19,
        orientationOverrides: {
          portrait: { offsetYPercent: 19.8, w: "80px", h: "30px", offsetXPercent: 20 }
        }
      },
      {
        id: "sub-btn-text",
        type: "text",
        role: "button-text",
        content: "SUBSCRIBE",
        anchor: "bottom-center",
        offsetXPercent: 22,
        offsetYPercent: 11.5,
        fontSizePercentOfHeight: 1.4,
        fontWeight: "900",
        color: "#FFFFFF",
        orientationOverrides: {
          portrait: { offsetYPercent: 20.7, fontSizePercentOfHeight: 1.1, offsetXPercent: 20 }
        }
      }
    ]
  },
  {
    id: "follow-popup",
    name: "Follow Popup",
    category: "subscribe",
    description: "Top-right sliding social CTA badge",
    thumbnail: "🔔",
    defaultDurationSeconds: 5,
    animation: { in: "slide-left", out: "fade", durationMs: 400 },
    layers: [
      {
        id: "pop-bg",
        type: "rect",
        anchor: "top-right",
        offsetXPercent: 5,
        offsetYPercent: 5,
        w: "220px",
        h: "48px",
        bg: "#FFFFFF",
        radius: 12,
        shadow: true,
        border: "1px solid #F3F4F6"
      },
      {
        id: "pop-text",
        type: "text",
        role: "cta",
        content: "✨ Follow for more tips!",
        anchor: "top-right",
        offsetXPercent: 7.5,
        offsetYPercent: 7.2,
        fontSizePercentOfHeight: 1.8,
        fontWeight: "700",
        color: "#6C5CE7",
        editable: true,
        orientationOverrides: {
          portrait: { offsetXPercent: 12 } // clear Reels buttons
        }
      }
    ]
  },

  // ── CALLOUTS & EFFECTS ─────────────────────────────────────────────────────
  {
    id: "highlight-word",
    name: "Highlight Word",
    category: "callout",
    description: "Draws an animated yellow highlighter box behind text",
    thumbnail: "💡",
    defaultDurationSeconds: 4,
    animation: { in: "fade", out: "fade", durationMs: 200 },
    layers: [
      {
        id: "hl-rect",
        type: "rect",
        anchor: "middle-center",
        offsetYPercent: 15,
        w: "180px",
        h: "40px",
        bg: "#FBBF24",
        radius: 6,
        orientationOverrides: {
          portrait: { offsetYPercent: 15, w: "140px", h: "32px" }
        }
      },
      {
        id: "hl-text",
        type: "text",
        role: "text",
        content: "KEY POINT",
        anchor: "middle-center",
        offsetYPercent: 15,
        fontSizePercentOfHeight: 2.4,
        fontWeight: "900",
        color: "#0B0B0F",
        textAlign: "center",
        editable: true,
        orientationOverrides: {
          portrait: { fontSizePercentOfHeight: 1.9 }
        }
      }
    ]
  },
  {
    id: "like-counter",
    name: "Like Counter",
    category: "callout",
    description: "Incrementing like heart bubble top-right",
    thumbnail: "💬",
    defaultDurationSeconds: 4,
    animation: { in: "fade-up", out: "fade", durationMs: 300 },
    layers: [
      {
        id: "cnt-bg",
        type: "rect",
        anchor: "top-right",
        offsetXPercent: 5,
        offsetYPercent: 5,
        w: "110px",
        h: "40px",
        bg: "rgba(108, 92, 231, 0.95)",
        radius: 20,
        shadow: true
      },
      {
        id: "cnt-text",
        type: "text",
        role: "counter",
        content: "❤️ 10.4K",
        anchor: "top-right",
        offsetXPercent: 7.5,
        offsetYPercent: 7,
        fontSizePercentOfHeight: 1.8,
        fontWeight: "800",
        color: "#FFFFFF",
        editable: true,
        orientationOverrides: {
          portrait: { offsetXPercent: 12 } // avoid TikTok buttons
        }
      }
    ]
  },
  {
    id: "comment-popup",
    name: "Comment Popup",
    category: "callout",
    description: "Branded interactive chat popup",
    thumbnail: "💬",
    defaultDurationSeconds: 4,
    animation: { in: "fade-up", out: "fade", durationMs: 400 },
    layers: [
      {
        id: "cmt-bg",
        type: "rect",
        anchor: "top-left",
        offsetXPercent: 5,
        offsetYPercent: 10,
        w: "260px",
        h: "70px",
        bg: "#FFFFFF",
        radius: 16,
        shadow: true,
        border: "1px solid rgba(0,0,0,0.05)"
      },
      {
        id: "cmt-text",
        type: "text",
        role: "comment",
        content: "🔥 This edit is insane!",
        anchor: "top-left",
        offsetXPercent: 7.5,
        offsetYPercent: 13,
        fontSizePercentOfHeight: 1.8,
        fontWeight: "700",
        color: "#1F2937",
        editable: true
      },
      {
        id: "cmt-user",
        type: "text",
        role: "username",
        content: "@user123 · 5m ago",
        anchor: "top-left",
        offsetXPercent: 7.5,
        offsetYPercent: 17,
        fontSizePercentOfHeight: 1.2,
        fontWeight: "500",
        color: "#9CA3AF"
      }
    ]
  },

  // ── CAPTIONS ──────────────────────────────────────────────────────────────
  {
    id: "captions-burn-in",
    name: "Captions Burn-in",
    category: "caption",
    description: "Auto-caption style subtitle overlay",
    thumbnail: "📝",
    defaultDurationSeconds: 8,
    animation: { in: "fade", out: "fade", durationMs: 150 },
    layers: [
      {
        id: "cap-solid-bg",
        type: "rect",
        anchor: "bottom-center",
        offsetYPercent: 15,
        w: "80%",
        h: "44px",
        bg: "rgba(0,0,0,0.75)",
        radius: 8,
        orientationOverrides: {
          portrait: { offsetYPercent: 22 } // avoid Reels captions block
        }
      },
      {
        id: "cap-text",
        type: "text",
        role: "subtitle",
        content: "[Speech-to-Text dynamic placeholder]",
        anchor: "bottom-center",
        offsetYPercent: 17,
        fontSizePercentOfHeight: 2.2,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
        editable: true,
        orientationOverrides: {
          portrait: { offsetYPercent: 23.5, fontSizePercentOfHeight: 1.8 }
        }
      }
    ]
  }
];

export const EDIT_PRESETS = [
  {
    id: "ken-burns",
    name: "Ken Burns Pan",
    description: "Smooth pan and zoom overlay effect",
    icon: "zoom",
    cssFilter: "scale(1.05) translate(1%, 1%)"
  },
  {
    id: "speed-ramp",
    name: "Speed Ramp",
    description: "Subtle slow-motion on highlight frames",
    icon: "speed",
    cssFilter: "none" // controlled via playbackRate
  },
  {
    id: "filter-cinematic",
    name: "Cinematic Warm",
    description: "Warm, filmic golden tone",
    icon: "lut",
    cssFilter: "sepia(0.2) contrast(1.15) saturate(1.2) hue-rotate(-5deg)"
  },
  {
    id: "filter-vibrant",
    name: "Vibrant Punch",
    description: "High saturation and bright colors",
    icon: "lut",
    cssFilter: "saturate(1.4) contrast(1.1) brightness(1.05)"
  },
  {
    id: "filter-bw",
    name: "Moody Noir (B&W)",
    description: "High-contrast classic black & white",
    icon: "lut",
    cssFilter: "grayscale(1) contrast(1.3) brightness(0.95)"
  },
  {
    id: "filter-moody",
    name: "Moody Teal",
    description: "Teal and orange cinematic look",
    icon: "lut",
    cssFilter: "contrast(1.2) saturate(0.85) hue-rotate(15deg)"
  }
];

// Reusable utility to compute exact pixel layout specs based on current player dimensions
export function getLayoutForOrientation(template, videoWidth, videoHeight) {
  const isVertical = videoHeight > videoWidth;
  const orientation = isVertical ? "portrait" : "landscape";
  const heightRatio = videoHeight / 100;
  const widthRatio = videoWidth / 100;

  return {
    ...template,
    layers: template.layers.map(layer => {
      // Merge overrides
      let layout = { ...layer };
      if (layer.orientationOverrides && layer.orientationOverrides[orientation]) {
        layout = { ...layout, ...layer.orientationOverrides[orientation] };
      }

      // Compute font size in exact pixels based on relative height metric
      let computedFontSize = 14;
      if (layout.fontSizePercentOfHeight) {
        computedFontSize = Math.max(10, Math.round((layout.fontSizePercentOfHeight / 100) * videoHeight));
      }

      return {
        ...layout,
        computedFontSize
      };
    })
  };
}

// Translate layer specs to pixel-perfect parameters for FFmpeg processing
export function generateFfmpegCommand(videoPath, appliedOverlays, videoWidth, videoHeight) {
  const isVertical = videoHeight > videoWidth;
  const orientation = isVertical ? "portrait" : "landscape";
  const heightRatio = videoHeight / 100;
  const widthRatio = videoWidth / 100;

  // Generate FFmpeg overlay filter directives
  let filters = [];
  appliedOverlays.forEach((overlay, index) => {
    const layout = getLayoutForOrientation(overlay, videoWidth, videoHeight);
    layout.layers.forEach((layer, layerIndex) => {
      if (layer.type === "text") {
        let xExpr = "0";
        let yExpr = "0";

        // Map anchor to FFmpeg coordinate expressions
        if (layer.anchor === "middle-center") {
          xExpr = `(w-tw)/2`;
          yExpr = `(h-th)/2`;
        } else if (layer.anchor === "bottom-center") {
          xExpr = `(w-tw)/2`;
          yExpr = `h-(th+${Math.round((layer.offsetYPercent || 0) * (videoHeight / 100))})`;
        } else if (layer.anchor === "bottom-left") {
          xExpr = `${Math.round((layer.offsetXPercent || 0) * (videoWidth / 100))}`;
          yExpr = `h-(th+${Math.round((layer.offsetYPercent || 0) * (videoHeight / 100))})`;
        } else if (layer.anchor === "top-right") {
          xExpr = `w-(tw+${Math.round((layer.offsetXPercent || 0) * (videoWidth / 100))})`;
          yExpr = `${Math.round((layer.offsetYPercent || 0) * (videoHeight / 100))}`;
        } else if (layer.anchor === "top-left") {
          xExpr = `${Math.round((layer.offsetXPercent || 0) * (videoWidth / 100))}`;
          yExpr = `${Math.round((layer.offsetYPercent || 0) * (videoHeight / 100))}`;
        }

        // Apply offsets in percents
        if (layer.offsetXPercent && layer.anchor !== "bottom-left" && layer.anchor !== "top-left") {
          xExpr += `+${Math.round(layer.offsetXPercent * widthRatio)}`;
        }
        if (layer.offsetYPercent && layer.anchor !== "bottom-center" && layer.anchor !== "bottom-left") {
          yExpr += `+${Math.round(layer.offsetYPercent * heightRatio)}`;
        }

        const textFilter = `drawtext=text='${layer.content}':fontcolor=${layer.color || "white"}:fontsize=${layer.computedFontSize}:x=${xExpr}:y=${yExpr}:enable='between(t,${overlay.timing.start},${overlay.timing.end})'`;
        filters.push(textFilter);
      }
    });
  });

  const filterString = filters.length > 0 ? `-vf "${filters.join(",")}"` : "";
  return `ffmpeg -i "${videoPath}" ${filterString} -codec:a copy output.mp4`;
}
