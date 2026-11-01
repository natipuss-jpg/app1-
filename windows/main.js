'use strict';
/**
 * COC Prep - Windows app. One window that shows the COC Prep website.
 * If your website address ever changes, change START_URL below.
 */
const { app, BrowserWindow, Menu, session, shell } = require('electron');
const path = require('path');

const START_URL = 'https://cocquiz.free.je/';
const START_HOST = new URL(START_URL).host;
const ICON = path.join(__dirname, 'build', 'icon.png');

let win = null;

function isOurs(url) {
  try { return new URL(url).host === START_HOST; } catch (e) { return false; }
}

function openExternal(url) {
  try {
    const p = new URL(url).protocol;
    if (p === 'http:' || p === 'https:' || p === 'mailto:' || p === 'tel:') { shell.openExternal(url); }
  } catch (e) { /* ignore bad links */ }
}

function showOffline() {
  if (win && !win.isDestroyed()) {
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: START_URL } });
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 480,
    title: 'COC Prep',
    icon: ICON,
    backgroundColor: '#3b5bf0',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  win.once('ready-to-show', function () { win.show(); });
  win.on('closed', function () { win = null; });

  const wc = win.webContents;

  // Links to other websites open in the normal browser; our own pages stay in the app
  wc.setWindowOpenHandler(function (details) {
    if (isOurs(details.url)) {
      return { action: 'allow', overrideBrowserWindowOptions: { width: 1000, height: 760, icon: ICON, autoHideMenuBar: true } };
    }
    openExternal(details.url);
    return { action: 'deny' };
  });
  wc.on('will-navigate', function (event, url) {
    if (!isOurs(url) && url.indexOf('file:') !== 0) { event.preventDefault(); openExternal(url); }
  });

  // No internet: show a friendly page with a "Try again" button
  wc.on('did-fail-load', function (event, code, desc, url, isMainFrame) {
    if (isMainFrame && code !== -3) { showOffline(); }
  });

  // Keyboard: F5 reload, F11 full screen, Alt+Left back, Ctrl + / - / 0 zoom
  wc.on('before-input-event', function (event, input) {
    if (input.type !== 'keyDown') { return; }
    const ctrl = input.control || input.meta;
    const k = input.key;
    if (k === 'F5' || (ctrl && (k === 'r' || k === 'R'))) { wc.reload(); event.preventDefault(); }
    else if (k === 'F11') { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); }
    else if (input.alt && k === 'ArrowLeft') { if (wc.canGoBack()) { wc.goBack(); } event.preventDefault(); }
    else if (ctrl && (k === '+' || k === '=')) { wc.setZoomLevel(Math.min(wc.getZoomLevel() + 0.5, 4)); event.preventDefault(); }
    else if (ctrl && (k === '-' || k === '_')) { wc.setZoomLevel(Math.max(wc.getZoomLevel() - 0.5, -3)); event.preventDefault(); }
    else if (ctrl && k === '0') { wc.setZoomLevel(0); event.preventDefault(); }
  });

  // Right-click menu for copy / paste
  wc.on('context-menu', function (event, params) {
    const items = [];
    if (params.isEditable) {
      items.push({ role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { type: 'separator' }, { role: 'selectAll' });
    } else if (params.selectionText) {
      items.push({ role: 'copy' });
    }
    if (items.length) { Menu.buildFromTemplate(items).popup({ window: win }); }
  });

  win.loadURL(START_URL);
}

function start() {
  Menu.setApplicationMenu(null);

  const ses = session.defaultSession;
  // Look like a normal Chrome browser (some hosts block unknown browsers), plus a word the site can recognise
  const ua = ses.getUserAgent()
    .replace(/\s*Electron\/[\d.]+/i, '')
    .replace(/\s[^\s\/)]+\/[\d.]+(?=\s+Chrome\/)/i, '') + ' COCPrepApp/1.0';
  ses.setUserAgent(ua);

  // The site never needs camera, microphone, location ...
  ses.setPermissionRequestHandler(function (wc, permission, callback) { callback(false); });

  // Downloads (ZIP files ...): the student picks where to save; then the folder opens
  ses.on('will-download', function (event, item) {
    item.once('done', function (e, state) {
      if (state === 'completed') { shell.showItemInFolder(item.getSavePath()); }
    });
  });

  createWindow();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', function () {
    if (win) { if (win.isMinimized()) { win.restore(); } win.focus(); }
  });
  app.whenReady().then(start);
}

app.on('before-quit', function () {
  try { session.defaultSession.cookies.flushStore(); } catch (e) { /* ignore */ }
});
app.on('window-all-closed', function () { app.quit(); });
