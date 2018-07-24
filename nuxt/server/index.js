
const express = require('express')
const { Nuxt, Builder } = require('nuxt')
const app = express()
const host = process.env.HOST || '0.0.0.0' // ホストOSからDockerコンテナにアクセス
const port = process.env.PORT || 3000

app.set('port', port)

// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  // app.listen(port, host)
  let server = app.listen(port, host)
  console.log('Server listening on http://' + host + ':' + port) // eslint-disable-line no-console

   // WebSocketを起動する
   socketStart(server)
   console.log('Scoket.IO start')
}

let messageQue = []

function socketStart(server) {
  // Websocketサーバーインスタンスを生成する
  const io = require('socket.io').listen(server)

  // クライアントからサーバーに接続があった場合のイベントを作成する
  io.on('connection', socket => {
     // 接続されたクライアントのidをコンソールに表示する
     console.log('id: ' + socket.id + ' is connected')

      // サーバー側で保持しているメッセージをクライアント側に送信する
      if (messageQue.length > 0) {  
        messageQue.forEach(message => {
          socket.emit('new-message', message)
        })
      }

      // クライアントから送信があった場合のイベントを作成する
      socket.on('send-message', message => {
        console.log(message)

        // サーバーで保持している変数にメッセージを格納する
        messageQue.push(message)

        // 送信を行ったクライアント以外のクライアントに対してメッセージを送信する
        socket.broadcast.emit('new-message', message)

        // サーバー側で保持しているメッセージが10を超えたら古いものから削除する
        if (messageQue.length > 10) {
          messageQueue = messageQueue.slice(-10)
        } 
      })
  })
}

start()
