import type { PrinterVo } from '~/types'

export class PrinterClass implements PrinterVo {
  public printerObjectType: string = 'new'
  public printerSeq: number = 0
  public shopSeq: number = 0
  public printerName: string = ''
  public printerType: string = 'serial'
  public mainConnectionInfo: string = 'COM1'
  public subConnectionInfo: string = '9600'
  public orderReceipt: boolean = false
  public rePrint: boolean = false
  public insDate: string = ''
  public insTid: string = ''
  public uptDate: string = ''
  public uptTid: string = ''
  public check?: boolean = false
  public menuSeqList?: number[] = []

  constructor (init?: Partial<PrinterVo>) {
    Object.assign(this, init)
  }
}
