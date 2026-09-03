with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add DOM selectors
old_dom = """const fpovHud = $('#fpovHud');
const crosshair = $('#crosshair');
const fpovPrompt = $('#fpovPrompt');
const fpovPromptText = $('#fpovPromptText');
const doorAlert = $('#doorAlert');
const webglFallback = $('#webglFallback');"""

new_dom = """const fpovHud = $('#fpovHud');
const crosshair = $('#crosshair');
const fpovPrompt = $('#fpovPrompt');
const fpovPromptText = $('#fpovPromptText');
const doorAlert = $('#doorAlert');
const webglFallback = $('#webglFallback');

// Phone / Mobile Touch Controls DOM
const mobileControls = $('#mobileControls');
const touchJoystick = $('#touchJoystick');
const touchKnob = $('#touchKnob');
const touchInteractBtn = $('#touchInteractBtn');
const touchInteractLabel = $('#touchInteractLabel');
const touchUpBtn = $('#touchUpBtn');
const touchDownBtn = $('#touchDownBtn');"""

assert old_dom in content, "old_dom not found!"
content = content.replace(old_dom, new_dom, 1)

# 2. Add touchMoveX/Z to fpov state
old_fpov_state = """const fpov = {
  yaw: -0.35,
  pitch: 0.0,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  speed: 2.8,
  verticalSpeed: 2.2,
  lookSensitivity: 0.0022,
  activeInteractable: null
};"""

new_fpov_state = """const fpov = {
  yaw: -0.35,
  pitch: 0.0,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  touchMoveX: 0,
  touchMoveZ: 0,
  speed: 2.8,
  verticalSpeed: 2.2,
  lookSensitivity: 0.0022,
  activeInteractable: null
};"""

assert old_fpov_state in content, "old_fpov_state not found!"
content = content.replace(old_fpov_state, new_fpov_state, 1)

# 3. Add mobile controls initialization and touch listeners
mobile_code = """// =============================================================================
// PHONE & TOUCH SCREEN FIRST-PERSON CONTROLLER
// =============================================================================
let touchLookId = null;
let touchLookStartX = 0;
let touchLookStartY = 0;
let touchLookStartTime = 0;
let touchJoystickId = null;
let mobileControlsInitialized = false;

function initMobileTouchControls() {
  if (mobileControlsInitialized || !mobileControls || !touchJoystick || !touchKnob) return;
  mobileControlsInitialized = true;

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
  if (!isTouch) return;

  mobileControls.hidden = false;

  // 1. Virtual Joystick Touch Handler
  const handleJoystickMove = (touch) => {
    const rect = touchJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const maxRadius = 42;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    touchKnob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    fpov.touchMoveX = dx / maxRadius;
    fpov.touchMoveZ = -dy / maxRadius;
  };

  const resetJoystick = () => {
    touchJoystickId = null;
    touchKnob.style.transform = 'translate3d(0, 0, 0)';
    fpov.touchMoveX = 0;
    fpov.touchMoveZ = 0;
  };

  touchJoystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.changedTouches[0];
    touchJoystickId = touch.identifier;
    handleJoystickMove(touch);
  }, { passive: false });

  touchJoystick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchJoystickId) {
        handleJoystickMove(e.changedTouches[i]);
        break;
      }
    }
  }, { passive: false });

  touchJoystick.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchJoystickId) {
        resetJoystick();
        break;
      }
    }
  }, { passive: false });

  touchJoystick.addEventListener('touchcancel', (e) => {
    resetJoystick();
  }, { passive: false });

  // 2. Action Buttons (Interact, Up, Down)
  touchInteractBtn?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFPOVInteract();
  }, { passive: false });

  touchUpBtn?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveUp = true;
  }, { passive: false });
  touchUpBtn?.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveUp = false;
  }, { passive: false });
  touchUpBtn?.addEventListener('touchcancel', () => { fpov.moveUp = false; });

  touchDownBtn?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveDown = true;
  }, { passive: false });
  touchDownBtn?.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fpov.moveDown = false;
  }, { passive: false });
  touchDownBtn?.addEventListener('touchcancel', () => { fpov.moveDown = false; });

  // 3. Screen Touch Drag for Camera Look (outside joystick & buttons)
  window.addEventListener('touchstart', (e) => {
    if (!state.fpovMode) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const target = touch.target;
      if (target.closest && (target.closest('#touchJoystick') || target.closest('.mobile-controls__actions') || target.closest('header'))) {
        continue;
      }
      if (touchLookId === null) {
        touchLookId = touch.identifier;
        touchLookStartX = touch.clientX;
        touchLookStartY = touch.clientY;
        touchLookStartTime = performance.now();
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!state.fpovMode || touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchLookId) {
        const dx = touch.clientX - touchLookStartX;
        const dy = touch.clientY - touchLookStartY;
        touchLookStartX = touch.clientX;
        touchLookStartY = touch.clientY;

        // Smooth look rotation, 1:1 user touch control
        fpov.yaw -= dx * 0.0045;
        fpov.pitch = Math.max(-1.45, Math.min(1.45, fpov.pitch - dy * 0.0045));
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!state.fpovMode || touchLookId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchLookId) {
        const dt = performance.now() - touchLookStartTime;
        if (dt < 250 && fpov.activeInteractable) {
          handleFPOVInteract();
        }
        touchLookId = null;
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    touchLookId = null;
  }, { passive: true });
}
"""

