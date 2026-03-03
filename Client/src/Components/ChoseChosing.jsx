/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react'
import { useRoom } from '../Context/roomContext'
import { socket } from '../socket.js'

function ChoseChosing() {
    const { currPlayer, words, setWord, room, chosen } = useRoom()
    const roomState = room?.gameState?.roomState
    let timer
    // const [timeLeft, setTimeLeft] = useState(10)
    if (roomState !== 'in-progress') return null

    if (!currPlayer?.id) return null

    const isMyTurn = socket.id === currPlayer.id

    useEffect(() => {
        if (!isMyTurn || words.length === 0) return

        timer = setTimeout(() => {
            setWord(words[0])  // Auto-pick first word
            console.log('Auto picking despite already picked');
            
        }, 10000)

        return () => {
            clearTimeout(timer)
            console.log('cleared? yes');
            
        }
    }, [isMyTurn, words])

    console.log(chosen);

    if (!chosen && isMyTurn) {

        return (
            <div className='absolute inset-0 bg-black/70 flex items-center justify-center z-50'>
                <div className='bg-slate-800 rounded-lg p-8 max-w-2xl w-full'>
                    <h2 className='text-2xl font-bold text-white text-center mb-6'>
                        Choose a word to draw
                    </h2>
                    <div className='grid grid-cols-3 gap-4'>
                        {words.map((word, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setWord(word, timer)
                                }}
                                className='bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors'
                            >
                                {word}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!chosen) {
        return (
            <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg'>
                <p className='text-center'>
                    (<span className='font-bold text-violet-400'>{currPlayer.username} is choosing a word...</span>)
                </p>
            </div>
        )
    }
    if (isMyTurn) return null

    return  (
            <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg'>
                <p className='text-center'>
                    <span className='font-bold text-violet-400'>{currPlayer.username} is drawing.</span>
                </p>
            </div>
        )

}

export default ChoseChosing