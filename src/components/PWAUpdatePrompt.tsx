import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Tiny toast that appears when a new version of the app is available.
 * One tap to reload, one tap to dismiss.
 */
export default function PWAUpdatePrompt() {
  const [show, setShow] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, _reg) {
      // optional: log registration
    },
    onRegisterError(_err) {
      // swallow — PWA isn't critical
    },
  })

  useEffect(() => {
    if (needRefresh) setShow(true)
  }, [needRefresh])

  if (!show) return null

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 max-w-md mx-auto">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <div className="flex-1 text-sm">
          A new version is ready.
        </div>
        <button
          onClick={() => {
            setShow(false)
            setNeedRefresh(false)
          }}
          className="text-slate-300 px-2 py-1 hover:text-white"
        >
          Later
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="bg-emerald-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-emerald-400"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
