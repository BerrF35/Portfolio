with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add switchStates.bedLed and window exports
old_switch_states = """  switchStates: {
    tubes: true,
    fan: true
  }
};"""

new_switch_states = """  switchStates: {
    tubes: true,
    fan: true,
    bedLed: true
  }
};

window.camera = camera;
window.scene = scene;
window.world = world;
window.fpov = fpov;
window.state = state;"""

assert old_switch_states in content, "old_switch_states not found!"
content = content.replace(old_switch_states, new_switch_states, 1)

# 2. Preserve laptop screen material instead of replacing with MeshBasicMaterial
old_screen_mat = """          // Laptop screen node
          if (child.isMesh && child.material && child.material.name === 'screen') {
            world.screenMesh = child;
            child.material = new THREE.MeshBasicMaterial({
              map: world.screenTexture,
              toneMapped: false
            });
            child.userData.isLaptop = true;
            child.userData.actionPrompt = 'BOOT JAIJITESH.OS';
            world.interactables.push(child);
            world.clickable.push(child);
          }"""

new_screen_mat = """          // Laptop screen node
          if (child.isMesh && child.material && child.material.name === 'screen') {
            world.screenMesh = child;
            child.material.map = world.screenTexture;
            child.material.needsUpdate = true;
            child.userData.isLaptop = true;
            child.userData.actionPrompt = 'BOOT JAIJITESH.OS';
            world.interactables.push(child);
            world.clickable.push(child);
          }"""

assert old_screen_mat in content, "old_screen_mat not found!"
content = content.replace(old_screen_mat, new_screen_mat, 1)

# 3. Add switch button zone detection and visual response
old_switch_func = """// =============================================================================
// INTERACTIVE SWITCHBOARD TOGGLE
// =============================================================================
function toggleRoomSystems() {
  sound.click(750, 0.04);
  // Toggle fan
  if (world.fanAction) {
    world.fanAction.paused = !world.fanAction.paused;
  }
  // Toggle ceiling tubelights
  world.switchStates.tubes = !world.switchStates.tubes;
  const tubeIntensity = world.switchStates.tubes ? 8.0 : 0.0;
  if (world.lights.tube1) world.lights.tube1.intensity = tubeIntensity;
  if (world.lights.tube2) world.lights.tube2.intensity = tubeIntensity;

  showToast(world.switchStates.tubes ? 'ROOM SYSTEMS // POWER: ACTIVE' : 'ROOM SYSTEMS // POWER: ECO-STANDBY');
}"""

