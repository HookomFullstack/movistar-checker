import axios from 'axios'
import proxyChain from 'proxy-chain'
import 'dotenv/config'
import { createInstances } from './helpers/createInstances.mjs'
import _ from 'lodash'
import {chromium} from 'playwright'
import { BinLive } from './Model/BinLive.mjs'


const runScrapper = async({arrPhones, socket, username, instanceIndex}) => {


    let proxyInfo = null
    let browser = false
    let context = false
    let page = false
    let initForTwo = false
    let manyAttemp = true
    console.log(arrPhones);
    for (const [i, phone] of arrPhones.entries()) {
        try {
            do {
            if (manyAttemp == true) {
                console.log('e');
                if (page != false) {
                    console.log('o');
                    if (await page?.isClosed()) await browser?.close()    
                }
                initForTwo = false
                do {
                    try {
                        const {data} = await axios(`${process.env.PROXY_API}`)
                        proxyInfo = data
                        console.log(data);
                        if(initForTwo) await new Promise( (resolve) => setTimeout( () => resolve(), 3000 ) )
                        initForTwo = true
                    } catch (error) {
                        console.log(error);
                        socket.to(username).emit('[claro] exectMsg', {msg: `Tienes un problema con tu proxy: ${error}`})
                    }
                } while (proxyInfo?.data === null)
                
                const proxy = await proxyChain.anonymizeProxy({url: `http://${proxyInfo}`, port: 3000})
                
                browser = await chromium.launch({
                    headless: false,
                    devtools: true,
                    args: [ 
                        `--proxy-server=${proxy}`,
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu'
                    ]
                });

                context = await browser.newContext()
                page = await context.newPage()
                
                page.setDefaultNavigationTimeout(0)
                page.setDefaultTimeout(0)

                page.on('crash', async(page) => {
                    console.log('entraste crash')
                    await page.close()
                })
                page.on('close', async(page) => {
                    console.log('entraste close')
                    await page.close()
                })

                await page.route('**/**/**/**/**/**', async(route, request) => {
                    const routeType = route.request().resourceType()
                    const requestType = request.resourceType()
                    if(requestType == 'image' || requestType == 'stylesheet' || requestType == 'font' || requestType == 'media' || requestType == 'other')  return await route.abort()
                    if(routeType == 'image' || routeType == 'stylesheet' || routeType == 'font'       || routeType == 'media'   || routeType == 'other') return await route.abort()
                    await route.continue()
                })
                await page.goto('https://movistar.recaudo.epayco.co/', {timeout: 0, waitUntil: 'domcontentloaded'});
                socket.to(username).emit('[claro] exectMsg', {msg: `Instancia ${instanceIndex} ejecutandose....`})
                await page.waitForTimeout(4000)
                manyAttemp = false
            }
        } while (manyAttemp == true)

        const start = new Date();

        const {factura, status} = await page.evaluate(async phone => {
            const generateToken = await fetch('https://secure.payco.co/recaudo/api/recaudo/get/token', {
                method: 'POST', 
                body: JSON.stringify({dominio: "https://movistar.epayco.me"}),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            const tokenJson = await generateToken.json()
            const token = tokenJson?.data?.token
            
            const recaptchat = await window.grecaptcha.execute('6LfArI4UAAAAAOvDvRVUtnowA9MVZ__b2lqAVhSo')
            
            
            const info = await fetch("https://secure.payco.co/recaudo/api/recaudo/proyecto/api/consulta/facturas", {
                headers: {
                "accept": "application/json",
                "accept-language": "es-ES,es;q=0.9",
                "authorization": `Bearer ${token}`,
                "content-type": "application/json",
                "x-api-key": `${recaptchat}`,
                },
                body: JSON.stringify({
                consulta: [
                    {
                    parametro: 'paymentRef',
                    value: `${phone}`
                    },
                    { parametro: 'invoiceType', value: 'movil' },
                    { parametro: 'isRefNumber', value: 'true' },
                    { parametro: 'comerce', value: 'movistar' },
                    { parametro: 'referen', value: '' },
                    { parametro: 'novum', value: '' }
                ],
                tipoConsulta: 'online',
                dominio: 'https://movistar.epayco.me/recaudo/recaudoenlinea'
                }),
                method: "POST"
            });
            
            const data = await info.json()

            if (data.success == true) {
                const factura = data.data.facturas.map(({id, total, extra14, facturaId}) => {
                    return {id, total, extra14, facturaId}
                  })
                return {factura, status: info.status}
            }
            
            return {factura: null, status: info.status}
        }, phone)

        if (status != 200) {
            await browser.close()
            socket.to(username).emit('[claro] exectMsg', {msg: `Claro te ha baneado tu instancia ${i} se reiniciara`})
            throw('error status')
        }
        const end = new Date();
        const time = end.getTime()-start.getTime()+'ms'
        await context.clearCookies()
        if (factura) {
            socket.to(username).emit(`[claro] live`, {phone, factura, msg: `Número ${phone} tiene una factura con deuda de ${price} - ${time}`})
            await BinLive.findOneAndUpdate({ binID: phone.slice(0,5) }, 
            { $push: { bin: {phone, factura} } },
            ).then(async(doc) => {
                if (doc == null) {
                await BinLive.create({binID: phone.slice(0,5), bin: [{phone, factura}]})
                }
                return
            })
            continue
        }
        socket.to(username).emit(`[claro] dead`, {phone, msg: `Número ${phone} no tiene factura - ${time}`})
        } catch (error) {
            console.log(error)
            if (await page?.isClosed() == false) await browser?.close()
            socket.to(username).emit('[claro] exectMsg', {msg: `Ha ocurrido un error con la instancia ${instanceIndex} esta sera reiniciada....`})
            arrPhones.splice(i+1, 0, phone)
            manyAttemp = true
            continue
        }
        
    }
    
}


export const checker = async({phones, instances, socket, username}) => {
    const arrPhones = createInstances({arr: phones.flat(), size: instances})
    console.log(phones);

    return await [...Array(Number(instances))].map(async(_, index) => {
        runScrapper({arrPhones: arrPhones[index].flat(), socket, username, instanceIndex: ++index})
    })
}