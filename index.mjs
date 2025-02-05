import {createServer} from 'http'

import morgan from 'morgan';
import express  from 'express'
import cors  from 'cors'
import { Server } from 'socket.io'
import 'dotenv/config'

// import { checker } from './scrap.mjs';
import { User } from './Model/User.mjs';
import { connectdb } from './db/connect.mjs';
import { createInstances } from './helpers/createInstances.mjs';
import { validarFechas } from './helpers/validateSubcription.mjs';
import moment from 'moment';
import { checker } from './checker.mjs';

// routes
const app = express()

app.use(cors({origin: '*'}))
app.use(express.json({limit: '1000mb'}))
app.use(morgan('common'))

const PORT = 3000

const httpServer = createServer(app)

export const io = new Server( httpServer, { cors: '*', maxHttpBufferSize: 1e10 } )

await connectdb()

app.post('/user/createUser', async(req, res) => {

    const { token,  instances, subscription ,screen ,limitScreen, createKey } = req.body

    const user = await User.findOne({username: token})

    if (user) return res.status(404).json({msg: 'Este token ya existe'})
    if (token == undefined|| subscription == undefined || instances == undefined || limitScreen == undefined) return res.status(400).json({msg: 'Por favor envie toda la informacion completa'})
    if (createKey != process.env.CREATE_KEY) return res.status(404).json({msg: 'No tienes suficientes permisos para crear usuarios'})
    const formatMoment = new Date(Date.now() + ( 3600 * 1000 ))

    const subs = moment(formatMoment, 'YYYY-MM-DD hh:mm:ss').add({day: subscription}).toISOString()
    console.log(subs);
    await User.create({
        username: token,
        instances,
        subscription: subs,
        screen,
        limitScreen
    })
    return res.status(200).json({msg: `Token ${token} con ${limitScreen} pantallas simultanea con ${instances} instancias durante ${subscription} dias`})

})

app.post('/user/getSubcription', async(req, res) => {
    try {
        const { token } = req.body
        const user = await User.findOne({username: token})

        if (user == null) return res.status(404).json({msg: 'Este token es invalido'})
        
        const { instances, subscription } = user

        if (instances == 0) return res.status(404).json({msg: 'No tienes instancias disponibles, por favor contacta al administrador'})
        const dateValidate = subscription
        const planActive = validarFechas(dateValidate)
        if (planActive == false) return res.status(400).json({msg: `Ya ha caducado tu subcripcion de ${dateValidate.split('T')[0].replaceAll('-', ' ')} con hora ${dateValidate.split('T')[1]}, por favor contacta al administrador`})
        
        return res.status(200).json({msg: `Tienes ${instances} pantallas simultaneas hasta el dia ${dateValidate.split('T')[0].replaceAll('-', ' ')} con hora ${dateValidate.split('T')[1]}`})
    } catch (error) {
        console.log(error)
        return res.status(500).json({msg: 'error en el servidor'})
    }
})

app.post('/user/updateSubcription', async(req, res) => {
    try {
        const { token, subscriptionDaysMore } = req.body
        const user = await User.findOne({username: token})

        if (user == null) return res.status(404).json({msg: 'Este token es invalido'})
        
        const { subscription, instances, username } = user

        const dateValidate = subscription
        const planActive = validarFechas(dateValidate)

        const subcriptionMore = moment(new Date(Date.now() + ( 3600 * 1000 )), 'YYYY-MM-DD hh:mm:ss').add({day: subscriptionDaysMore}).toISOString()
        await User.findOneAndUpdate({
            username,
        }, 
        { $set: {subscription: subcriptionMore} },
        { new: true }  
        ).select( {userRef: 0, __v: 0} )
        return res.status(200).json({msg: `Tienes ${instances} pantallas simultaneas hasta el dia ${subcriptionMore.split('T')[0].replaceAll('-', ' ')} con hora ${subcriptionMore.split('T')[1]}`})
    } catch (error) {
        console.log(error)
        return res.status(500).json({msg: 'error en el servidor'})
    }
})

app.get('*', async(req ,res) => {
    return res.json({ok: true})
})

io.on('connection', async(socket) => {    
    try {
        const token = socket.handshake?.query['X-TOKEN-KEY']

        const user = await User.findOne({username: token.trim()})

        if(user == null) {
            socket.emit('[claro] exectMsg', {msg: '¡Vaya! Parece tienes un usuario invalido, por favor contacta con el administrador.', error: true} )
            return socket.disconnect(true)
        }

        const {username, screen, limitScreen, instances, subscription} = user

        if(screen >= limitScreen) {
            socket.emit('[claro] exectMsg', {msg: 'Has superado el limite de pantallas, si deseas agregar más por favor contacta con el administrador', error: true} )
            return socket.disconnect(true)
        }
        const dateValidate = subscription
        const planActive = validarFechas(dateValidate)
        if (planActive == false) return socket.emit('[claro] exectMsg', {msg: 'Tu subscripcion ha expirado'})

        await socket.join(username)

        socket.on('[claro] initCheckerAuth', async({phones}) => {
            await checker({phones, instances, socket: io, username, sockOff: socket})
        })
        socket.on('disconnect', () => socket.removeAllListeners())

    } catch (error) {
        console.log(error);
    }
})
// seed(1000)
// export const handler = serverless(httpServer)
httpServer.listen(PORT ?? 0, () => console.log(`conectado al servidor ${PORT}`) )