new_switch_func = """// =============================================================================
// INTERACTIVE THREE-BUTTON SWITCHBOARD TOGGLES
// =============================================================================
function pulseSwitchEmissive(colorHex = 0x38bdf8) {
  if (!world.switchboard) return;
  world.switchboard.traverse((c) => {
    if (c.isMesh && c.material) {
      const mat = c.material;
      const origColor = mat.emissive ? mat.emissive.getHex() : 0x000000;
      if (mat.emissive) {
        mat.emissive.setHex(colorHex);
        mat.emissiveIntensity = 2.5;
        setTimeout(() => {
          mat.emissive.setHex(origColor);
          mat.emissiveIntensity = 1.0;
        }, 300);
      }
    }
  });
}

function toggleSwitchButton(id) {
  sound.click(750, 0.04);
  pulseSwitchEmissive(0x38bdf8);

  if (id === 1) {
    // Button 1: Toggle Ventilation Fan
    if (world.fanAction) {
      world.fanAction.paused = !world.fanAction.paused;
      showToast(world.fanAction.paused ? 'VENTILATION FAN: PAUSED' : 'VENTILATION FAN: SPINNING');
    }
  } else if (id === 2) {
    // Button 2: Toggle Ceiling Tubelights
    world.switchStates.tubes = !world.switchStates.tubes;
    const tubeIntensity = world.switchStates.tubes ? 8.0 : 0.0;
    if (world.lights.tube1) world.lights.tube1.intensity = tubeIntensity;
    if (world.lights.tube2) world.lights.tube2.intensity = tubeIntensity;
    showToast(world.switchStates.tubes ? 'CEILING TUBES: 100% ILLUMINATION' : 'CEILING TUBES: POWER OFF');
  } else if (id === 3) {
    // Button 3: Toggle Bed Overhead LED & Desk Glow
    world.switchStates.bedLed = !world.switchStates.bedLed;
    const ledIntensity = world.switchStates.bedLed ? 16.0 : 0.0;
    const deskIntensity = world.switchStates.bedLed ? 10.0 : 0.0;
    if (world.lights.bedLed) world.lights.bedLed.intensity = ledIntensity;
    if (world.lights.deskHud) world.lights.deskHud.intensity = deskIntensity;
    showToast(world.switchStates.bedLed ? 'AMBIENT GLOW: ACTIVE' : 'AMBIENT GLOW: STANDBY');
  } else {
    toggleRoomSystems();
  }
}

function toggleRoomSystems() {
  sound.click(750, 0.04);
  pulseSwitchEmissive(0x38bdf8);
  if (world.fanAction) world.fanAction.paused = !world.fanAction.paused;
  world.switchStates.tubes = !world.switchStates.tubes;
  const tubeIntensity = world.switchStates.tubes ? 8.0 : 0.0;
  if (world.lights.tube1) world.lights.tube1.intensity = tubeIntensity;
  if (world.lights.tube2) world.lights.tube2.intensity = tubeIntensity;
  showToast(world.switchStates.tubes ? 'ROOM SYSTEMS // POWER: ACTIVE' : 'ROOM SYSTEMS // POWER: ECO-STANDBY');
}"""

assert old_switch_func in content, "old_switch_func not found!"
content = content.replace(old_switch_func, new_switch_func, 1)

# 4. Raycast and Handle Interact
old_raycast_block = """    if (hitObj && hitObj.userData.actionPrompt) {
      fpov.activeInteractable = hitObj;
      if (fpovPrompt) {
        fpovPrompt.hidden = false;
        if (fpovPromptText) fpovPromptText.textContent = hitObj.userData.actionPrompt;
      }
      return;
    }"""

new_raycast_block = """    if (hitObj && hitObj.userData.actionPrompt) {
      if (hitObj.userData.isSwitchboard && hits[0].point) {
        const hy = hits[0].point.y;
        if (hy >= 1.565) {
          hitObj.userData.actionPrompt = 'SWITCH 1: TOGGLE FAN';
          hitObj.userData.switchButtonId = 1;
        } else if (hy >= 1.475) {
          hitObj.userData.actionPrompt = 'SWITCH 2: TOGGLE CEILING LIGHTS';
          hitObj.userData.switchButtonId = 2;
        } else {
          hitObj.userData.actionPrompt = 'SWITCH 3: TOGGLE AMBIENT GLOW';
          hitObj.userData.switchButtonId = 3;
        }
      }
      fpov.activeInteractable = hitObj;
      if (fpovPrompt) {
        fpovPrompt.hidden = false;
        if (fpovPromptText) fpovPromptText.textContent = hitObj.userData.actionPrompt;
      }
      return;
    }"""

assert old_raycast_block in content, "old_raycast_block not found!"
content = content.replace(old_raycast_block, new_raycast_block, 1)

# 5. Handle Interact switch dispatch
old_handle_interact = """  if (target.userData.isLaptop) {
    focusLaptop();
  } else if (target.userData.isSwitchboard) {
    toggleRoomSystems();
  } else if (target.userData.isYellowDoor) {"""

new_handle_interact = """  if (target.userData.isLaptop) {
    focusLaptop();
  } else if (target.userData.isSwitchboard) {
    toggleSwitchButton(target.userData.switchButtonId || 0);
  } else if (target.userData.isYellowDoor) {"""

assert old_handle_interact in content, "old_handle_interact not found!"
content = content.replace(old_handle_interact, new_handle_interact, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js and src/main.js successfully updated!')
