/* eslint-disable no-unused-vars */
import React from 'react'
import { useRoom } from '../../Context/roomContext'
import { RoomState } from '../../Constants/Constants'

function LeaderBoard() {
    const { scores, room } = useRoom()

    if (!scores || Object.keys(scores).length === 0 || room?.gameState?.roomState !== RoomState.GAME_END) {
        return null
    }

    const { winners, players } = scores

    return (
        <div className='bg-slate-900 p-8 min-h-screen'>
            <h1 className='text-white text-3xl font-bold mb-12 text-center'>Game Over</h1>

            {/* Podium */}
            <div className='flex justify-center items-end gap-4 mb-16 max-w-2xl mx-auto'>
                {winners.second && (
                    <div className='flex flex-col items-center'>
                        <div className='text-white mb-2'>
                            <p className='font-bold'>{winners.second.username}</p>
                            <p className='text-sm text-slate-400'>{winners.second.points}</p>
                        </div>
                        <div className='bg-slate-700 w-24 h-20 flex items-center justify-center rounded-t'>
                            <span className='text-white text-2xl font-bold'>2</span>
                        </div>
                    </div>
                )}

                {winners.first && (
                    <div className='flex flex-col items-center'>
                        <div className='text-white mb-2'>
                            <p className='font-bold'>{winners.first.username}</p>
                            <p className='text-sm text-slate-400'>{winners.first.points}</p>
                        </div>
                        <div className='bg-yellow-600 w-24 h-32 flex items-center justify-center rounded-t'>
                            <span className='text-white text-3xl font-bold'>1</span>
                        </div>
                    </div>
                )}

                {winners.third && (
                    <div className='flex flex-col items-center'>
                        <div className='text-white mb-2'>
                            <p className='font-bold'>{winners.third.username}</p>
                            <p className='text-sm text-slate-400'>{winners.third.points}</p>
                        </div>
                        <div className='bg-orange-700 w-24 h-16 flex items-center justify-center rounded-t'>
                            <span className='text-white text-xl font-bold'>3</span>
                        </div>
                    </div>
                )}
            </div>

            {/* All Players */}
            <div className='max-w-2xl mx-auto'>
                <h2 className='text-white text-xl mb-4'>Final Scores</h2>
                <div className='space-y-2'>
                    {players.map((player, index) => (
                        <div key={player.id} className='bg-slate-800 p-4 rounded flex justify-between'>
                            <div className='flex gap-3'>
                                <span className='text-slate-400'>#{index + 1}</span>
                                <span className='text-white'>{player.username}</span>
                            </div>
                            <span className='text-white font-bold'>{player.points}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LeaderBoard