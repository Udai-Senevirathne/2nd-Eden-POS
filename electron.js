const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window optimized for POS cashier use
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    title: '2nd Eden POS - Cashier Terminal',
    // Remove default menu bar for cleaner POS look
    autoHideMenuBar: true,
    // Application icon
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false, // Don't show until ready
  });

  // Load the React app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development mode - load from dev server
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile('dist/index.html');
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Remove default menu for cleaner POS interface
  Menu.setApplicationMenu(null);

  // Handle window closed
  mainWindow.on('closed', () => {
    app.quit();
  });

  return mainWindow;
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    // Prevent opening new windows (security measure for POS)
    event.preventDefault();
  });
});

// Additional security for POS environment
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Prevent certificate errors in POS environment
  event.preventDefault();
  callback(true);
});