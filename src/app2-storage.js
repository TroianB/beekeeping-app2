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

function toCount(value) {
  const number = parseInt(String(value ?? 0), 10);
  return Number.isFinite(number) && number >= 0 ? number : 0;
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
    const mappedKey = this === window.localStorage ? app2Key(key) : key;

    if (this === window.localStorage && mappedKey === `${APP2_PREFIX}hives`) {
      try {
        const incoming = JSON.parse(value);
        if (Array.isArray(incoming)) {
          let existing = [];
          try {
            const rawExisting = originalGetItem.call(this, mappedKey);
            const parsedExisting = rawExisting ? JSON.parse(rawExisting) : [];
            existing = Array.isArray(parsedExisting) ? parsedExisting : [];
          } catch {}
          const existingById = new Map(existing.map((hive) => [hive?.id, hive]));
          const normalized = incoming.map((hive) => {
            const previous = existingById.get(hive?.id) || {};
            const nucs = hive?.nucs == null ? toCount(previous.nucs) : toCount(hive.nucs);
            const foodStores = ["Low", "Medium", "High"].includes(hive?.foodStores)
              ? hive.foodStores
              : (["Low", "Medium", "High"].includes(previous.foodStores) ? previous.foodStores : "Medium");
            return {
              ...hive,
              nucs,
              foodStores,
              numHives: toCount(hive?.singleHives) + toCount(hive?.doubleHives) + nucs,
            };
          });
          return originalSetItem.call(this, mappedKey, JSON.stringify(normalized));
        }
      } catch {}
    }

    return originalSetItem.call(this, mappedKey, value);
  };

  Storage.prototype.removeItem = function patchedRemoveItem(key) {
    return originalRemoveItem.call(this, this === window.localStorage ? app2Key(key) : key);
  };
}
