import { useEffect, useState } from 'react'
import './App.css'

// Endpoint that returns { images: [url, url] }. Leave empty to keep placeholders.
const IMAGE_API_URL = ''

type ImageApiResponse = {
  images?: string[]
}

function App() {
  const [images, setImages] = useState<[string | null, string | null]>([
    null,
    null,
  ])
  const [selected, setSelected] = useState<0 | 1 | null>(null)

  useEffect(() => {
    if (!IMAGE_API_URL) return

    const controller = new AbortController()

    fetch(IMAGE_API_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Image request failed')
        return response.json() as Promise<ImageApiResponse | string[]>
      })
      .then((data) => {
        const urls = Array.isArray(data) ? data : data.images
        setImages([urls?.[0] ?? null, urls?.[1] ?? null])
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
      })

    return () => controller.abort()
  }, [])

  const choices = [
    { side: 'Left', description: 'Left description.' },
    { side: 'Right', description: 'Right description.' },
  ] as const

  return (
    <div className="page">
      <header className="header">
        <h1>Rank Tec CEM</h1>
        <p className="subtitle">Rankear que? Tu decide. (Algunas de las fotos no seran relevantes por como estan scrappeadas, tengan paciencia :) )</p>
      </header>

      <main className="choices" role="radiogroup" aria-label="Image choice">
        {images.map((src, index) => {
          const choice = index as 0 | 1
          const isSelected = selected === choice
          const { side, description } = choices[choice]

          return (
            <div className="choice" key={choice}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={src ? `${side} photo` : `${side} photo placeholder`}
                className={isSelected ? 'holder selected' : 'holder'}
                onClick={() => setSelected(choice)}
              >
                {src ? (
                  <img src={src} alt="" />
                ) : (
                  <span className="placeholder">{side}</span>
                )}
              </button>
              <p className="description">{description}</p>
            </div>
          )
        })}
      </main>
    </div>
  )
}

export default App
