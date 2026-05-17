'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface HeroSliderProps {
  images: string[]
  intervalMs?: number
}

export function HeroSlider({ images, intervalMs = 5000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => setCurrent((i) => (i + 1) % images.length), intervalMs)
    return () => clearInterval(timer)
  }, [images.length, intervalMs])

  if (images.length === 0) return null

  return (
    <>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${
            i === current ? 'opacity-40' : 'opacity-0'
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir para foto ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full bg-white transition-all duration-300 ${
                i === current ? 'w-6 opacity-100' : 'w-1.5 opacity-50'
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}
