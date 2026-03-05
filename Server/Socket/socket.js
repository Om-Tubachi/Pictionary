import { Server, Socket } from "socket.io"
import { ClientEvent, ServerEvent } from "../Constants.js"
import {
    getRoomFromSocket,
    setRedisRoom
} from "../Utils/redis.js"
import { socketHandler } from "../Utils/socketHandler.js";
import {
    handlePlayerJoin,
    handleNewPlayer,
    handleDisconnect,
    handleSettingsChange,
    startGame,
    setWord,
    handleTexts,
    handleClear,
    handleDraw,
    handleRedo,
    handleUndo

} from '../Game/roomController.js'


export const setupSocket = socketHandler(
    async (io) => {
        io.on('connect', async (socket) => {
            console.log('User connected, ', socket.id)

            socket.on(ClientEvent.DISCONNECT, async () => {
                await handleDisconnect(socket, io)

            })

            socket.on(ClientEvent.JOIN_GAME, async ({ roomId, player }) => {
                console.log(player)
                roomId = await handleNewPlayer(roomId, player, socket)
                await handlePlayerJoin(roomId, player, socket, io)
                // ack(true)
            })

            socket.on(ClientEvent.SETTINGS_UPDATE, async ({ roomId, newSettings }) => {
                await handleSettingsChange(roomId, newSettings, io);
            })

            socket.on(ClientEvent.START_GAME, async ({ roomId }) => {
                return await startGame(roomId, socket, io)
            })

            socket.on(ServerEvent.CHOSE_WORD, async ({ chosenWord, roomId }) => {
                await setWord(chosenWord, roomId, socket, io)
            })

            socket.on(ClientEvent.SEND_MESSAGE, async ({ data, roomId }) => {
                return await handleTexts(roomId, socket, io, data)
            })

            socket.on(ClientEvent.DRAW, async ({ drawingData, roomId, currPlayer }) => await handleDraw(drawingData, currPlayer, roomId, socket, io))

            socket.on(ClientEvent.UNDO, async ({drawingData, roomId}) => {

                console.log(roomId);

                return await handleUndo(roomId, drawingData, socket, io)
            })

            socket.on(ClientEvent.REDO, async ({ drawingData, roomId }) => {
                return await handleRedo(roomId, drawingData, socket, io)
            })

            socket.on(ClientEvent.CLEAR, async ({ roomId }) => {
                return await handleClear(roomId, socket, io)
            })
        })
    }
)
