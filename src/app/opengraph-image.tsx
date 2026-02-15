import { ImageResponse } from 'next/og'

export const alt = '人生解碼 - LifeCode'
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F5F1E8 0%, #F0EBE0 50%, #EBE5D8 100%)',
          borderRadius: '37px',
          fontFamily: '"STSong", "SimSun", "宋体", "MingLiU", "新細明體", "Noto Serif SC", "PingFang TC", serif',
        }}
      >
        <div
          style={{
            fontSize: '36px',
            fontWeight: 500,
            color: '#B85C38',
            letterSpacing: '2.5px',
            textAlign: 'center',
            fontStyle: 'normal',
          }}
        >
          人生解碼
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
