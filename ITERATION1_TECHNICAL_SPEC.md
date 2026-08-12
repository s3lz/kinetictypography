# Iteration 1 Technical Specification

## AI Atmosphere Typography

### Goal

Build a frontend-first MVP where a user uploads a song, AI generates a typography interpretation, the user edits a small set of creative controls, and exports an MP4.

### Architecture

```
Upload Audio → Audio Analysis → LLM Interpretation → CreativeState JSON → Typography Engine → Live Preview → Export
```

### Version 1 Scope

Focus on frontend experience. No authentication, projects, collaboration, timeline synchronization, or database.

### Audio Input

- Support MP3, WAV, and M4A
- Return simple metadata (duration, filename)

### Audio Analysis

Initially extract only:

- Duration
- Estimated tempo
- Average energy

Rich audio understanding can come later.

### LLM

- Receive structured audio features
- Return a **CreativeState JSON**
- Must never return animation code

### CreativeState

Single source of truth:

| Category | Properties |
|----------|------------|
| Typography | font, weight, tracking, scale, kerning |
| Color | palette 3 colors|
| Motion | flowing | mechanical | organic | impact |

### Typography Engine

Convert CreativeState into animation parameters.

**Example:** Floating changes amplitude, duration, blur, opacity, and subtle rotation together.

### Rendering

- Use React with Motion or GSAP for live preview
- All controls update the canvas in real time
- Audio uploaded plays in background and user can pause it on and off

### Export

Use Remotion so the same CreativeState powers both preview and MP4 export.

### Suggested Folder Structure

```
src/
  components/
  engine/
    fontSelector.ts
    motionEngine.ts
    paletteEngine.ts
  audio/
  llm/
  renderer/
  hooks/
  types/
```

### Cursor Prompt

> Read this document first. Build Version 1 only. Use mocked or simplified AI responses. Keep everything modular around a CreativeState object. Do not implement authentication or databases.

### Future

- Improve audio understanding
- Add lyrics
- Multiple interpretations
- User font libraries
- Advanced exports
