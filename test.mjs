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


fetch("https://secure.payco.co/recaudo/api/recaudo/proyecto/api/consulta/facturas", {
    headers: {
      "accept": "application/json",
      "accept-language": "es-ES,es;q=0.9",
      "authorization": `Bearer ${token}`,
      "content-type": "application/json",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "x-api-key": `${recaptchat}`,
      "Referer": "https://movistar.recaudo.epayco.co/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": {
      consulta: [
        {
          parametro: 'paymentRef',
          value: '3160532235'
        },
        { parametro: 'invoiceType', value: 'movil' },
        { parametro: 'isRefNumber', value: 'true' },
        { parametro: 'comerce', value: 'movistar' },
        { parametro: 'referen', value: '' },
        { parametro: 'novum', value: '' }
      ],
      tipoConsulta: 'online',
      dominio: 'https://movistar.epayco.me/recaudo/recaudoenlinea'
    },
    method: "POST"
  });

  