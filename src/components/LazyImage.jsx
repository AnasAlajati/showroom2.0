import { useState } from 'react'

export default function LazyImage({ src, alt, className, style, priority = false }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={className} style={style}>
      {/* Inner div owns the relative context for the shimmer overlay */}
      <div className="relative w-full h-full overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 bg-[#1e1e1e] animate-pulse" />
        )}
        <img
          src={src}
          alt={alt ?? ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    </div>
  )
}
