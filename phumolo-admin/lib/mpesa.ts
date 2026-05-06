export type MpesaResponse = {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export class MpesaService {
  private static getAuth() {
    const key = process.env.MPESA_CONSUMER_KEY
    const secret = process.env.MPESA_CONSUMER_SECRET
    return Buffer.from(`${key}:${secret}`).toString('base64')
  }

  private static getBaseUrl() {
    return process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'
  }

  static async getAccessToken(): Promise<string> {
    const auth = this.getAuth()
    const url = `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` }
    })
    const data = await response.json()
    return data.access_token
  }

  static async initiateStkPush(phone: string, amount: number, reference: string): Promise<MpesaResponse> {
    const token = await this.getAccessToken()
    const url = `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`
    
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    const shortcode = process.env.MPESA_SHORTCODE!
    const passkey = process.env.MPESA_PASSKEY!
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    // Format phone: 2547XXXXXXXX
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)
    if (formattedPhone.startsWith('7')) formattedPhone = '254' + formattedPhone
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.slice(1)

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: reference,
      TransactionDesc: 'Hekima Marathon Registration'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    return await response.json()
  }
}
