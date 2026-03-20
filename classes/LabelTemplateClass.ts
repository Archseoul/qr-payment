import type { BigTemplateType, ExtraSmallTemplateType, LabelDeviceType, LabelTemplateVo, SmallTemplateType } from '~/types'

export class LabelTemplateClass implements LabelTemplateVo {
  private _deviceTypeData: LabelDeviceType
  labelTemplateSeq?: number
  extraSmallTemplateType?: ExtraSmallTemplateType
  smallTemplateType?: SmallTemplateType
  bigTemplateType?: BigTemplateType
  templateName: string
  imageName: string
  file: File
  fileName: string
  filePath: string
  shopCount?: number
  _textTop?: string
  _textBottom?: string
  constructor (init?:LabelTemplateVo) {
    this._deviceTypeData = '2.2/3'
    this.extraSmallTemplateType = 'BLACK'
    this.smallTemplateType = 'DEFAULT_SMALL'
    this.bigTemplateType = 'DEFAULT'
    this.templateName = ''
    this.imageName = ''
    this.file = new File([], '')
    this.fileName = ''
    this.filePath = ''
    this._textTop = undefined
    this._textBottom = undefined

    if (init) {
      Object.assign(this, init)
    }
  }

  set deviceType (deviceType: LabelDeviceType) {
    this._deviceTypeData = deviceType

    if (deviceType === '7.5/4') {
      this.extraSmallTemplateType = undefined
      this.smallTemplateType = undefined
      this.bigTemplateType = 'DEFAULT'
      this._textTop = ''
      this._textBottom = ''
    } else if (deviceType === '2.2/3') {
      this.smallTemplateType = undefined
      this.bigTemplateType = undefined
      this.extraSmallTemplateType = 'BLACK'
    } else {
      this.extraSmallTemplateType = undefined
      this.bigTemplateType = undefined
      this.smallTemplateType = 'DEFAULT_SMALL'
    }
  }

  get deviceType () {
    return this._deviceTypeData
  }

  get textTop () {
    return this._textTop ?? ''
  }

  set textTop (text: string) {
    this._textTop = text
  }

  get textBottom () {
    return this._textBottom ?? ''
  }

  set textBottom (text: string) {
    this._textBottom = text
  }

  toJSON () {
    return Object.assign({}, this, {
      deviceType: this.deviceType,
      extraSmallTemplateType: this.extraSmallTemplateType,
      smallTemplateType: this.smallTemplateType,
      bigTemplateType: this.bigTemplateType,
      textTop: this.textTop,
      textBottom: this.textBottom
    })
  }
}
