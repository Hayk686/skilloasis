import { ImageResponse } from 'next/og'

export const alt = 'Info Oasis — learn anything with a smart AI tutor'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#07050f',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            top: -260,
            left: -120,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(168,85,247,.55), rgba(168,85,247,0) 68%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            right: -280,
            bottom: -380,
            borderRadius: 999,
            background: 'radial-gradient(circle, rgba(20,184,166,.42), rgba(20,184,166,0) 68%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 24,
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 30,
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            padding: '72px 82px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 22,
                background: 'linear-gradient(135deg, #8b5cf6, #d946ef, #ec4899)',
                boxShadow: '0 18px 50px rgba(217,70,239,.32)',
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: -1,
              }}
            >
              IO
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>Info Oasis</span>
              <span style={{ marginTop: 4, color: '#aaa4b8', fontSize: 19 }}>learn anything</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 940 }}>
            <div style={{ display: 'flex', fontSize: 68, fontWeight: 900, letterSpacing: -3, lineHeight: 1.04 }}>
              Learn anything with a smart AI tutor
            </div>
            <div style={{ display: 'flex', marginTop: 26, color: '#b9b3c6', fontSize: 25, lineHeight: 1.35 }}>
              Interactive lessons, adaptive quizzes, flashcards, knowledge maps, and coding practice—all in one place.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, color: '#d8d3df', fontSize: 18 }}>
            <span style={{ display: 'flex', padding: '10px 17px', border: '1px solid rgba(255,255,255,.13)', borderRadius: 999 }}>AI tutor</span>
            <span style={{ display: 'flex', padding: '10px 17px', border: '1px solid rgba(255,255,255,.13)', borderRadius: 999 }}>Free learning tools</span>
            <span style={{ display: 'flex', padding: '10px 17px', border: '1px solid rgba(255,255,255,.13)', borderRadius: 999 }}>English · Русский · Հայերեն</span>
          </div>
        </div>
      </div>
    ),
    size
  )
}
