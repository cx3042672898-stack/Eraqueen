// ============================================================
// js/core/file_save.js
// 存档文件系统 —— 支持所有浏览器
//
// 两条路径：
//   A. File System Access API（Chrome 86+ / Edge 86+）
//      → 直接读写本地文件夹，体验最好
//   B. 通用路径（所有浏览器，含 UC / QQ / Sogou / Safari /
//      系统浏览器 / Firefox）
//      → 保存时自动下载 .sav 文件；读取时用文件选择器导入
//
// localStorage 键约定：
//   era_fsv_<filename>  —— 文件存档缓存（FSAPI 模式）
//   era_msv_<timestamp> —— 旧式手动存档（无文件）
// ============================================================

'use strict';

var FileSaveSystem = (function () {

  // ── 内部状态 ───────────────────────────────────────────────
  var _dirHandle = null;            // FileSystemDirectoryHandle（FSAPI 模式）
  var _SAVE_EXT  = '.sav';
  var _LS_PREFIX = 'era_fsv_';     // localStorage 键前缀（FSAPI 模式）
  var _DB_NAME   = 'era_filesave_db';
  var _DB_STORE  = 'handles';
  var _DB_KEY    = 'save_dir';
  var _db        = null;

  // ── IndexedDB（用于持久化 FSAPI 目录句柄）─────────────────

  function _openDB() {
    return new Promise(function (resolve, reject) {
      if (_db) { resolve(_db); return; }
      var req = indexedDB.open(_DB_NAME, 1);
      req.onupgradeneeded = function (e) {
        if (!e.target.result.objectStoreNames.contains(_DB_STORE)) {
          e.target.result.createObjectStore(_DB_STORE);
        }
      };
      req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
      req.onerror   = function (e) { reject(e.target.error); };
    });
  }

  function _putHandle(h) {
    return _openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx  = db.transaction(_DB_STORE, 'readwrite');
        var req = tx.objectStore(_DB_STORE).put(h, _DB_KEY);
        req.onsuccess = resolve;
        req.onerror   = function (e) { reject(e.target.error); };
      });
    });
  }

  function _getHandle() {
    return _openDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx  = db.transaction(_DB_STORE, 'readonly');
        var req = tx.objectStore(_DB_STORE).get(_DB_KEY);
        req.onsuccess = function (e) { resolve(e.target.result || null); };
        req.onerror   = function ()  { resolve(null); };
      });
    }).catch(function () { return null; });
  }

  // ── 能力检测 ───────────────────────────────────────────────

  /** 是否支持 File System Access API（Chrome/Edge） */
  function isFSAPISupported() {
    return typeof window.showDirectoryPicker === 'function';
  }

  /** 当前是否处于 FSAPI 文件夹模式 */
  function hasFolder() {
    return _dirHandle !== null;
  }

  /** 已选文件夹名称 */
  function getFolderName() {
    return _dirHandle ? _dirHandle.name : null;
  }

  // ── FSAPI 路径：文件夹管理 ─────────────────────────────────

  function requestFolder() {
    if (!isFSAPISupported()) return Promise.resolve(false);
    return window.showDirectoryPicker({ mode: 'readwrite' })
      .then(function (handle) {
        _dirHandle = handle;
        return _putHandle(handle).then(function () { return true; });
      })
      .catch(function (e) {
        if (e.name !== 'AbortError') console.error('[FileSave] 选择文件夹失败:', e);
        return false;
      });
  }

  function tryRestoreFolder() {
    if (!isFSAPISupported()) return Promise.resolve(false);
    return _getHandle().then(function (handle) {
      if (!handle) return false;
      return handle.queryPermission({ mode: 'readwrite' }).then(function (perm) {
        if (perm === 'granted') { _dirHandle = handle; return true; }
        return false;
      });
    }).catch(function () { return false; });
  }

  function listSaveFiles() {
    if (!_dirHandle) return Promise.resolve([]);
    var result = [];
    var iter = _dirHandle.entries();
    function _next() {
      return iter.next().then(function (item) {
        if (item.done) return result;
        var name = item.value[0], handle = item.value[1];
        if (handle.kind === 'file' && name.endsWith(_SAVE_EXT)) {
          return handle.getFile()
            .then(function (f) { return f.text(); })
            .then(function (t) {
              try { result.push({ filename: name, data: JSON.parse(t) }); } catch(e) {}
            })
            .catch(function () {})
            .then(_next);
        }
        return _next();
      });
    }
    return _next().catch(function () { return result; });
  }

  function writeSaveFile(filename, data) {
    if (!_dirHandle) return Promise.reject(new Error('未选择文件夹'));
    return _dirHandle.getFileHandle(filename, { create: true })
      .then(function (fh) { return fh.createWritable(); })
      .then(function (w) {
        return w.write(JSON.stringify(data, null, 2)).then(function () { return w.close(); });
      })
      .then(function () {
        try { localStorage.setItem(_LS_PREFIX + filename, JSON.stringify(data)); } catch(e) {}
      });
  }

  function deleteSaveFile(filename) {
    try { localStorage.removeItem(_LS_PREFIX + filename); } catch(e) {}
    if (!_dirHandle) return Promise.resolve();
    return _dirHandle.removeEntry(filename).catch(function (e) {
      console.warn('[FileSave] 删除文件失败:', filename, e);
    });
  }

  function syncWithLocalStorage() {
    if (!_dirHandle) return Promise.resolve({ added: 0, removed: 0 });
    return listSaveFiles().then(function (files) {
      var fileSet = {};
      files.forEach(function (f) { fileSet[f.filename] = f.data; });
      var lsKeys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.startsWith(_LS_PREFIX)) lsKeys.push(k);
      }
      var knownFilenames = {};
      lsKeys.forEach(function (k) { knownFilenames[k.slice(_LS_PREFIX.length)] = true; });
      var added = 0, removed = 0;
      Object.keys(fileSet).forEach(function (fname) {
        if (!knownFilenames[fname]) {
          try { localStorage.setItem(_LS_PREFIX + fname, JSON.stringify(fileSet[fname])); added++; } catch(e) {}
        }
      });
      lsKeys.forEach(function (k) {
        var fname = k.slice(_LS_PREFIX.length);
        if (!fileSet[fname]) { localStorage.removeItem(k); removed++; }
      });
      return { added: added, removed: removed };
    });
  }

  // ── 通用路径：下载 / 导入（所有浏览器均支持）──────────────

  /**
   * 将存档数据下载为 .sav 文件（全浏览器通用）
   * @param {string} filename   文件名（含 .sav）
   * @param {Object} data       存档数据
   */
  function downloadSaveFile(filename, data) {
    try {
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/octet-stream' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      return true;
    } catch(e) {
      console.error('[FileSave] 下载失败:', e);
      return false;
    }
  }

  /**
   * 打开文件选择器，让用户选择 .sav 文件并导入（全浏览器通用）
   * @returns {Promise<{filename:string, data:Object}>}
   */
  function importSaveFromPicker() {
    return new Promise(function (resolve, reject) {
      var input = document.createElement('input');
      input.type   = 'file';
      input.accept = '.sav,.json';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = function (e) {
        var file = e.target.files && e.target.files[0];
        document.body.removeChild(input);
        if (!file) { reject(new Error('未选择文件')); return; }
        var reader = new FileReader();
        reader.onload = function (ev) {
          try {
            var data = JSON.parse(ev.target.result);
            // 将导入的存档写入 localStorage 缓存（era_fsv_* 前缀）
            var fname = file.name.endsWith(_SAVE_EXT) ? file.name : file.name + _SAVE_EXT;
            try { localStorage.setItem(_LS_PREFIX + fname, JSON.stringify(data)); } catch(ex) {}
            resolve({ filename: fname, data: data });
          } catch(err) {
            reject(new Error('文件格式错误，请选择有效的 .sav 存档文件'));
          }
        };
        reader.onerror = function () { reject(new Error('读取文件失败')); };
        reader.readAsText(file);
      };

      input.oncancel = function () {
        document.body.removeChild(input);
        reject(new Error('用户取消'));
      };

      input.click();
    });
  }

  // ── 工具函数 ───────────────────────────────────────────────

  /** 生成合法的存档文件名 */
  function makeSaveFilename(saveName) {
    var safe = (saveName || '存档')
      .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 28);
    var uid = Date.now().toString(36).toUpperCase();
    return safe + '_' + uid + _SAVE_EXT;
  }

  // ── 对外暴露 ───────────────────────────────────────────────
  return {
    isFSAPISupported:    isFSAPISupported,
    hasFolder:           hasFolder,
    getFolderName:       getFolderName,
    requestFolder:       requestFolder,
    tryRestoreFolder:    tryRestoreFolder,
    listSaveFiles:       listSaveFiles,
    writeSaveFile:       writeSaveFile,
    deleteSaveFile:      deleteSaveFile,
    syncWithLocalStorage: syncWithLocalStorage,
    downloadSaveFile:    downloadSaveFile,       // ★ 通用：下载文件
    importSaveFromPicker: importSaveFromPicker,  // ★ 通用：导入文件
    makeSaveFilename:    makeSaveFilename,
    lsPrefix:            _LS_PREFIX,
  };

})();
