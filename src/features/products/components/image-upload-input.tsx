'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'

interface ImageUploadInputProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUploadInput({ value, onChange, label }: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const upload = useCallback(
    async (file: File) => {
      setUploading(true)
      setError(null)
      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Erro no upload')
        onChange(json.url as string)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro no upload')
      } finally {
        setUploading(false)
      }
    },
    [onChange],
  )

  const handleFile = (file: File | undefined) => {
    if (!file) return
    upload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}

      {/* Preview + drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        className={`relative flex h-28 w-28 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition ${
          dragging ? 'border-black bg-gray-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="Fazer upload de imagem"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            <span className="text-xs">Enviando…</span>
          </div>
        ) : value ? (
          <>
            <Image
              src={value}
              alt="preview"
              fill
              className="object-cover"
              sizes="112px"
              unoptimized
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
              <span className="text-xs font-medium text-white">Trocar</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m-4 4h8M4.5 19.5h15A1.5 1.5 0 0021 18V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
            <span className="text-center text-xs leading-tight">Clique ou arraste</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* URL manual fallback */}
      <input
        type="url"
        value={value}
        onChange={(e) => { setError(null); onChange(e.target.value) }}
        placeholder="ou cole uma URL"
        className="h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs text-muted-foreground shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Remover imagem
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
