
if (manyAttemp == true) {
if (page != false) {
    if (await page?.isClosed()) await browser?.close()    
}
initForTwo = false
do {
    try {
        const {data} = await axios(`${process.env.PROXY_API}`)
        proxyInfo = data
        if(initForTwo) await new Promise( (resolve) => setTimeout( () => resolve(), 3000 ) )
        initForTwo = true
    } catch (error) {
        socket.to(username).emit('[claro] exectMsg', {msg: `Tienes un problema con tu proxy: ${error}`})
    }
} while (proxyInfo?.data === null)

const proxy = await proxyChain.anonymizeProxy({url: `http://${proxyInfo}`, port: 3000})

browser = await chromium.launch({
    headless: false,
    args: [ 
        `--proxy-server=${proxy}`,
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