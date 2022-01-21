import { app, BrowserWindow, screen } from 'electron';
import { join } from 'path';
import { format } from 'url';
import serve from 'electron-serve';

const loadURL = serve({ directory: '../../public/' });

const createApp = async () => {
  /**
   * Workaround for TypeScript bug
   * @see https://github.com/microsoft/TypeScript/issues/41468#issuecomment-727543400
   */
  //@ts-ignore
  const env = import.meta.env;

  let mainWindow: BrowserWindow | null = null;

  async function createWindow() {
    const display = screen.getPrimaryDisplay();

    mainWindow = new BrowserWindow({
      show: false,
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workAreaSize.width,
      height: display.workAreaSize.height,
      movable: true,
      autoHideMenuBar: true,
      resizable: true,
      frame: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.cjs.js'),
        contextIsolation: env.MODE !== 'test', // Spectron tests can't work with contextIsolation: true
        enableRemoteModule: env.MODE === 'test',
        // sandbox: true, // Spectron tests can't work with enableRemoteModule: false
      },
    });

    /**
     * URL for main window.
     * Vite dev server for development.
     * `file://../renderer/index.html` for production and test
     */
    if (env.MODE === 'production') {
      await loadURL(mainWindow);
    } else {
      const URL =
        env.MODE === 'development'
          ? env.VITE_DEV_SERVER_URL
          : format({
              protocol: 'file',
              pathname: join(__dirname, '../renderer/index.html'),
              slashes: true,
            });
      await mainWindow.loadURL(URL);
    }

    mainWindow.show();

    if (env.MODE === 'development') {
      mainWindow.webContents.openDevTools();
    }
  }

  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  await app.whenReady();

  if (env.PROD) {
    try {
      const { autoUpdater } = await import('electron-updater');
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (err) {
      console.error('Failed check updates:', err);
    }
  }

  try {
    await createWindow();
  } catch (err) {
    console.error('Failed create window:', err);
  }

  return {
    app,
    mainWindow,
  };
};

const gotTheLock = app.requestSingleInstanceLock();

let waitForApp: ReturnType<typeof createApp>;
if (!gotTheLock) {
  app.quit();
} else {
  waitForApp = createApp();
}

const getApp = () => waitForApp;
export default getApp;
