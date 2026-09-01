// JAIJITESH.OS // Central Application State & Lifecycle

export const state = {
  entered: false,
  ready: false,
  focused: false,
  inspecting: null,
  screenState: 'sleep', // 'sleep' | 'boot' | 'desktop'
  is3DOffloaded: false,
  busy: false,
};

export const DESK_TOP_HEIGHT = 0.85; // Fixed physical tabletop height in world units
