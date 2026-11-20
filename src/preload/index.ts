import { contextBridge, ipcRenderer } from 'electron'
import type { PaceBridge, SessionSnapshot } from '../shared/types'

const api: PaceBridge = {
  discover: () => ipcRenderer.invoke('pace:discover'),
  start: (cameraId) => ipcRenderer.invoke('pace:start', cameraId),
  finish: () => ipcRenderer.invoke('pace:finish'),
  stop: () => ipcRenderer.invoke('pace:stop'),
  getSnapshot: () => ipcRenderer.invoke('pace:snapshot'),
  subscribe: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: SessionSnapshot) => listener(snapshot)
    ipcRenderer.on('pace:update', handler)
    return () => ipcRenderer.removeListener('pace:update', handler)
  },
  openExternal: (url) => ipcRenderer.invoke('pace:open-external', url),
}
contextBridge.exposeInMainWorld('pace', api)
