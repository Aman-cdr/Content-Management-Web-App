# CreatorCMS Video Editor templates

This module contains the Templates & Effects system for the no-skill, one-click video editor overlay system.

## Template Schema

Each template is defined in JSON inside `templates.js`. To add a new template, simply add a new object to the `TEMPLATES` array following this structure:

```json
{
  "id": "my-template-id",
  "name": "My Template Name",
  "category": "subscribe", // one of "title", "lower-third", "subscribe", "callout", "caption"
  "description": "Short explanation of what the template is",
  "thumbnail": "✨",
  "defaultDurationSeconds": 4,
  "timing": { "start": 0.0, "end": 0.5 }, // optional default time ranges
  "layers": [
    {
      "id": "bg-shape",
      "type": "rect",
      "anchor": "bottom-left",
      "offsetXPercent": 5,
      "offsetYPercent": 8,
      "w": "260px",
      "h": "60px",
      "bg": "rgba(15, 15, 20, 0.85)",
      "radius": 12,
      "blur": true,
      "orientationOverrides": {
        "portrait": { "offsetYPercent": 18, "w": "220px", "h": "52px" }
      }
    },
    {
      "id": "label-text",
      "type": "text",
      "role": "title",
      "content": "Edit Me",
      "anchor": "bottom-left",
      "offsetXPercent": 7.5,
      "offsetYPercent": 12,
      "fontSizePercentOfHeight": 2.2,
      "fontWeight": "700",
      "color": "#FFFFFF",
      "editable": true,
      "orientationOverrides": {
        "portrait": { "offsetYPercent": 21.5, "fontSizePercentOfHeight": 1.8 }
      }
    }
  ]
}
```

### Layout Properties

- **`anchor`**: Where the element anchors relative to the video frame:
  - `middle-center`
  - `bottom-center`
  - `bottom-left`
  - `bottom-right`
  - `top-left`
  - `top-right`
- **`offsetXPercent` / `offsetYPercent`**: Offsets from the anchor bounds as percentages.
- **`fontSizePercentOfHeight`**: Font size represented as a percentage of the video height (for responsive scaling).
- **`orientationOverrides`**: Override values for `portrait` (9:16) format.

## Live Preview & Rendering

All preview layouts are calculated dynamically in the browser inside `page.jsx` using `getLayoutForOrientation` utility function, ensuring what is shown in the editor conforms exactly to the dimensions of the selected video.
