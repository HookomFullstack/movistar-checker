import axios from 'axios'
import proxyChain from 'proxy-chain'
import 'dotenv/config'
import _ from 'lodash'
import {chromium} from 'playwright'
import 'dotenv/config'




    let proxyInfo = null
    let browser = false
    let context = false
    let page = false
    let initForTwo = false
    let manyAttemp = true

    if (manyAttemp == true) {
        if (page != false) {
            if (await page?.isClosed()) await browser?.close()    
        }
        initForTwo = false
        // do {
        //     try {
        //         const {data} = await axios(`${process.env.PROXY_API}`)
        //         proxyInfo = data
        //         if(initForTwo) await new Promise( (resolve) => setTimeout( () => resolve(), 3000 ) )
        //             console.log(proxyInfo);
        //         initForTwo = true
        //     } catch (error) {
        //         socket.to(username).emit('[claro] exectMsg', {msg: `Tienes un problema con tu proxy: ${error}`})
        //     }
        // } while (proxyInfo?.data === null)
        
        // const proxy = await proxyChain.anonymizeProxy({url: `http://${proxyInfo}`, port: 3000})
        
        browser = await chromium.launch({
            headless: true,
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

        // await page.route('**/**/**/**/**/**', async(route, request) => {
        //     const routeType = route.request().resourceType()
        //     const requestType = request.resourceType()
        //     if(requestType == 'image' || requestType == 'stylesheet' || requestType == 'font' || requestType == 'media' || requestType == 'other')  return await route.abort()
        //     if(routeType == 'image' || routeType == 'stylesheet' || routeType == 'font'       || routeType == 'media'   || routeType == 'other') return await route.abort()
        //     await route.continue()
        // })
        await page.goto('https://movistar.recaudo.epayco.co/');
        await page.waitForTimeout(4000)

        // const phone = '3152134569'

        // const data = await page.evaluate(async phone => {


        //     try {
        //         do {
        //             if (window?.grecaptcha?.hasOwnProperty("execute") == false) {
        //               await new Promise((res) => setTimeout(res, 1000));
        //             }
        //           } while (window?.grecaptcha?.hasOwnProperty("execute") == false);
              
        //           // Obtener el token de autorización desde el backend
        //           const generateTokenResponse = await fetch("https://secure.payco.co/recaudo/api/recaudo/get/token", {
        //             method: "POST",
        //             body: JSON.stringify({ dominio: "https://movistar.epayco.me" }),
        //             headers: {
        //               "Content-Type": "application/json; charset=utf-8",
        //             },
        //           });
              
        //         const tokenJson = await generateTokenResponse.json();
        //         const token = tokenJson?.data?.token;
        //         if (!token) {
        //             throw new Error("No se pudo obtener el token de autorización.");
        //         }
        //         const recaptchat = await window.grecaptcha.execute('6LfArI4UAAAAAOvDvRVUtnowA9MVZ__b2lqAVhSo')
                
        //         // Configuración de la solicitud para consultar facturas
        //         const urlFactura = "https://secure.payco.co/recaudo/api/recaudo/proyecto/api/consulta/facturas";
        //         const headers = {
        //             "accept": "application/json",
        //             "accept-language": "es-ES,es;q=0.9",
        //             "authorization": `Bearer ${token}`,
        //             "content-type": "application/json",
        //             "x-api-key": recaptchat,
        //             "mzlpcsy": "jNm3njLEWyN5U56vszzYRJrsRS1Tai"
        //         };
    
        //         const body = JSON.stringify({
        //         consulta: [
        //             { parametro: "paymentRef", value: phone },
        //             { parametro: "invoiceType", value: 'movil' },
        //             { parametro: "isRefNumber", value: "true" },
        //             { parametro: "comerce", value: 'movistar' },
        //             { parametro: "referen", value: "" },
        //             { parametro: "novum", value: "" },
        //         ],
        //         tipoConsulta: "online",
        //         dominio: "https://movistar.epayco.me/recaudo/recaudoenlinea",
        //         });
    
        //         // Realizar la solicitud
        //         const facturaResponse = await fetch(urlFactura, {
        //             method: "POST",
        //             headers: headers,
        //             body: body,
        //         });
    
        //         const data = await facturaResponse.json();
    
        //         return data
        //     } catch (error) {
        //         return error
        //     }
        // }, phone)
        // console.log(data);
    }

