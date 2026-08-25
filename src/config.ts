/**
 * Shared video settings.
 *
 * Change these two lines to switch the whole project to 4K / 60fps
 * (or any other resolution/frame rate) — every composition in
 * src/compositions reads its size and fps from here.
 */
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;

// Common durations, expressed in seconds so they stay readable
// regardless of the fps above. Multiply by VIDEO_FPS to get frames.
export const SECOND = VIDEO_FPS;

// Keep text inside this inset from every edge so nothing sits under
// a TV overscan area or a video editor's title-safe guide.
export const TITLE_SAFE_MARGIN = 80;
