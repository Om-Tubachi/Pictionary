/**
 * @readonly 
 * @constant ServerEvent
 * @description Server sent events
 */
export const MAX_POINTS = 200

export const ServerEvent = {
    ERROR: 'error',
    RESPONSE: 'response',
    JOINED: 'joined',
    LEFT: 'player-left',
    CHOSE_WORD: 'chose-word',
    CHOSING_WORD: 'chosing-word',
    DRAW: 'draw',
    INCORRECT_GUESS: 'incorrect-guess',
    CORRECT_GUESS: 'cirrect-guess',
    GAME_END: 'game-end',
    GAME_STARTED: 'game-started',
    WORD_CHOSEN: 'word-chosen',
    UNDO: 'undo',
    REDO: 'redo',
    CLEAR: 'clear',
    POINTS_AWARDED: 'points-awarded',
    UPDATE: 'update',
    POINTS_TO_CURR: 'points-to-curr',
    NEW_HOST:'new-host',
    SCORES:'scores'
}


/**
 * @description Client sent events
 * 
 */
export const ClientEvent = {
    JOIN_GAME: "join-game",
    GET_ROOM: 'get-room',
    SETTINGS_UPDATE: 'settings-update',
    START_GAME: 'start-game',
    SEND_MESSAGE: 'message',
    DISCONNECT: 'disconnect',
    DRAW: 'draw',
    UNDO: 'undo',
    REDO: 'redo',
    CLEAR: 'clear'
}

export const END_REASON = {
    VALID_END: 'valid-end',
    SERVER_FAILURE: 'server-failure',
    NOT_ENOUGH_PARTICIPANTS:'not-enough-participants'
}

/**
 * @description DEFAULTS
 * 
 */
export const RoomState = {
    LOBBY: 'lobby',
    IN_PROGRESS: 'in-progress',
    GAME_END: 'game-end'
}

export const DEFAULT_SETTINGS = {
    players: 5,
    drawTime: 60,
    rounds: 2,
    onlyCustomWords: false,
    customWords: [],
    wordCount: 3,
    hints: 0,
    // language: Languages.en,
}


export const DEFAULT_ROOM = {
    roomId: "",
    creator: null,
    players: [],
    gameState: {
        currentRound: 0,
        drawingData: [],
        guessedWords: [],
        word: "",
        currentPlayer: 0,
        roomState: RoomState.LOBBY,
        timerStartedAt: null,
        hintLetters: [],
    },
    isPrivate: false,
    settings: DEFAULT_SETTINGS
}