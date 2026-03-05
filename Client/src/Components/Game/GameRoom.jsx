/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { useRoom } from '../../Context/roomContext'
import { socket } from '../../socket'
import Settings from '../Settings/Settings.jsx'
import ChoseChosing from '../ChoseChosing'
import Chat from '../Chat'
import Canvas from '../Canvas'
import LeaderBoard from './LeaderBoard.jsx'
import { RoomState } from '../../Constants/Constants.js'


function GameRoom() {
  const { room, roomId, start } = useRoom()
  const roomState = room?.gameState?.roomState
  console.log('The room state is found ot be:', roomState);

  // console.log(room.players)
  return (
    <div className='w-full h-screen flex gap-4 p-4'>
      {/* Players sidebar */}
      <div id="players" className='w-1/4 bg-slate-800 rounded-lg p-4 overflow-y-auto'>
        <h2 className='text-xl font-bold text-white mb-4'>Players ({room.players.length})</h2>
        {room.players.length > 0 ? (
          room.players.map((player) => (
            <div key={player.id} className='bg-slate-700 px-4 py-3 rounded-lg mb-2 flex justify-between items-center'>
              <span className='font-semibold text-white'>{player.username} - {player.points}</span>
              {player.id === room.creator && (
                <span className='text-xs text-violet-400'>Host</span>
              )}
            </div>
          ))
        ) : (
          <span className='text-slate-400 text-sm'>No players</span>
        )}
      </div>

      {/* Drawing board */}
      <div id="drawing-board" className='flex-1 bg-white rounded-lg'>
        {roomState === RoomState.LOBBY && < Settings />}
        {roomState === 'lobby' && (<div>
          <button
            className='px-3 py-2 mx-2 my-1 bg-green-300 hover:cursor-pointer'
            disabled={socket.id !== room.creator}
            onClick={() => start()}>Start</button>
        </div>)}
        {roomState === RoomState.GAME_END && <LeaderBoard />}

        {roomState === RoomState.IN_PROGRESS && <><Canvas /> <ChoseChosing /></>}
        {/* Canvas goes here */}
      </div>

      {/* Chat */}
      <div id="chat" className='w-1/4 bg-slate-800 rounded-lg p-4 flex flex-col'>
        <Chat />
      </div>
    </div>

  )
}

export default GameRoom