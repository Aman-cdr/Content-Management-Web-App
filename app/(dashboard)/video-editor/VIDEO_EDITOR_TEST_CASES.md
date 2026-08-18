# 🧪 Video Editor Module — Comprehensive Test Cases

This document defines the automated unit tests, backend API integration tests, and manual verification checklists to ensure the stability, performance, and correctness of the video editing module.

---

## 1. Frontend Unit Tests (Jest / Vitest)

### A. State Management (`store/editorStore.js`)
* **Test Case 1.1: Project Initialization**
  * **Goal**: Verify the store initializes with correct default project structures.
  * **Input**: Call `resetEditor()`.
  * **Expected Output**:
    * `tracks` has 6 default lanes (video-1, audio-1, music-1, etc.).
    * `currentTime` is `0`, `isPlaying` is `false`, `duration` is `0`.
    * `textLayers` and `stickerLayers` are empty arrays `[]`.
* **Test Case 1.2: Clip CRUD Operations**
  * **Goal**: Validate adding, updating, moving, and removing clips across tracks.
  * **Steps**:
    1. Add a clip using `addClip('video-1', { id: 'c1', start: 0, duration: 10, type: 'video' })`.
    2. Verify `tracks[0].clips` contains `{ id: 'c1', ... }`.
    3. Update the clip start time using `updateClip('video-1', 'c1', { start: 2.5 })`. Verify value is updated.
    4. Move the clip to audio track using `moveClip('video-1', 'audio-1', 'c1', 5.0)`. Verify clip is removed from video-1 and exists on audio-1 at `start: 5.0`.
    5. Remove the clip using `removeClip('audio-1', 'c1')`. Verify track is empty.
* **Test Case 1.3: Audio Mix Modification**
  * **Goal**: Ensure volume updates propagate correctly in the state.
  * **Input**: Call `setAudioMix({ masterVolume: 0.8, musicVolume: 0.4 })`.
  * **Expected Output**: Store state updates exactly with new values; other sliders remain unchanged.

### B. Command History & Undo/Redo (`store/historyManager.js`)
* **Test Case 2.1: Simple Action Tracking**
  * **Goal**: Ensure state modifications record history frames.
  * **Steps**:
    1. Check `canUndo()` returns `false`.
    2. Update project name to "Project A" using `setProjectName("Project A")`.
    3. Verify `canUndo()` returns `true`.
* **Test Case 2.2: Undo/Redo Traversal**
  * **Goal**: Verify state rolls back and forward.
  * **Steps**:
    1. Perform `setProjectName("Original")`.
    2. Perform `setProjectName("Modified")`.
    3. Call `undo()`. Verify `project.name` is `"Original"`.
    4. Call `redo()`. Verify `project.name` is `"Modified"`.
* **Test Case 2.3: Ephemeral Action Exclusion**
  * **Goal**: Prevent transient properties (like playback playhead) from dirtying undo stack.
  * **Input**: Call `setCurrentTime(10.5)`.
  * **Expected Output**: `canUndo()` remains `false`.

### C. Video Operations Math (`operations/operations.js`)
* **Test Case 3.1: Clip Splitting**
  * **Goal**: Verify splitting logic recalculates trims correctly.
  * **Input**: Clip `{ id: 'c1', start: 2, duration: 10, trimIn: 0, trimOut: 10 }` split at playhead time `5`.
  * **Expected Output**: Array of two clips:
    * Left Clip: `start: 2`, `clipDuration: 3`, `trimIn: 0`, `trimOut: 3`.
    * Right Clip: `start: 5`, `clipDuration: 7`, `trimIn: 3`, `trimOut: 10`.
* **Test Case 3.2: Speed Rate Scaling**
  * **Goal**: Ensure playback speed adjustment scales duration.
  * **Input**: Apply speed rate of `2.0` (double speed) on a 10s clip.
  * **Expected Output**: Clip `playbackRate: 2.0`, `clipDuration: 5.0` (scaled down by half).

---

## 2. Backend Integration Tests (Supertest)

### A. Project REST Endpoints
* **Test Case 4.1: Create Project**
  * **Endpoint**: `POST /api/v1/video-editor/projects`
  * **Auth**: Valid Access Token
  * **Payload**: `{ "projectName": "My Test Video" }`
  * **Expected Response**: `201 Created` with project body containing generated `_id`, `userId`, and `status: "draft"`.
* **Test Case 4.2: Update and Fetch Project**
  * **Endpoint**: `PUT /api/v1/video-editor/projects/:id`
  * **Payload**: `{ "projectData": { "tracks": [] } }`
  * **Expected Response**: `200 OK` with updated document. Subsequent `GET /projects/:id` must return the same JSON data.
* **Test Case 4.3: Owner Scope Validation**
  * **Goal**: Verify users cannot fetch another user's projects.
  * **Steps**:
    1. Authenticate as **User A**.
    2. Try to `GET /api/v1/video-editor/projects/<User_B_Project_Id>`.
  * **Expected Response**: `404 Not Found` or `400 Bad Request` (Service layer blocks cross-user fetching).

### B. Auto-Save Limit
* **Test Case 5.1: Maximum Document Size**
  * **Goal**: Prevent DB failure by ensuring project file doesn't exceed MongoDB 16MB document limit.
  * **Payload**: Huge dummy metadata array exceeding 10MB.
  * **Expected Response**: `400 Bad Request` with message `Project data too large (max 10MB)`.

---

## 3. Manual QA / Verification Checklist

### A. Core Engine & Preview Compositing
* [ ] **Upload Handling**: Drag-and-drop an MP4 file. Verify it imports, parses correct metadata (resolution, duration), and displays the base track on the timeline.
* [ ] **Frame Rendering**: Hit Play. Verify playback is smooth (> 30fps) and preview canvas displays the video frames.
* [ ] **Layers Composition**: Add a Text Overlay and an Emoji Sticker. Play the video. Verify the text and sticker only render when the playhead is within their startTime and endTime bounds.
* [ ] **Color Grading**: Drag the *Saturation* slider to `-1.0` (Grayscale) and *Brightness* to `+0.5`. Verify the canvas preview updates instantly.

### B. Timeline Interactions
* [ ] **Playhead Dragging**: Click and drag the red playhead. Verify the preview updates to show the frame matching the playhead timestamp.
* [ ] **Clip Trimming**: Hover on the edge of a timeline clip. Click and drag inwards to trim. Play the video and confirm the clip starts later or ends earlier.
* [ ] **Track Controls**: Click "M" (Mute) on the Video Track. Verify the canvas preview screen goes black, but subtitles and text overlays remain visible.

### C. Persistent Storage & Crash Recovery
* [ ] **IndexedDB Persistence**: Upload a video, add three text boxes, and change the project name. Close the browser tab. Reopen `http://localhost:3000/video-editor` and select **Drafts**. Verify project metadata, state, and the local video file load perfectly.
* [ ] **Auto-Save Verification**: Edit the timeline, wait 30 seconds. Verify the console displays the `[AutoSave] Project saved` log statement.

### D. Export Flow
* [ ] **FFmpeg WASM Load**: Open **Export** panel, select standard settings, and click **Export Video**. Verify the progress bar appears and transitions from "Loading FFmpeg engine..." to progress percentages.
* [ ] **File Retrieval**: Verify that when progress reaches 100%, the browser initiates a download of the completed `.mp4` file.
