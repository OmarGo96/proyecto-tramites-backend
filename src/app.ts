import server from './config/server';
const PORT = process.env.LISTEN_PORT

server.listen(PORT, () => console.log(`API is running. Port: ${PORT}`))
