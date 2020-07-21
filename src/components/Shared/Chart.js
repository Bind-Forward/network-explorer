import React, { useState, useEffect } from 'react'

export default function WindowSize({children}) {
  const [[windowWidth, windowHeight], setWindowSize] = useState([window.innerWidth, window.innerHeight])
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const handleResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight])
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return (
    <div width={windowWidth} height={windowHeight} >
      {children}
    </div>
  )
}

