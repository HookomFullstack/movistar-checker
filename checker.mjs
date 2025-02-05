import axios from 'axios'
import proxyChain from 'proxy-chain'
import 'dotenv/config'
import { createInstances } from './helpers/createInstances.mjs'
import _ from 'lodash'
import {chromium} from 'playwright'
import { BinLive } from './Model/BinLive.mjs'


const runScrapper = async({arrPhones, socket, username, instanceIndex, sockOff}) => {


    let proxyInfo = null
    let browser = false
    let context = false
    let page = false
    let authHeader = false
    let manyAttemp = true
    for (const [i, phone] of arrPhones.entries()) {
        try {
            if (sockOff?.connected == false) {
                await browser.close()
                break
            }
            do {
            if (manyAttemp == true) {
                if (page != false) {
                    if (await page?.isClosed()) await browser?.close()    
                }
                // initForTwo = false
                // do {
                //     try {
                //         const {data} = await axios(`${process.env.PROXY_API}`)
                //         proxyInfo = data
                //         if(initForTwo) await new Promise( (resolve) => setTimeout( () => resolve(), 3000 ) )
                //         initForTwo = true
                //     } catch (error) {
                //         socket.to(username).emit('[claro] exectMsg', {msg: `Tienes un problema con tu proxy: ${error}`})
                //     }
                // } while (proxyInfo?.data === null)
                
                // const proxy = await proxyChain.anonymizeProxy({url: `http://${proxyInfo}`, port: 3000})
                
                browser = await chromium.launch({
                    headless: false,
                    args: [ 
                        // `--proxy-server=${proxy}`,
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
                        '--no-sandbox'
                    ]
                });

                context = await browser.newContext()
                page = await context.newPage()
                
                page.setDefaultNavigationTimeout(0)
                page.setDefaultTimeout(0)

                page.on('crash', async(page) => {
                    await page.close()
                })
                page.on('close', async(page) => {
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
                await page.locator('div:nth-child(5) > div.pb-3.wc > div > input').waitFor()
                const input = page.locator('div:nth-child(5) > div.pb-3.wc > div > input');
                await input.fill('3154444444');
                await page.click('#btnPayment > button');
            
                const keyAuth = await page.waitForRequest(
                    request => request.url() === 'https://secure.payco.co/recaudo/api/recaudo/proyecto/api/consulta/facturas'
                );
                
                const headers = keyAuth.headers();
                authHeader = Object.entries(headers).find(([key, value]) => key.length === 7 && key.toLowerCase() !== 'referer');
            }
        } while (manyAttemp == true)
        
        const start = new Date()
        
        const {factura, status} = await page.evaluate(async ({phone, authHeader}) => {

            await new Promise(res => setTimeout(res(), 1000000))
            do {
                if (window?.grecaptcha?.hasOwnProperty("execute") == false) {
                  await new Promise((res) => setTimeout(res, 1000));
                }
              } while (window?.grecaptcha?.hasOwnProperty("execute") == false);
          
              // Obtener el token de autorización desde el backend
              const generateTokenResponse = await fetch("https://secure.payco.co/recaudo/api/recaudo/get/token", {
                method: "POST",
                body: JSON.stringify({ dominio: "https://movistar.epayco.me" }),
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                },
              });
          
            const tokenJson = await generateTokenResponse.json();
            const token = tokenJson?.data?.token;
            if (!token) {
                throw new Error("No se pudo obtener el token de autorización.");
            }
            const recaptchat = await window.grecaptcha.execute('6LfArI4UAAAAAOvDvRVUtnowA9MVZ__b2lqAVhSo')

            const keyAuthHeader   = authHeader[0]
            const valueAuthHeader = authHeader[1]
            // Configuración de la solicitud para consultar facturas
            const urlFactura = "https://secure.payco.co/recaudo/api/recaudo/proyecto/api/consulta/facturas";
            const headers = {
                "accept": "application/json",
                "accept-language": "es-ES,es;q=0.9",
                "authorization": `Bearer ${token}`,
                "content-type": "application/json",
                "x-api-key": recaptchat,
                [keyAuthHeader]: valueAuthHeader,
            };

            const body = JSON.stringify({
            consulta: [
                { parametro: "paymentRef", value: phone },
                { parametro: "invoiceType", value: 'movil' },
                { parametro: "isRefNumber", value: "true" },
                { parametro: "comerce", value: 'movistar' },
                { parametro: "referen", value: "" },
                { parametro: "novum", value: "" },
            ],
            tipoConsulta: "online",
            dominio: "https://movistar.epayco.me/recaudo/recaudoenlinea",
            });

            // Realizar la solicitud
            const facturaResponse = await fetch(urlFactura, {
                method: "POST",
                headers: headers,
                body: body,
            });

            const data = await facturaResponse.json();

            if (data.success == true) {
                const factura = data.data.facturas.map(({id, total, extra14, facturaId}) => {
                    return {id, total, extra14, facturaId}
                  })
                return {factura, status: facturaResponse.status}
            }
            
            return {factura: null, status: facturaResponse.status}
        }, {phone, authHeader})

        if (status != 200) {
            await browser.close()
            socket.to(username).emit('[claro] exectMsg', {msg: `Claro te ha baneado tu instancia ${i} se reiniciara`})
            throw('error status')
        }
        const end = new Date();
        const time = end.getTime()-start.getTime()+'ms'
        await context.clearCookies()
        if (factura) {
            socket.to(username).emit(`[claro] live`, {phone, factura, msg: `Número ${phone} tiene una factura con deuda de ${factura[0].total} - ${time}`})
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
            if (sockOff?.connected == false) {
                await browser.close()
                break
            }
            continue
        }
    }
    socket.to(username).emit('[claro] exectMsg', {msg: `La instancia ${instanceIndex} ha finalizado`})
    await browser.close()
}


export const checker = async({phones, instances, socket, username, sockOff}) => {
    const arrPhones = createInstances({arr: phones.flat(), size: instances})

    return await [...Array(Number(instances))].map(async(_, index) => {
        runScrapper({arrPhones: arrPhones[index].flat(), socket, username, sockOff, instanceIndex: ++index})
    })
}