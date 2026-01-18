const MODULE_ID = "hide-hotbar";

let _keyBlockerActive = false;
let _keyBlockerHandler = null;

function _getMinRoleToSeeHotbar() {
  return Number(game.settings.get(MODULE_ID, "minRoleToSeeHotbar"));
}

function _getBlockHotbarKeys() {
  return Boolean(game.settings.get(MODULE_ID, "blockHotbarKeysWhenHidden"));
}

function _shouldShowHotbar() {
  const threshold = _getMinRoleToSeeHotbar();
  return game.user.role >= threshold;
}

function _isTextInputTarget(target) {
  if (!target) return false;
  if (target.tagName === "INPUT") return true;
  if (target.tagName === "TEXTAREA") return true;
  if (target.isContentEditable) return true;
  return false;
}

function _enableKeyBlocker() {
  if (_keyBlockerActive) return;

  _keyBlockerHandler = (event) => {
    if (!_keyBlockerActive) return;
    if (event.defaultPrevented) return;

    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (_isTextInputTarget(event.target)) return;

    const key = event.key;
    const code = event.code;

    const isDigitKey = key === "0" || (key >= "1" && key <= "9");
    const isNumpadDigit = typeof code === "string" && code.startsWith("Numpad") && (code.endsWith("0") || code.endsWith("1") || code.endsWith("2") || code.endsWith("3") || code.endsWith("4") || code.endsWith("5") || code.endsWith("6") || code.endsWith("7") || code.endsWith("8") || code.endsWith("9"));

    if (!isDigitKey && !isNumpadDigit) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  };

  window.addEventListener("keydown", _keyBlockerHandler, { capture: true });
  _keyBlockerActive = true;
}

function _disableKeyBlocker() {
  if (!_keyBlockerActive) return;
  if (_keyBlockerHandler) {
    window.removeEventListener("keydown", _keyBlockerHandler, { capture: true });
  }
  _keyBlockerHandler = null;
  _keyBlockerActive = false;
}

function _applyHotbarVisibility() {
  const show = _shouldShowHotbar();
  const blockKeys = _getBlockHotbarKeys();

  document.body.classList.toggle("hh-hotbar-hidden", !show);

  if (ui.hotbar?.element) {
    ui.hotbar.element.toggle(show);
  }

  if (!show && blockKeys) _enableKeyBlocker();
  else _disableKeyBlocker();
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "minRoleToSeeHotbar", {
    name: "最低可见权限等级",
    hint: "低于该权限等级的用户将完全隐藏底部宏快捷栏。",
    scope: "world",
    config: true,
    type: Number,
    choices: {
      [CONST.USER_ROLES.PLAYER]: "普通玩家",
      [CONST.USER_ROLES.TRUSTED]: "受信玩家",
      [CONST.USER_ROLES.ASSISTANT]: "GM助手",
      [CONST.USER_ROLES.GAMEMASTER]: "GM"
    },
    default: CONST.USER_ROLES.TRUSTED,
    onChange: () => _applyHotbarVisibility()
  });

  game.settings.register(MODULE_ID, "blockHotbarKeysWhenHidden", {
    name: "隐藏时禁用宏数字键",
    hint: "当宏快捷栏被隐藏时，拦截数字键（1-0 / 小键盘）以防止触发宏。",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => _applyHotbarVisibility()
  });
});

Hooks.once("ready", () => {
  _applyHotbarVisibility();
});

Hooks.on("renderHotbar", () => {
  _applyHotbarVisibility();
});

Hooks.on("updateUser", (user) => {
  if (user?.id !== game.user.id) return;
  _applyHotbarVisibility();
});
