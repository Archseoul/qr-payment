export const priceToCurrency = (price : number, shopLanguage : string) => {
  const format = (priceFormat : number) => {
    return priceFormat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  switch (shopLanguage) {
    case 'ko':
      return `${format(price)}원`
    case 'en':
      const priceStr = price.toString()
      const integerPart = priceStr.slice(0, -2)
      const decimalPart = priceStr.slice(-2)
      const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return `${formattedIntegerPart}.${decimalPart}$`
    case 'jp':
      return `¥${format(price)}`
    case 'ch':
      return `¥${format(price)}`
    case 'al':
      return `¥${format(price)}`
    default:
      return `${format(price)}원`
  }
}
