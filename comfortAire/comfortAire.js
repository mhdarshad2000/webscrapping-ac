const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/comfort-aire/comfort-aire-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const comfortAire = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    comfortAire[i] = {}
                    comfortAire[i]['state'] = ($(state).children("strong").text())
                    comfortAire[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        comfortAire[i]['states'][j] = {}
                        comfortAire[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        comfortAire[i]['states'][j]['link'] = link

                        comfortAire[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(comfortAire)
                    fs.writeFileSync("./comfortAire/comfortAire.json", brand)

                }, 8000)
            })

        } catch (error) {
            console.log(error.message, 404)
        }
    })
}

scrap()

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            const postsDiv = $(".posts")

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}