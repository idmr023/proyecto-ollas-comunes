"use client"

import { useEffect, useRef } from 'react'

type Props = {
  onSelect: (value: { address: string; lat?: number; lng?: number }) => void
}

function loadGoogleMaps(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'))
    if ((window as any).google && (window as any).google.maps) {
      resolve()
      return
    }

    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

export default function LocationAutocomplete({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  useEffect(() => {
    let mounted = true
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string
    if (!apiKey) return

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mounted || !inputRef.current || !(window as any).google) return

        const google = (window as any).google

        // init map
        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: -12.046374, lng: -77.042793 },
            zoom: 12,
          })
        }

        // init marker
        if (mapInstanceRef.current && !markerRef.current) {
          markerRef.current = new google.maps.Marker({
            map: mapInstanceRef.current,
            draggable: true,
            visible: false,
          })

          markerRef.current.addListener('dragend', () => {
            const pos = markerRef.current!.getPosition()
            if (!pos) return
            geocoderRef.current?.geocode({ location: pos }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address
                if (inputRef.current) inputRef.current.value = address
                onSelect({ address, lat: pos.lat(), lng: pos.lng() })
              }
            })
          })
        }

        // geocoder
        if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder()

        // autocomplete
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
        })
        autocompleteRef.current.bindTo('bounds', mapInstanceRef.current!)

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current!.getPlace()
          const address = place.formatted_address ?? (inputRef.current?.value ?? '')
          const lat = place.geometry?.location?.lat?.()
          const lng = place.geometry?.location?.lng?.()

          if (lat && lng) {
            const pos = { lat, lng }
            mapInstanceRef.current!.setCenter(pos)
            mapInstanceRef.current!.setZoom(15)
            markerRef.current!.setPosition(pos)
            markerRef.current!.setVisible(true)
          }

          onSelect({ address, lat, lng })
        })

        // map click -> place marker + reverse geocode
        mapInstanceRef.current!.addListener('click', (ev: any) => {
          const latLng = ev.latLng
          markerRef.current!.setPosition(latLng)
          markerRef.current!.setVisible(true)
          geocoderRef.current!.geocode({ location: latLng }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              const address = results[0].formatted_address
              if (inputRef.current) inputRef.current.value = address
              onSelect({ address, lat: latLng.lat(), lng: latLng.lng() })
            }
          })
        })
      })
      .catch(() => {
        // ignore load errors for now
      })

    return () => {
      mounted = false
    }
  }, [onSelect])

  // helper: buscar texto en geocoder
  const handleSearch = () => {
    const address = inputRef.current?.value
    if (!address || !geocoderRef.current) return
    geocoderRef.current.geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location
        const pos = { lat: loc.lat(), lng: loc.lng() }
        mapInstanceRef.current?.setCenter(pos)
        mapInstanceRef.current?.setZoom(15)
        markerRef.current?.setPosition(pos)
        markerRef.current?.setVisible(true)
        onSelect({ address: results[0].formatted_address, lat: pos.lat, lng: pos.lng })
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          placeholder="Buscar o escribir dirección..."
          className="flex-1 p-2 rounded-xl border border-input bg-background text-sm"
        />
        <button type="button" onClick={handleSearch} className="px-3 rounded-xl bg-primary text-white">
          Buscar
        </button>
      </div>
      <div ref={mapRef} style={{ height: 300, width: '100%' }} />
    </div>
  )
}
