import client from "../Utils/redis.js";
import { socketHandler } from "../Utils/socketHandler.js";
import {
    ClientEvent,
    RoomState,
    ServerEvent,
    END_REASON,
    MAX_POINTS
} from "../Constants.js";
import {
    createNewRoom,
    generateRoomId,
    getPublicRoom,
    getRedisRoom,
    setRedisRoom,
    getRoomFromSocket,
    deleteRedisRoom
} from '../Utils/redis.js'
import { getWords } from "../Words/word.js";

const MAX_PTS = 200
const timers = new Map()

export const handlePlayerJoin = socketHandler(
    async (roomId, player, socket, io) => {

        try {
            const id = player.id
            let room = await getRedisRoom(roomId)
            let players = room.players
            if (players.length === room.settings.players) {
                socket.emit(ServerEvent.RESPONSE, {
                    message: 'Room limit reached.'
                })
                console.log('Max limit of room reached')
                return
            }
            players.push(player)
            room.players = players
            await setRedisRoom(roomId, room, socket)
            const updated = await getRedisRoom(roomId)

            console.log('Emitting event:', ServerEvent.JOINED)
            socket.join(roomId)
            io.to(roomId).emit(ServerEvent.JOINED, {
                room: updated,
                data: {
                    message: 'joined room',
                    player
                }
            })
            return
        } catch (error) {
            socket.emit(ServerEvent.ERROR, {
                message: 'Error in joining game.'
            })
        }

    }
)

export const handleNewPlayer = socketHandler(
    async (roomId, player, socket) => {
        // if (!player)
        //     throw new CustomResponse(409, {}, "Player info is missing")
        const playerId = player.id

        if (roomId === null && playerId) {
            roomId = await getPublicRoom()
            if (roomId === null) {
                roomId = generateRoomId()
                await createNewRoom(roomId, false, null)
                return roomId
            }

            return roomId
        }

        let room = await getRedisRoom(roomId)
        if (!room) {
            // admin is making this room
            await createNewRoom(roomId, true, socket.id)
            return roomId
        }
        return roomId
    }
)

export const handleDisconnect = socketHandler(
    async (socket, io) => {
        // MANY DIFFERENT CASES WILL COME HERE, WHERE THE PNE WHO DISCONNECTED COUD:
        // HOST, CURRENT PLAYER, PARTICIPANT

        let room = await getRoomFromSocket(socket.id)
        if (room === null) {
            socket.emit(ServerEvent.ERROR, {
                message: 'No such room found, invalid room id'
            })
            console.log('Player was not dfound in any rooms');

            return
        }
        const playerLeft = room?.players?.find(({ id }) => id === socket.id)
        const currPlayer = room?.players[room?.gameState?.currentPlayer]
        room.players = room?.players.filter(({ id }) => id !== socket.id)


        // current player left:
        if (!currPlayer) {
            console.log('Did not find the current player who disconnected');
            return
        }

        if (playerLeft?.id === currPlayer?.id) {
            io.to(room.roomId).emit(ServerEvent.LEFT, {
                message: `${currPlayer?.username} was drawing, he suddenly left the room`,
                playerLeft,
            })
        }

        // Host left:
        if (playerLeft?.id === room.creator && room.players.length > 0) {
            room.creator = room.players[0].id

            io.to(room.roomId).emit(ServerEvent.NEW_HOST, {
                message: `New host is: ${room.players[0].username}`,
                newCreatorId: room.players[0].id
            })
        }

        // normal person left:
        if (playerLeft?.id !== currPlayer?.id && playerLeft?.id !== room?.creator) {
            io.to(room.roomId).emit(ServerEvent.LEFT, {
                message: `${currPlayer?.username} was guessing, he left the room`,
                playerLeft,
            })
        }

        await setRedisRoom(room?.roomId, room)

        const res = await validateGame(room?.roomId)
        if (!res) {
            room.gameState.roomState = RoomState.LOBBY
            clearTimers(room?.roomId)
            await setRedisRoom(room?.roomId, room)
            return await endGame(room?.roomId, END_REASON.NOT_ENOUGH_PARTICIPANTS, socket, io)
        }

        if (playerLeft?.id === currPlayer?.id) {
            await setRedisRoom(room?.roomId, room)
            await nextTurn(room?.roomId, socket, io)
        }

    }
)

