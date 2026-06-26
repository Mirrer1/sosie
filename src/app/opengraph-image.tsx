import { ImageResponse } from 'next/og'

export const alt = 'Sosie — 내 취향을 닮은 옷, 같이 골라드려요'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// 링크 공유용 OG 이미지 생성
const OpengraphImage = () =>
  new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f4f0',
        color: '#222222',
      }}
    >
      <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -4 }}>Sosie</div>
      <div style={{ fontSize: 38, color: '#555555', letterSpacing: 6, marginTop: 8 }}>
        AI FASHION STYLIST
      </div>
      <div
        style={{
          width: 84,
          height: 8,
          backgroundColor: '#0a84ff',
          borderRadius: 999,
          marginTop: 32,
        }}
      />
    </div>,
    { ...size },
  )

export default OpengraphImage
