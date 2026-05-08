export type MpesaResponse = {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
  errorMessage?: string
}

export class MpesaService {
  private static getAuth() {
    const key = process.env.MPESA_CONSUMER_KEY
    const secret = process.env.MPESA_CONSUMER_SECRET
    if (!key || !secret) {
      console.error('M-Pesa Consumer Key or Secret is missing in environment variables.')
    }
    return Buffer.from(`${key}:${secret}`).toString('base64')
  }

  private static getBaseUrl() {
    return process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'
  }

  static async getAccessToken(): Promise<string> {
    try {
      const auth = this.getAuth()
      const url = `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`

      const response = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`M-Pesa Auth Failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (err) {
      console.error('MpesaService.getAccessToken Error:', err)
      throw err
    }
  }

  static async initiateStkPush(phone: string, amount: number, reference: string): Promise<MpesaResponse> {
    try {
      const token = await this.getAccessToken()
      const url = `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`
      
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
      const shortcode = process.env.MPESA_SHORTCODE!
      const passkey = process.env.MPESA_PASSKEY!
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

      // Format phone: 2547XXXXXXXX or 2541XXXXXXXX
      let formattedPhone = phone.replace(/\D/g, '')
      if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)
      if (formattedPhone.length === 9) formattedPhone = '254' + formattedPhone // handles 7XXXXXXXX
      if (!formattedPhone.startsWith('254')) {
        // If it starts with 7 or 1 but is not 12 digits, prepend 254
        if (formattedPhone.length === 10 && formattedPhone.startsWith('0')) {
             formattedPhone = '254' + formattedPhone.slice(1)
        }
      }

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

      console.log('M-Pesa STK Payload:', JSON.stringify(payload))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('M-Pesa STK Response:', JSON.stringify(data))
      return data
    } catch (err) {
      console.error('MpesaService.initiateStkPush Error:', err)
      throw err
    }
  }
}
