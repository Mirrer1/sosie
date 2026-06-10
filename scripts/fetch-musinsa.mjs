import ogs from 'open-graph-scraper'

const URLS = [
  'https://www.musinsa.com/products/6257984',
  'https://www.musinsa.com/products/6154823',
  'https://www.musinsa.com/products/6573994',
  'https://www.musinsa.com/products/4790520',
  'https://www.musinsa.com/products/5746361',
]

for (const url of URLS) {
  console.log(`\n=== ${url} ===`)
  try {
    const { result } = await ogs({ url })
    console.log({
      ogTitle: result.ogTitle,
      ogDescription: result.ogDescription,
      ogImage: result.ogImage?.[0]?.url,
      ogSiteName: result.ogSiteName,
      ogPriceAmount: result.ogPriceAmount,
      productPrice: result.productPriceAmount,
    })
  } catch (e) {
    console.error('ERROR', e.message)
  }
}
