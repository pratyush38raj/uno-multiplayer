import React, { useEffect, useState } from 'react'
import UNO_CARDS from '../resources/unoCards'
import shuffleArray from '../resources/shuffle'
import io from 'socket.io-client'
import queryString from 'query-string'



let socket
const ENDPOINT = 'http://localhost:5000'


const Game = (props) => {
    const data = queryString.parse(props.location.search)

    const [room, setRoom] = useState(data.roomCode)
    const [roomFull, setRoomFull] = useState(false)
    const [users, setUsers] = useState([])
    const [currentUser, setCurrentUser] = useState('')
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])

    useEffect(() => {
        const connectionOptions =  {
            "forceNew" : true,
            "reconnectionAttempts": "Infinity", 
            "timeout" : 10000,                  
            "transports" : ["websocket"]
        }
        socket = io.connect(ENDPOINT, connectionOptions)

        socket.emit('join', {room: room}, (error) => {
            if(error)
                setRoomFull(true)
        })

        return function cleanup() {
            socket.emit('disconnect')
            socket.off()
        }
    }, [])


    const [gameOver, setGameOver] = useState(true)
    const [winner, setWinner] = useState('')
    const [turn, setTurn] = useState('')
    const [player1Deck, setPlayer1Deck] = useState([])
    const [player2Deck, setPlayer2Deck] = useState([])
    const [currentColor, setCurrentColor] = useState('')
    const [currentNumber, setCurrentNumber] = useState('')
    const [playedCardsPile, setPlayedCardsPile] = useState([])
    const [drawCardPile, setDrawCardPile] = useState([])

    const [isChatBoxHidden, setChatBoxHidden] = useState(true)
    const [isUnoButtonPressed, setUnoButtonPressed] = useState(false)

    useEffect(() => {
        const shuffledCards = shuffleArray(UNO_CARDS)

        const player1Deck = shuffledCards.splice(0, 7)

        const player2Deck = shuffledCards.splice(0, 7)

        let startingCardIndex
        while(true) {
            startingCardIndex = Math.floor(Math.random() * 94)
            if(shuffledCards[startingCardIndex]==='skipR' || shuffledCards[startingCardIndex]==='_R' || shuffledCards[startingCardIndex]==='D2R' ||
            shuffledCards[startingCardIndex]==='skipG' || shuffledCards[startingCardIndex]==='_G' || shuffledCards[startingCardIndex]==='D2G' ||
            shuffledCards[startingCardIndex]==='skipB' || shuffledCards[startingCardIndex]==='_B' || shuffledCards[startingCardIndex]==='D2B' ||
            shuffledCards[startingCardIndex]==='skipY' || shuffledCards[startingCardIndex]==='_Y' || shuffledCards[startingCardIndex]==='D2Y' ||
            shuffledCards[startingCardIndex]==='W' || shuffledCards[startingCardIndex]==='D4W') {
                continue;
            }
            else
                break;
        }

        const playedCardsPile = shuffledCards.splice(startingCardIndex, 1)

        const drawCardPile = shuffledCards

        socket.emit('initGameState', {
            gameOver: false,
            turn: 'Player 1',
            player1Deck: [...player1Deck],
            player2Deck: [...player2Deck],
            currentColor: playedCardsPile[0].charAt(1),
            currentNumber: playedCardsPile[0].charAt(0),
            playedCardsPile: [...playedCardsPile],
            drawCardPile: [...drawCardPile]
        })
    }, [])

    useEffect(() => {
        socket.on('initGameState', ({ gameOver, turn, player1Deck, player2Deck, currentColor, currentNumber, playedCardsPile, drawCardPile }) => {
            setGameOver(gameOver)
            setTurn(turn)
            setPlayer1Deck(player1Deck)
            setPlayer2Deck(player2Deck)
            setCurrentColor(currentColor)
            setCurrentNumber(currentNumber)
            setPlayedCardsPile(playedCardsPile)
            setDrawCardPile(drawCardPile)
        })

        socket.on('updateGameState', ({ gameOver, winner, turn, player1Deck, player2Deck, currentColor, currentNumber, playedCardsPile, drawCardPile }) => {
            gameOver && setGameOver(gameOver)
            winner && setWinner(winner)
            turn && setTurn(turn)
            player1Deck && setPlayer1Deck(player1Deck)
            player2Deck && setPlayer2Deck(player2Deck)
            currentColor && setCurrentColor(currentColor)
            currentNumber && setCurrentNumber(currentNumber)
            playedCardsPile && setPlayedCardsPile(playedCardsPile)
            drawCardPile && setDrawCardPile(drawCardPile)
            setUnoButtonPressed(false)
        })

        socket.on("roomData", ({ users }) => {
            setUsers(users)
        })

        socket.on('currentUserData', ({ name }) => {
            setCurrentUser(name)
        })

        socket.on('message', message => {
            setMessages(messages => [ ...messages, message ])

            const chatBody = document.querySelector('.chat-body')
            chatBody.scrollTop = chatBody.scrollHeight
        })
    }, [])

    const checkGameOver = (arr) => {
        return arr.length === 1
    }
    
    const checkWinner = (arr, player) => {
        return arr.length === 1 ? player : ''
    }

    const toggleChatBox = () => {
        const chatBody = document.querySelector('.chat-body')
        if(isChatBoxHidden) {
            chatBody.style.display = 'block'
            setChatBoxHidden(false)
        }
        else {
            chatBody.style.display = 'none'
            setChatBoxHidden(true)
        }
    }

    const sendMessage= (event) => {
        event.preventDefault()
        if(message) {
            socket.emit('sendMessage', { message: message }, () => {
                setMessage('')
            })
        }
    }

    const onCardPlayedHandler = (played_card) => {
        const cardPlayedBy = turn
        switch(played_card) {
            case '0R': case '1R': case '2R': case '3R': case '4R': case '5R': case '6R': case '7R': case '8R': case '9R': case '_R': case '0G': case '1G': case '2G': case '3G': case '4G': case '5G': case '6G': case '7G': case '8G': case '9G': case '_G': case '0B': case '1B': case '2B': case '3B': case '4B': case '5B': case '6B': case '7B': case '8B': case '9B': case '_B': case '0Y': case '1Y': case '2Y': case '3Y': case '4Y': case '5Y': case '6Y': case '7Y': case '8Y': case '9Y': case '_Y': {
                const numberOfPlayedCard = played_card.charAt(0)
                const colorOfPlayedCard = played_card.charAt(1)
                if(currentColor === colorOfPlayedCard) {
                    console.log('colors matched!')
                    if(cardPlayedBy === 'Player 1') {
                        const removeIndex = player1Deck.indexOf(played_card)
                        if(player1Deck.length===2 && !isUnoButtonPressed) {
                            alert('Oops! You forgot to press UNO. You drew 2 cards as penalty.')
                            const copiedDrawCardPileArray = [...drawCardPile]
                            const drawCard1 = copiedDrawCardPileArray.pop()
                            const drawCard2 = copiedDrawCardPileArray.pop()
                            const updatedPlayer1Deck = [...player1Deck.slice(0, removeIndex), ...player1Deck.slice(removeIndex + 1)]
                            updatedPlayer1Deck.push(drawCard1)
                            updatedPlayer1Deck.push(drawCard2)
        
                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player1Deck),
                                winner: checkWinner(player1Deck, 'Player 1'),
                                turn: 'Player 2',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player1Deck: [...updatedPlayer1Deck],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard,
                                drawCardPile: [...copiedDrawCardPileArray]
                            })
                        }
                        else {
                        
                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player1Deck),
                                winner: checkWinner(player1Deck, 'Player 1'),
                                turn: 'Player 2',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player1Deck: [...player1Deck.slice(0, removeIndex), ...player1Deck.slice(removeIndex + 1)],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard
                            })
                        }
                    }
                    else {
                        const removeIndex = player2Deck.indexOf(played_card)
                        if(player2Deck.length===2 && !isUnoButtonPressed) {
                            alert('Oops! You forgot to press UNO. You drew 2 cards as penalty.')

                            const copiedDrawCardPileArray = [...drawCardPile]
                            const drawCard1 = copiedDrawCardPileArray.pop()
                            const drawCard2 = copiedDrawCardPileArray.pop()
                            const updatedPlayer2Deck = [...player2Deck.slice(0, removeIndex), ...player2Deck.slice(removeIndex + 1)]
                            updatedPlayer2Deck.push(drawCard1)
                            updatedPlayer2Deck.push(drawCard2)

                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player2Deck),
                                winner: checkWinner(player2Deck, 'Player 2'),
                                turn: 'Player 1',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player2Deck: [...updatedPlayer2Deck],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard,
                                drawCardPile: [...copiedDrawCardPileArray]
                            })
                        }
                        else {
                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player2Deck),
                                winner: checkWinner(player2Deck, 'Player 2'),
                                turn: 'Player 1',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player2Deck: [...player2Deck.slice(0, removeIndex), ...player2Deck.slice(removeIndex + 1)],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard
                            })
                        }
                    }
                }
                else if(currentNumber === numberOfPlayedCard) {
                    console.log('numbers matched!')
                    if(cardPlayedBy === 'Player 1') {
                        const removeIndex = player1Deck.indexOf(played_card)
                        if(player1Deck.length===2 && !isUnoButtonPressed) {
                            alert('Oops! You forgot to press UNO. You drew 2 cards as penalty.')
                            
                            const copiedDrawCardPileArray = [...drawCardPile]
                            const drawCard1 = copiedDrawCardPileArray.pop()
                            const drawCard2 = copiedDrawCardPileArray.pop()
                            const updatedPlayer1Deck = [...player1Deck.slice(0, removeIndex), ...player1Deck.slice(removeIndex + 1)]
                            updatedPlayer1Deck.push(drawCard1)
                            updatedPlayer1Deck.push(drawCard2)
                            
                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player1Deck),
                                winner: checkWinner(player1Deck, 'Player 1'),
                                turn: 'Player 2',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player1Deck: [...updatedPlayer1Deck],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard,
                                drawCardPile: [...copiedDrawCardPileArray]
                            })
                        }
                        else {
                            
                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player1Deck),
                                winner: checkWinner(player1Deck, 'Player 1'),
                                turn: 'Player 2',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player1Deck: [...player1Deck.slice(0, removeIndex), ...player1Deck.slice(removeIndex + 1)],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard
                            })
                        }
                    }
                    else {
                        const removeIndex = player2Deck.indexOf(played_card)
                        if(player2Deck.length===2 && !isUnoButtonPressed) {
                            alert('Oops! You forgot to press UNO. You drew 2 cards as penalty.')
                            
                            const copiedDrawCardPileArray = [...drawCardPile]
                            
                            const drawCard1 = copiedDrawCardPileArray.pop()
                            const drawCard2 = copiedDrawCardPileArray.pop()
                            const updatedPlayer2Deck = [...player2Deck.slice(0, removeIndex), ...player2Deck.slice(removeIndex + 1)]
                            updatedPlayer2Deck.push(drawCard1)
                            updatedPlayer2Deck.push(drawCard2)
            
                           
                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player2Deck),
                                winner: checkWinner(player2Deck, 'Player 2'),
                                turn: 'Player 1',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player2Deck: [...updatedPlayer2Deck],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard,
                                drawCardPile: [...copiedDrawCardPileArray]
                            })
                        }
                        else {
            
                            socket.emit('updateGameState', {
                                gameOver: checkGameOver(player2Deck),
                                winner: checkWinner(player2Deck, 'Player 2'),
                                turn: 'Player 1',
                                playedCardsPile: [...playedCardsPile.slice(0, playedCardsPile.length), played_card, ...playedCardsPile.slice(playedCardsPile.length)],
                                player2Deck: [...player2Deck.slice(0, removeIndex), ...player2Deck.slice(removeIndex + 1)],
                                currentColor: colorOfPlayedCard,
                                currentNumber: numberOfPlayedCard
                            })
                        }
                    }
                }
                else {
                    alert('Invalid Move!')
                }
                break;
            }
            
        }
    }
    
    
}

export default Game