import { createClient } from 'redis'
import { DEFAULT_ROOM } from '../Constants.js'

const client = createClient({ url: 'redis://localhost:6379' })
const PUBLIC = 'Public:', ROOM = 'Room:'
// generate roomId                      done
// get public room                      done
// get public rooms                     done
// set room                             done
// get room by id                       done
// create an empty default room         done

const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const setRedisRoom = async (roomId, room) => {
    if (!room) {
        console.log('Missing room while setting room')
        return
    }
    console.log('Saving to Redis with roomId:', roomId)
    const isPrivate = room.isPrivate
    const id = isPrivate ? `${ROOM}${roomId}` : `${PUBLIC}${ROOM}${roomId}`
    const res = await client.set(id, JSON.stringify(room))
    
    
    return res
}

const getRedisRoom = async (roomId) => {
    if (!roomId) {
        console.log('Missing room id while getting room')
        return 
    }
    let room = await client.get(`${PUBLIC}${ROOM}${roomId}`)
    if(room === null) room = await client.get(`${ROOM}${roomId}`)
    console.log('While getting room from redis')
    console.log(JSON.parse(room));

    return JSON.parse(room)
}

const createNewRoom = async (roomId, isPrivate, creatorId) => {
    if (!roomId) {
        console.log('Missing room id while creating default room')
        return
    }
    // isPrivate ? `${ROOM}${roomId}` : `${PUBLIC}${ROOM}${roomId}`
    const room = {
        ...DEFAULT_ROOM,
        creator: creatorId,
        roomId,
        isPrivate,
        gameState: {
            ...DEFAULT_ROOM.gameState,
            word: '',
            timerStartedAt: null
        },
        settings: { ...DEFAULT_ROOM.settings }
    }

    await setRedisRoom(roomId, room)
    return room
}

const getPublicRoom = async () => {
    const rooms = await getPublicRooms()
    if (rooms.length === 0) {
        const roomId = generateRoomId()
        await createNewRoom(roomId, false, null)
        return roomId
    }

    return rooms[0]

}

const getPublicRooms = async () => {
    let roomKeys = await client.keys('Public:Room:*')
    const rooms = []
    for (const roomId of roomKeys) {
        const room = await getRedisRoom(roomId.replace(`${PUBLIC}${ROOM}`, ''))
        if (room.players.length < room.settings.players) {
            rooms.push(roomId)
        }
    }
    return rooms
}

const getRoomFromSocket = async (socketId) => {
    const privateKeys = await client.keys(`${ROOM}*`)
    const publicKeys = await client.keys(`${PUBLIC}${ROOM}*`)
    for (let key of privateKeys) {
        const room = await getRedisRoom(key.replace(`${ROOM}`, ''))
        const found = room?.players?.find(({ id }) => id === socketId)
        if (found) return room
    }
    for (let key of publicKeys) {
        const room = await getRedisRoom(key.replace(`${PUBLIC}${ROOM}`, ''))
        const found = room?.players?.find(({ id }) => id === socketId)
        if (found) return room
    }
    return null
}

const deleteRedisRoom = async (roomId) => {
    if (!roomId) {
        console.log('Missing room id while getting room in deleting')
        return 
    }
    await client.del(`${PUBLIC}${ROOM}${roomId}`)
    await client.del(`${ROOM}${roomId}`)
}



export default client

export {
    generateRoomId,
    setRedisRoom,
    getRedisRoom,
    createNewRoom,
    getPublicRoom,
    getRoomFromSocket,
    deleteRedisRoom
}