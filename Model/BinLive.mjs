import { Schema, model } from 'mongoose'

const binLiveSchema = new Schema({
    binID: String,
    bin: [{}],
})


export const BinLive = model('BinLive', binLiveSchema)