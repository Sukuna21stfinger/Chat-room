const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
// Avoid importing `electron-is-dev` (ESM-only in some installs) — use env/process heuristics
const isDev = (process.env.ELECTRON_IS_DEV === 'true') || (process.env.NODE_ENV === 'development') || Boolean(process.defaultApp) || /[\\/]electron[\\/]/.test(process.execPath);
const fs = require('fs-extra');

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // Allow file system access
    },
    icon: path.join(__dirname, 'favicon.ico'),
    show: false,
    titleBarStyle: 'default'
  });

  // Create secure-chats directory in app directory
  const appPath = app.getAppPath();
  const chatDir = path.join(path.dirname(appPath), 'secure-chats');
  
  try {
    fs.ensureDirSync(chatDir);
    console.log('✅ Secure chat directory created at:', chatDir);
  } catch (error) {
    console.error('❌ Failed to create chat directory:', error);
  }

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Show chat directory in console
    console.log('💬 ChatApp Desktop Started');
    console.log('🔒 Encrypted chats will be saved to:', chatDir);
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    app.quit();
  });

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Chat Directory',
          click: () => {
            const { shell } = require('electron');
            shell.openPath(chatDir);
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Privacy',
      submenu: [
        {
          label: 'View Chat Directory',
          click: () => {
            const { shell } = require('electron');
            shell.openPath(chatDir);
          }
        },
        {
          label: 'Clear All Chats',
          click: () => {
            const { dialog } = require('electron');
            const result = dialog.showMessageBoxSync(mainWindow, {
              type: 'warning',
              buttons: ['Cancel', 'Delete All'],
              defaultId: 0,
              title: 'Clear All Chats',
              message: 'Are you sure you want to delete all encrypted chat files?',
              detail: 'This action cannot be undone.'
            });
            
            if (result === 1) {
              try {
                fs.emptyDirSync(chatDir);
                dialog.showMessageBoxSync(mainWindow, {
                  type: 'info',
                  title: 'Chats Cleared',
                  message: 'All encrypted chat files have been deleted.'
                });
              } catch (error) {
                dialog.showErrorBox('Error', 'Failed to clear chat files: ' + error.message);
              }
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About ChatApp',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBoxSync(mainWindow, {
              type: 'info',
              title: 'About ChatApp',
              message: 'ChatApp Desktop v1.0.0',
              detail: '🔒 Secure & Private Real-time Messaging\n💬 End-to-end encrypted local storage\n🎨 Modern UI with multiple themes\n\nYour chats are saved locally and encrypted for maximum privacy.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});