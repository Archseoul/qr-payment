import CryptoJS from 'crypto-js'
import { EncryptKey } from '~/utils/code'

export function encrypt (message: string): string {
  const cipherText = CryptoJS.AES.encrypt(message, EncryptKey).toString()
  const modifiedCipherText = cipherText.replace(/\//g, '_')
  return modifiedCipherText
}

export function decrypt (cipherText: string): string {
  const originalCipherText = cipherText.replace(/_/g, '/')
  const bytes = CryptoJS.AES.decrypt(originalCipherText, EncryptKey)
  const originalText = bytes.toString(CryptoJS.enc.Utf8)
  return originalText
}
