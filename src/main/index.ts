import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { SmartSpectraController } from './smartspectra'
import { isTrustedApplicationUrl } from '../shared/ipc-security'

const here = fileURLToPath(new URL('.', import.meta.url))
app.setName('Pace')
const credentialDirectory = app.isPackaged ? app.getPath('userData') : app.getAppPath()
config({ path: resolve(credentialDirectory, '.env') })
const controller = new SmartSpectraController()
let mainWindow: BrowserWindow | null = null

function trustedSender(event: Electron.IpcMainInvokeEvent) {
  const url = event.senderFrame?.url ?? ''
  const rendererFile = pathToFileURL(resolve(here, '../renderer/index.html')).href
  return isTrustedApplicationUrl(url, app.isPackaged, rendererFile)
}
function handle(channel: string, callback: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => unknown) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!trustedSender(event)) throw new Error('Untrusted application frame')
    return callback(event, ...args)
  })
}

handle('pace:discover', () => controller.discover())
handle('pace:start', (_event, cameraId) => controller.start(cameraId))
handle('pace:finish', () => controller.finish())
handle('pace:stop', () => controller.stop())
handle('pace:snapshot', () => controller.getSnapshot())
handle('pace:open-external', async (_event, url) => {
  if (url !== 'https://presagetech.com/legal/privacy-policy' && url !== 'https://smartspectra.presagetech.com/docs/telemetry-and-privacy/') return
  await shell.openExternal(url)
})

controller.subscribe((snapshot) => mainWindow?.webContents.send('pace:update', snapshot))

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 960, minWidth: 900, minHeight: 700,
    backgroundColor: '#101817', show: false,
    webPreferences: {
      preload: resolve(here, '../preload/index.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  })
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  if (process.env.ELECTRON_RENDERER_URL) void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void mainWindow.loadFile(resolve(here, '../renderer/index.html'))
  mainWindow.on('closed', () => { mainWindow = null; void controller.stop() })
}

app.whenReady().then(() => {
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
    contents.on('will-navigate', (event, url) => {
      const rendererFile = pathToFileURL(resolve(here, '../renderer/index.html')).href
      const allowed = isTrustedApplicationUrl(url, app.isPackaged, rendererFile)
      if (!allowed) event.preventDefault()
    })
  })
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

let quitting = false
app.on('before-quit', (event) => {
  if (quitting) return
  event.preventDefault()
  quitting = true
  void controller.shutdown().finally(() => app.quit())
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