export const handleSettingsChange = socketHandler(
    async (roomId, newSettings, io) => {
        let room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: 'Failed to fetch room for diven room id, settings not updated'
            })
            return
        }

        room = {
            ...room,
            settings: newSettings
        }

        await setRedisRoom(roomId, room)

        io.to(roomId).emit(ClientEvent.SETTINGS_UPDATE, {
            room
        })
    }
)

export const startGame = socketHandler(
    async (roomId, socket, io) => {
        console.log(roomId + " in fn");

        // client requests start game w roomId
        // validate game 
        // validate who req to start
        // change roomstate to in progress
        // call next turn -> will set up and initiate game

        const isValid = await validateGame(roomId)
        if (!isValid) {
            socket.emit(ServerEvent.RESPONSE, {
                message: 'Failed to start game, either number of players is less or...'
            })
            return
        }

        let room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: 'Room not found'
            })
            return
        }
        if (room?.creator !== socket.id) {
            socket.emit(ServerEvent.RESPONSE, {
                message: 'You are not the host hence not authorised to start the game'
            })
            return
        }

        room.gameState.roomState = RoomState.IN_PROGRESS
        await setRedisRoom(roomId, room)

        io.to(roomId).emit(ServerEvent.GAME_STARTED, { room })

        await nextTurn(roomId, socket, io)
    }
)

export const nextTurn = async (roomId, socket, io) => {
    await clearTimers(roomId)

    const t = new Date()
    console.log('timer has been set at in next Turn' + t.toLocaleTimeString());

    const room = await getRedisRoom(roomId)
    const words = await getWords(room?.settings)
    const currId = room?.players[room?.gameState?.currentPlayer]?.id
    const currPlayer = room?.players?.find(({ id }) => id === currId)

    room.gameState.guessedWords = []
    room.gameState.word = ''
    room.gameState.drawingData = []
    if (!currPlayer) {
        console.log('failed to assign a turn');
        return
    }

    io.to(currId).emit(
        ServerEvent.CHOSE_WORD,
        {
            words,
            message: 'Chose word',
            room,
            currPlayer
        }
    )

    io.to(roomId).except(currId).emit(
        ServerEvent.CHOSING_WORD,
        {
            currPlayer,
            message: `${currPlayer} is chosing a word`,
            room,
        }
    )
    room.gameState.currentPlayer += 1

    // Check if round/game is over
    if (room.gameState.currentPlayer >= room.players.length) {
        room.gameState.currentPlayer = 0
        room.gameState.currentRound += 1
    }

    if (room.gameState.currentRound === room.settings.rounds) {
        io.to(roomId).emit(ServerEvent.GAME_END, { message: 'Game ended' })
        room.gameState.roomState = RoomState.GAME_END
        await setRedisRoom(roomId, room)
        return await endGame(roomId, END_REASON.VALID_END, socket, io)
    }

    console.log('curr is');
    console.log(currPlayer);

    // to current player: emit words, to others emit: curr is chosing a word


    await setRedisRoom(roomId, room)
    return await setTimers(roomId, currPlayer, socket, io)
}

export const handleDraw = socketHandler(
    async (drawingData, currPlayer, roomId, socket, io) => {
        // we will be getting final data from client, 
        // save it to room
        // emit back to room except the curr player
        if (!drawingData) return

        const room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis, in draw`
            })
            return
        }

        room.gameState.drawingData = drawingData
        await setRedisRoom(roomId, room)

        io.to(roomId).except(currPlayer?.id).emit(ServerEvent.DRAW, {
            drawingData
        })

    }
)

export const handleUndo = socketHandler(
    async (roomId, drawingData, socket, io) => {
        if (!drawingData) return
        const room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis, undo`
            })
            return
        }

        room.gameState.drawingData = drawingData
        await setRedisRoom(roomId, room)
        io.to(roomId).emit(ServerEvent.UNDO, {
            drawingData
        })
    }
)

export const handleRedo = socketHandler(
    async (roomId, drawingData, socket, io) => {
        if (!drawingData) return

        const room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis, redo`
            })
            return
        }

        room.gameState.drawingData = drawingData
        await setRedisRoom(roomId, room)
        io.to(roomId).emit(ServerEvent.REDO, {
            drawingData
        })
    }
)

export const handleClear = socketHandler(
    async (roomId, socket, io) => {

        const room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis, redo`
            })
            return
        }

        room.gameState.drawingData = []
        await setRedisRoom(roomId, room)
        io.to(roomId).emit(ServerEvent.CLEAR, {
            message: 'cleared the canvas'
        })
    }
)

