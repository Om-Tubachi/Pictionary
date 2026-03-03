/* eslint-disable no-undef */
/* eslint-disable react-hooks/refs */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react'
import { useRoom } from '../Context/roomContext'
import { socket } from '../socket'

const COLORS = ['#000000', '#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#a855f7', '#ec4899', '#14b8a6']
const WIDTHS = [2, 4, 6, 10, 16]

function Canvas() {
    const { room, currPlayer, roomId, canvasRef, handleUndo, handleRedo, handleDraw, handleDelete } = useRoom()
    const [stroke, setStroke] = useState({})
    const [started, setIsstarted] = useState(false)
    const [color, setColor] = useState('#0000')
    const [width, setWidth] = useState(2)
    const coords = useRef({ x: 0, y: 0 })
    const isMyTurn = socket?.id === currPlayer?.id, roomState = room?.gameState?.roomState

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ct = canvas.getContext('2d')
        canvas.width = canvas.getBoundingClientRect().width
        canvas.height = canvas.getBoundingClientRect().height
        
    }, [roomState])

    const startToDraw = (e) => {

        if (!isMyTurn) return
        setIsstarted(true)
        const x = e.nativeEvent.offsetX
        const y = e.nativeEvent.offsetY
        coords.current = { x, y }
        setStroke({ points: [{ x, y }], width, color })
    }

    const draw = (e) => {
        if (!started) return
        const currX = e.nativeEvent.offsetX
        const currY = e.nativeEvent.offsetY

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        ctx.beginPath()
        ctx.moveTo(coords.current.x, coords.current.y)
        ctx.lineTo(currX, currY)
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.stroke()


        coords.current = { x: currX, y: currY }
        console.log('Drawing at:', currX, currY)

        setStroke(prevStroke => ({
            ...prevStroke,
            points: [...prevStroke.points, { x: currX, y: currY }]
        }))
    }

    const stopDrawing = (e) => {

        if (!started) return
        setIsstarted(false)
        handleDraw(stroke)
        setIsstarted(false)

    }

    if (roomState !== 'in-progress') return;

    return (
        <div className='bg-slate-800 rounded-lg p-6 space-y-4'>
            <canvas
                ref={canvasRef}
                className='w-full h-96 bg-white rounded-lg cursor-crosshair'
                onMouseDown={startToDraw}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
            // onMouseLeave={stopDrawing}
            />
            {isMyTurn &&
                <div className='space-y-3'>
                    <div className='flex gap-2'>
                        <button onClick={() => handleUndo()} className='flex-1 bg-slate-700 text-white text-sm py-2 px-3 rounded'>Undo</button>
                        <button onClick={() => handleRedo()} className='flex-1 bg-slate-700 text-white text-sm py-2 px-3 rounded'>Redo</button>
                        <button onClick={() => handleDelete()} className='flex-1 bg-red-600 text-white text-sm py-2 px-3 rounded'>Clear</button>
                    </div>

                    <div>
                        <label className='block text-sm text-slate-300 mb-1'>Color</label>
                        <div className='flex flex-wrap gap-2'>
                            {COLORS.map(c => (
                                <div key={c} onClick={() => setColor(c)} className='w-7 h-7 rounded-full cursor-pointer' style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className='block text-sm text-slate-300 mb-1'>Brush Size</label>
                        <select onChange={(e) => setWidth(parseInt(e.target.value))} className='w-full bg-slate-700 text-white px-3 py-2 rounded'>
                            {WIDTHS.map(w => (
                                <option key={w} value={w}>{w}px</option>
                            ))}
                        </select>
                    </div>
                </div>}

        </div>
    )
}

export default Canvas