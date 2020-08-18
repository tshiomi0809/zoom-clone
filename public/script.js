const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
})

let myVideoStream
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        //console.log('User connected: ' + userId)
        connectToNewUser(userId, stream)
    })
})

socket.on('user-disconnected', userId => {
    //console.log(userId)
    if (peers[userId]) peers[userId].close()
})

socket.on('createMessage', message => {
    //console.log('this is coming from server', message)
    $('ul').append(`<li class="message"><b>user</b><br/>${message}</li>`)
    scrollToBottom()
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)    
})

function connectToNewUser(userId, stream){
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', useVideos => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })
    console.log('add new user')

    peers[userId] = call
}

function addVideoStream(video, stream){
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

const scrollToBottom = () => {
    const d = $('.main__chat__window')
    d.scrollTop(d.prop('scrollHeight'))
}

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false
        setUnmuteButton()
    } else {
        setMuteButton()
        myVideoStream.getAudioTracks()[0].enabled = true
    }
}

const setMuteButton = () => {
    const html = `
        <i class="fas fa-microphone"></i>
        <span>Mute</span>
    `
    document.querySelector('.main__mute__button').innerHTML = html
}

const setUnmuteButton = () => {
    const html = `
        <i class="unmute fas fa-microphone-slash"></i>
        <span class="unmute">Unmute</span>
    `
    document.querySelector('.main__mute__button').innerHTML = html
}

const playStop = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true
    }
}

const setStopVideo= () => {
    const html = `
        <i class="fas fa-video"></i>
        <span>Stop Video</span>
    `
    document.querySelector('.main__video__button').innerHTML = html
}

const setPlayVideo = () => {
    const html = `
        <i class="play fas fa-video-slash"></i>
        <span class="play">Play Video</span>
    `
    document.querySelector('.main__video__button').innerHTML = html
}

const text = $('input')

$('html').keydown((e) => {
    console.log(text.val())
    if (e.which == 13 && text.val().length !== 0) {
        socket.emit('message', text.val())
        text.val('')
    }
})