export const handleTexts = socketHandler(
    async (roomId, socket, io, data) => {
        // client will send messages
        // two dec points: if message is not same as current word ->
        // simply emit back that message as it is in the room using io
        // else it will be: same as current word -> handleGuess
        // in handleGuess: update socket.id's points ion players arr by: calling awardPoints
        // save to redis, emit to room "player.username guessed cirrect"
        // then again emit the updated players arr so that it is constantly changing on frontend

        console.log(data);

        const { message } = data
        if (!message) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to recieve message on server`
            })
            return
        }
        const guess = message.trim()
        const room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis, (in handleTexts)`
            })
            return
        }

        const currWord = room?.gameState?.word
        const player = room?.players?.find(({ id }) => id === socket?.id)
        const currId = room?.players[room?.gameState?.currentPlayer]?.id
        const currPlayer = room?.players?.find(({ id }) => id === currId)

        if (guess.toLowerCase() === currWord.toLowerCase()) {
            return await handleGuess(roomId, socket, io, player, Date.now())
        }
        io.to(roomId).emit(ServerEvent.INCORRECT_GUESS, {
            from: player,
            response: `${player} guessed INCORRECT`,
            message // the actual text
        })

    }
)

export const handleGuess = socketHandler(
    async (roomId, socket, io, player, timeGuessedAt) => {
        // we know the guess is correct, simply award points, update room, emit changes
        await awardPoints(roomId, player, timeGuessedAt, socket, io)

    }
)

// needs thinking
export const awardPoints = socketHandler(
    async (roomId, player, timeGuessedAt, socket, io) => {
        // max pts 200
        // input: timeGuessedAt: , player
        // we have: timeStartedAt
        // store all guesses structured as: { playerId: , timeGuessedAt: , points: }
        // formula: points = lastPoints - ((((timeGuessesAt - timeStartedAt)*5*20)/turnTime ) + (numOfGuesses*5))
        const room = await getRedisRoom(roomId)
        console.log(timeGuessedAt);

        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis`
            })
            return
        }
        const players = room.players

        const guesses = room?.gameState?.guessedWords, lastPoints = guesses.length === 0 ? MAX_POINTS : guesses[guesses.length - 1].points

        const timeTurnStarted = room?.gameState?.timerStartedAt, numOfGuesses = guesses.length
        const constantDeduction = timeTurnStarted / 7, guessDeduction = numOfGuesses * 5;
        let points = lastPoints - ((((timeGuessedAt - timeTurnStarted) / constantDeduction) * 20) + numOfGuesses * 5)
        points = Math.ceil(points)


        const newGuess = {
            playerId: player?.id || "",
            points,
            timeGuessedAt
        }
        guesses.push(newGuess)
        room.gameState.guessedWords = guesses

        for (let pl of players) {
            if (pl?.id === player?.id) {
                pl.points += Math.ceil(points)
                break
            }
        }
        room.players = players

        await setRedisRoom(roomId, room)

        io.to(roomId).emit(
            ServerEvent.CORRECT_GUESS,
            {
                to: player,
                incrementedPoints: points,
                updatedPlayers: players,
                response: `${player} guessed CORRECT`,
            }
        )
        const drawerIndex = (room.gameState.currentPlayer - 1 + room.players.length) % room.players.length
        const currPlayer = room.players[drawerIndex]
        const nonDrawers = room.players.filter(p => p.id !== currPlayer.id)

        const allGuessed = guesses.length === nonDrawers.length

        if (allGuessed) {
            await clearTimers(roomId)
            await pointsToCurrPlayer(roomId, currPlayer, socket, io)
            await nextTurn(roomId, socket, io)
        }



    }
)

export const pointsToCurrPlayer = socketHandler(
    async (roomId, currPlayer, socket, io) => {
        const room = await getRedisRoom(roomId)

        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis`
            })
            return
        }

        const guesses = room?.gameState?.guessedWords, numOfPlayersGuessed = guesses.length, timeTurnStarted = room?.gameState?.timerStartedAt
        const players = room?.players
        let totalDelta = 0

        for (let i = 0; i < numOfPlayersGuessed; i++) {
            const guess = guesses[i]
            if (i == 0) {
                totalDelta += guess.timeGuessedAt - timeTurnStarted
            }
            else {
                totalDelta += guess?.timeGuessedAt - guesses[i - 1].timeGuessedAt
            }
        }

        const points = numOfPlayersGuessed * 10 - ((totalDelta / 1000) / 2);       // 10+ for every correct
        for (let player of players) {
            if (player?.id === currPlayer?.id) {
                player.points += Math.ceil(points)
                break
            }
        }
        room.players = players
        await setRedisRoom(roomId, room)
        io.to(roomId).emit(ServerEvent.POINTS_TO_CURR, {
            to: currPlayer,
            incrementedPoints: Math.ceil(points),
            updatedPlayers: players
        })

        // this points will be awarded at the end of a round, when everyones turn will be over, so send an updated room as well
        const updatedRoom = await getRedisRoom(roomId)
        io.to(roomId).emit(
            ServerEvent.UPDATE,
            {
                room: updatedRoom
            }
        )
    }
)

