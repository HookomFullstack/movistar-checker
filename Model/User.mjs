import { Schema, model } from 'mongoose'

const userSchema = new Schema({
    username: String,
    instances: String,
    subscription: {
        type: String,
        default: () => new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })
    },
    screen: {
        type: Number,
        default: 0
    },
    limitScreen: Number,
    
})
export const User = model('User', userSchema);
