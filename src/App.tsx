import { useState } from 'react'
import { useStore } from './lib/store'
import Welcome from './components/Welcome'
import Home from './components/Home'
import Session from './components/Session'
import SkillTree from './components/SkillTree'
import Settings from './components/Settings'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'

export type Screen = 'home' | 'session' | 'skilltree' | 'settings'

export default function App() {
  const name = useStore((s) => s.name)
  const [screen, setScreen] = useState<Screen>('home')
  const [sessionMinutes, setSessionMinutes] = useState<5 | 8 | 15>(8)

  if (!name) {
    return <Welcome />
  }

  return (
    <div className="min-h-full max-w-md mx-auto flex flex-col">
      <Nav screen={screen} setScreen={setScreen} />
      <main className="flex-1 px-4 pb-24 pt-2">
        {screen === 'home' && (
          <Home
            onStartSession={(m) => {
              setSessionMinutes(m)
              setScreen('session')
            }}
            onOpenTree={() => setScreen('skilltree')}
          />
        )}
        {screen === 'session' && (
          <Session
            minutes={sessionMinutes}
            onExit={() => setScreen('home')}
          />
        )}
        {screen === 'skilltree' && <SkillTree onClose={() => setScreen('home')} />}
        {screen === 'settings' && <Settings onClose={() => setScreen('home')} />}
      </main>
      <PWAUpdatePrompt />
    </div>
  )
}

function Nav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  if (screen === 'session') return null // hide nav during a session
  return (
    <header className="sticky top-0 bg-slate-50/90 backdrop-blur px-4 py-3 flex items-center justify-between border-b border-slate-200">
      <div className="font-semibold tracking-tight">Money School</div>
      <nav className="flex gap-1 text-sm">
        <button
          onClick={() => setScreen('home')}
          className={`px-3 py-1.5 rounded-lg ${screen === 'home' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Home
        </button>
        <button
          onClick={() => setScreen('skilltree')}
          className={`px-3 py-1.5 rounded-lg ${screen === 'skilltree' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Skills
        </button>
        <button
          onClick={() => setScreen('settings')}
          className={`px-3 py-1.5 rounded-lg ${screen === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          aria-label="Settings"
        >
          ⚙
        </button>
      </nav>
    </header>
  )
}
