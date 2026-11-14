import { Fragment, useEffect, useState } from 'react'
import './App.css'

const API_URL = '/api'

type Persona = {
  id: string
  name: string
  apellidos: string | null
  department: string | null
  image_url: string | null
  score: number
}

function displayName(persona: Persona) {
  return [persona.name, persona.apellidos].filter(Boolean).join(' ')
}

function Portrait({ persona }: { persona: Persona }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [persona.image_url])

  if (!persona.image_url || failed) {
    return <span className="placeholder">{displayName(persona)}</span>
  }

  return (
    <img
      src={persona.image_url}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}

function App() {
  const [pair, setPair] = useState<[Persona, Persona] | null>(null)
  const [leader, setLeader] = useState<Persona | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMatch(signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/match`, { signal })
    if (!response.ok) throw new Error('No se pudo cargar el par')

    const data = (await response.json()) as Persona[]
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('No hay suficientes profesores')
    }

    setPair([data[0], data[1]])
    setSelectedId(null)
    setError(null)
  }

  async function loadTop(signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/top`, { signal })
    if (!response.ok) throw new Error('No se pudo cargar el primero')

    const data = (await response.json()) as Persona[]
    setLeader(Array.isArray(data) ? (data[0] ?? null) : null)
  }

  useEffect(() => {
    const controller = new AbortController()

    loadMatch(controller.signal).catch((loadError: unknown) => {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return
      setError('No se pudieron cargar los profesores.')
    })

    loadTop(controller.signal).catch((loadError: unknown) => {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return
    })

    return () => controller.abort()
  }, [])

  async function vote(winner: Persona) {
    if (!pair || busy) return

    const loser = pair.find((persona) => persona.id !== winner.id)
    if (!loser) return

    setSelectedId(winner.id)
    setBusy(true)
    setError(null)

    let recorded = false

    try {
      const response = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId: winner.id, loserId: loser.id }),
      })
      if (!response.ok) throw new Error('No se pudo registrar el voto')
      recorded = true
      await Promise.all([loadMatch(), loadTop().catch(() => undefined)])
    } catch {
      setSelectedId(null)
      setError(
        recorded
          ? 'El voto se registró, pero no se pudo cargar el siguiente par.'
          : 'No se pudo registrar el voto.',
      )
      if (recorded) setPair(null)
    } finally {
      setBusy(false)
    }
  }

  const slots = pair ?? [null, null]

  return (
    <div className="page">
      <header className="titlebar">
        <h1>Rank Tec CEM</h1>
      </header>

      <section className="canvas">
        <p className="tagline">Rankear que? Tu decide.</p>
        <p className="prompt">Algunos nombres y fotos podrian ser irrelevantes</p>
        {error && <p className="status">{error}</p>}

        <main className="choices" aria-label="Elige al profesor">
          {slots.map((persona, index) => {
            const isSelected = persona !== null && selectedId === persona.id

            return (
              <Fragment key={persona?.id ?? index}>
                {index === 1 && (
                  <span className="or" aria-hidden="true">
                    o
                  </span>
                )}
                <div className="choice">
                  <button
                    type="button"
                    aria-label={persona ? `Votar por ${displayName(persona)}` : 'Cargando profesor'}
                    className={isSelected ? 'holder selected' : 'holder'}
                    disabled={!persona || busy}
                    onClick={() => persona && vote(persona)}
                  >
                    {persona ? (
                      <Portrait persona={persona} />
                    ) : (
                      <span className="placeholder">Cargando</span>
                    )}
                  </button>
                  <p className="description">
                    {persona ? displayName(persona) : 'Cargando'}
                    {persona?.department && (
                      <span className="department">{persona.department}</span>
                    )}
                  </p>
                </div>
              </Fragment>
            )
          })}
        </main>

        {leader && (
          <aside className="leader">
            <p className="leader-label">Más votado hasta ahora</p>
            <div className="leader-photo">
              <Portrait persona={leader} />
            </div>
            <p className="description">
              {displayName(leader)}
              {leader.department && <span className="department">{leader.department}</span>}
            </p>
          </aside>
        )}
      </section>

      <footer className="footer">
        <span className="version">v1.0.1</span>
      </footer>
    </div>
  )
}

export default App