export const setWord = async (chosenWord, roomId, socket, io) => {
    const room = await getRedisRoom(roomId)
    console.log(`setting word to ${chosenWord} at time ${(new Date()).toLocaleTimeString()}`);

    if (!room) {
        socket.emit(ServerEvent.ERROR, {
            message: `Failed to fetch room for diven room id, ${chosenWord} not set for room id ${roomId}`
        })
        console.log(`Failed to fetch room for diven room id, ${chosenWord} not set for room id ${roomId}`);
        return
    }

    room.gameState.word = chosenWord
    room.gameState.timerStartedAt = Date.now()
    console.log(`word set to ${chosenWord}`);

    await setRedisRoom(roomId, room)
    io.to(roomId).emit(ServerEvent.WORD_CHOSEN)
}

const setTimers = async (roomId, currPlayer, socket, io) => {
    if (timers.has(roomId)) {
        clearTimers(roomId)
        return
    }
    const room = await getRedisRoom(roomId)
    if (!room) {
        console.log('Failed to fetch room in setting timer');
        return
    }
    const time = room.settings?.drawTime

    const timeoutId = setTimeout(async () => {
        await pointsToCurrPlayer(roomId, currPlayer, socket, io)
        await nextTurn(roomId, socket, io)
    }, time * 1000);

    timers.set(roomId, timeoutId)
    const t = new Date()
    console.log('timer has been set at' + t.toLocaleTimeString());


}

const clearTimers = async (roomId) => {
    if (!timers.has(roomId)) return
    const id = timers.get(roomId)
    clearTimeout(id)
    timers.delete(roomId)
}

const validateGame = socketHandler(
    async (roomId) => {
        if (!roomId) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to recieve room Id while validating`
            })
            return
        }
        const room = await getRedisRoom(roomId)
        if (!room) {
            socket.emit(ServerEvent.ERROR, {
                message: `Failed to get room from redis`
            })
            return
        }

        return room.players && room.players?.length > 1
    }
)

const endGame = async (roomId, reason, socket, io) => {
    // reasons: 
    // players < 2 -> take the one in the room back to lobby, do not end game
    // a valid end -> truly end the game
    // server error -> emit to all sockets server error, clean up room, tell them to create a new room and play
    const room = await getRedisRoom(roomId)
    if (!room) {
        socket.emit(ServerEvent.ERROR, {
            message: 'Failed to fetch room for diven room id, settings not updated'
        })
        return
    }

    if (reason === END_REASON.VALID_END) {
        io.to(roomId).emit(
            ServerEvent.GAME_END,
            {
                endReason: END_REASON.VALID_END,
                room
            }
        )
        const scores = await calcFinalScores(room)

        io.to(roomId).emit(
            ServerEvent.SCORES,
            { scores }
        )

        setTimeout(async () => {
            console.log('deleted the room');
            
            return await deleteRedisRoom(roomId)
        }, 30000);
    }
    else if (reason === END_REASON.NOT_ENOUGH_PARTICIPANTS) {
        io.to(roomId).emit(
            ServerEvent.GAME_END,
            {
                endReason: END_REASON.NOT_ENOUGH_PARTICIPANTS,  // not a real end, people can still join and resume
                room
            }
        )

    }
    else if (reason === END_REASON.SERVER_FAILURE) {
        io.to(roomId).emit(
            ServerEvent.GAME_END,
            {
                endReason: END_REASON.SERVER_FAILURE,  // not a real end, people can still join and resume
                room: null
            }
        )
        return await deleteRedisRoom(roomId)
    }
}

const calcFinalScores = async (room) => {
    let players = [...room.players]
    players.sort((p1, p2) => p2.points - p1.points)
    return {
        winners: {
            first: players[0],
            second: players[1],
            third: players.length > 2 ? players[2] : null
        },
        players
    }
}