old_activate_fpov = """function activateFPOV() {
  state.fpovMode = true;
  if (controls) controls.enabled = false;
  if (fpovHud) fpovHud.hidden = false;

  camera.rotation.order = 'YXZ';
  camera.position.set(-1.5, 1.45, -0.5);
  fpov.yaw = -0.35;
  fpov.pitch = 0.0;
  camera.rotation.y = fpov.yaw;
  camera.rotation.x = fpov.pitch;
  camera.rotation.z = 0;

  window.addEventListener('keydown', onFPOVKeyDown);
  window.addEventListener('keyup', onFPOVKeyUp);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onFPOVMouseMove);

  requestPointerLock();
}"""

new_activate_fpov = mobile_code + """\nfunction activateFPOV() {
  state.fpovMode = true;
  if (controls) controls.enabled = false;
  if (fpovHud) fpovHud.hidden = false;

  camera.rotation.order = 'YXZ';
  camera.position.set(-1.5, 1.45, -0.5);
  fpov.yaw = -0.35;
  fpov.pitch = 0.0;
  camera.rotation.y = fpov.yaw;
  camera.rotation.x = fpov.pitch;
  camera.rotation.z = 0;

  window.addEventListener('keydown', onFPOVKeyDown);
  window.addEventListener('keyup', onFPOVKeyUp);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onFPOVMouseMove);

  // Initialize Phone & Mobile touch navigation
  initMobileTouchControls();

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
  if (isTouch) {
    if (mobileControls) mobileControls.hidden = false;
    showToast('JOYSTICK: MOVE • SWIPE: LOOK • [E]: ACTION');
  } else {
    requestPointerLock();
  }
}"""

assert old_activate_fpov in content, "old_activate_fpov not found!"
content = content.replace(old_activate_fpov, new_activate_fpov, 1)

# 4. Update updateFPOVMovement to combine WASD + Touch Joystick
old_movement_calc = """  const moveX = (fpov.moveRight ? 1 : 0) - (fpov.moveLeft ? 1 : 0);
  const moveZ = (fpov.moveForward ? 1 : 0) - (fpov.moveBackward ? 1 : 0);
  const moveY = (fpov.moveUp ? 1 : 0) - (fpov.moveDown ? 1 : 0);"""

new_movement_calc = """  let moveX = (fpov.moveRight ? 1 : 0) - (fpov.moveLeft ? 1 : 0) + (fpov.touchMoveX || 0);
  let moveZ = (fpov.moveForward ? 1 : 0) - (fpov.moveBackward ? 1 : 0) + (fpov.touchMoveZ || 0);
  let moveY = (fpov.moveUp ? 1 : 0) - (fpov.moveDown ? 1 : 0);

  const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (len > 1) {
    moveX /= len;
    moveZ /= len;
  }"""

assert old_movement_calc in content, "old_movement_calc not found!"
content = content.replace(old_movement_calc, new_movement_calc, 1)

# 5. Update raycastCrosshair to update touch action button state
old_crosshair_active = """      fpov.activeInteractable = hitObj;
      if (fpovPrompt) {
        fpovPrompt.hidden = false;
        if (fpovPromptText) fpovPromptText.textContent = hitObj.userData.actionPrompt;
      }
      return;"""

new_crosshair_active = """      fpov.activeInteractable = hitObj;
      if (fpovPrompt) {
        fpovPrompt.hidden = false;
        if (fpovPromptText) fpovPromptText.textContent = hitObj.userData.actionPrompt;
      }
      if (touchInteractBtn) {
        touchInteractBtn.classList.add('is-active');
        if (touchInteractLabel) {
          if (hitObj.userData.isLaptop) touchInteractLabel.textContent = 'BOOT';
          else if (hitObj.userData.isSwitchboard) touchInteractLabel.textContent = 'SWITCH';
          else if (hitObj.userData.isYellowDoor) touchInteractLabel.textContent = 'OPEN';
          else touchInteractLabel.textContent = 'INSPECT';
        }
      }
      return;"""

assert old_crosshair_active in content, "old_crosshair_active not found!"
content = content.replace(old_crosshair_active, new_crosshair_active, 1)

old_crosshair_inactive = """  fpov.activeInteractable = null;
  if (fpovPrompt) fpovPrompt.hidden = true;"""

new_crosshair_inactive = """  fpov.activeInteractable = null;
  if (fpovPrompt) fpovPrompt.hidden = true;
  if (touchInteractBtn) {
    touchInteractBtn.classList.remove('is-active');
    if (touchInteractLabel) touchInteractLabel.textContent = 'ACTION';
  }"""

assert old_crosshair_inactive in content, "old_crosshair_inactive not found!"
content = content.replace(old_crosshair_inactive, new_crosshair_inactive, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js and src/main.js successfully updated with phone mobile controls!')
