/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { useRoom } from '../../Context/roomContext'
import { socket } from '../../socket'
import SettingsForm from '../Settings/SettingsForm.jsx'

function Settings() {
    const { room } = useRoom()
    const roomState = room?.gameState?.roomState
    const [showSettings, setShowSettings] = useState(false)

    return (
        <>
            {/* In lobby - show settings directly */}
            {roomState === 'lobby' && (
                <div className='h-[80%] p-6 overflow-y-auto'>
                    <SettingsForm />
                </div>
            )}

            {/* Not in lobby - show icon */}
            {roomState !== 'lobby' && (
                <button
                    onClick={() => setShowSettings(true)}
                    className='absolute top-4 right-4 bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 z-10'
                >
                    ⚙️ Settings
                </button>
            )}

            {/* Modal - when not in lobby AND showSettings is true -> results on button click for settings icon */}
            {roomState !== 'lobby' && showSettings && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-slate-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold text-white'>Settings</h2>
                            <button 
                                onClick={() => setShowSettings(false)}
                                className='text-white hover:text-gray-400 text-2xl'
                            >
                                ✕
                            </button>
                        </div>
                        <SettingsForm />
                    </div>
                </div>
            )}
        </>
    )
}

export default Settings