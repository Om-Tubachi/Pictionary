import React, { useState } from 'react'
import { socket } from '../../socket'
import { useRoom } from '../../Context/roomContext'
function GameForm() {
  const [username, setUsername] = useState('Daniel')
  const [userRoomId, setUserRoomId] = useState("")

  const { handlePlayerJoin, customRoom } = useRoom()

  const handleSubmit = (e) => {
    e.preventDefault()
    handlePlayerJoin(userRoomId, {id:socket.id, username,points:0})
  }
  return (
    <>

      <div className='bg-slate-800 rounded-lg p-8 max-w-md w-full space-y-4'>
        <h1 className='text-2xl font-bold text-center mb-6'>Join or Create Room</h1>

        <input
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          placeholder='Username'
          value={username}
          className='w-full bg-slate-700 px-4 py-2 rounded'
        />

        <button
          onClick={() => {

            customRoom({
              id: socket.id,
              username
            })
          }}
          className='w-full bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded font-semibold'
        >
          Create New Room
        </button>

        <div className='flex items-center gap-2'>
          <div className='h-px bg-slate-600 flex-1'></div>
          <span className='text-slate-400 text-sm'>OR</span>
          <div className='h-px bg-slate-600 flex-1'></div>
        </div>

        <form onSubmit={(e) => handleSubmit(e)} className='space-y-3'>
          <input
            onChange={(e) => setUserRoomId(e.target.value)}
            type="text"
            value={userRoomId}
            placeholder='Enter room ID'
            className='w-full bg-slate-700 px-4 py-2 rounded'
          />
          <button
            type='submit'
            className='w-full bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-semibold'
          >
            Join Room
          </button>
        </form>
        <button
            className='w-full bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-semibold'
            onClick={() => handlePlayerJoin(null, {id:socket.id, username,points:0})}
            >
            Random
          </button>
      </div>
    </>
  )
}

export default GameForm


