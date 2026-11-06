import { fs, type FsNode } from '@/data/fs'
import { openApp } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'

/** Open a file the way Finder would: folders in Finder, documents in their app. */
export function openFile(nodeOrId: FsNode | string) {
  const node = typeof nodeOrId === 'string' ? fs.get(nodeOrId) : nodeOrId
  if (!node) return
  if (node.kind !== 'folder' && node.kind !== 'app') useDesktop.getState().addRecent(node.id)
  switch (node.kind) {
    case 'folder':
      openApp('finder', { path: node.id })
      break
    case 'app':
      if (node.appId) openApp(node.appId)
      break
    case 'text':
      openApp('textedit', { fileId: node.id, title: node.name })
      break
    case 'pdf':
      openApp('resume')
      break
    case 'vcf':
      openApp('contact')
      break
    case 'project':
      openApp('projects', { projectId: node.projectId })
      break
    case 'link':
      openApp('safari', { url: node.url })
      break
  }
}
