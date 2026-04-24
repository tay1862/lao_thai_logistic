import JsBarcode from 'jsbarcode'

type BarcodeEncoding = {
  data: string
  options: {
    width: number
    height: number
    marginLeft?: number
    marginRight?: number
    marginTop?: number
    marginBottom?: number
    background: string
    lineColor: string
  }
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function createBarcodeSvg(value: string, options?: { height?: number; width?: number }) {
  const target: { encodings?: BarcodeEncoding[] } = {}

  JsBarcode(target as never, value, {
    format: 'CODE128',
    displayValue: false,
    height: options?.height ?? 60,
    width: options?.width ?? 2,
    margin: 0,
  })

  const encoding = target.encodings?.[0]
  if (!encoding) {
    throw new Error('Unable to generate barcode')
  }

  const marginLeft = encoding.options.marginLeft ?? 0
  const marginRight = encoding.options.marginRight ?? 0
  const marginTop = encoding.options.marginTop ?? 0
  const marginBottom = encoding.options.marginBottom ?? 0
  const totalWidth = encoding.data.length * encoding.options.width + marginLeft + marginRight
  const totalHeight = encoding.options.height + marginTop + marginBottom

  let x = marginLeft
  const bars: string[] = []

  for (const bit of encoding.data) {
    if (bit === '1') {
      bars.push(
        `<rect x="${x}" y="${marginTop}" width="${encoding.options.width}" height="${encoding.options.height}" fill="${escapeXml(encoding.options.lineColor)}" />`
      )
    }
    x += encoding.options.width
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" role="img" aria-label="${escapeXml(value)}"><rect width="100%" height="100%" fill="${escapeXml(encoding.options.background)}" />${bars.join('')}</svg>`
}
