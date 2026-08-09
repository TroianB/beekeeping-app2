const OLD_PREFIX = "bk.";
const APP2_PREFIX = "bk2.";

function app2Key(key) {
  return typeof key === "string" && key.startsWith(OLD_PREFIX)
    ? `${APP2_PREFIX}${key.slice(OLD_PREFIX.length)}`
    : key;
}

function migrateExistingData() {
  try {
    ["hives", "tasks", "inventory", "treatments", "theme"].forEach((name) => {
      const oldKey = `${OLD_PREFIX}${name}`;
      const newKey = `${APP2_PREFIX}${name}`;
      if (localStorage.getItem(newKey) == null && localStorage.getItem(oldKey) != null) {
        localStorage.setItem(newKey, localStorage.getItem(oldKey));
      }
    });
  } catch {}
}

if (!window.__BK2_STORAGE_PATCHED__) {
  window.__BK2_STORAGE_PATCHED__ = true;
  migrateExistingData();

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.getItem = function patchedGetItem(key) {
    return originalGetItem.call(this, this === window.localStorage ? app2Key(key) : key);
  };

  Storage.prototype.setItem = function patchedSetItem(key, value) {
    return originalSetItem.call(this, this === window.localStorage ? app2Key(key) : key, value);
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    return originalRemoveItem.call(this, this === window.localStorage ? app2Key(key) : key);
  };
}
