const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/bryant/bryant-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const bryant = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    bryant[i] = {}
                    bryant[i]['state'] = ($(state).children("strong").text())
                    bryant[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        bryant[i]['states'][j] = {}
                        bryant[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        bryant[i]['states'][j]['link'] = link

                        bryant[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(bryant)
                    fs.writeFileSync("./bryant/bryant.json", brand)

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

            $(postDiv).children("div:not(.advlaterale)").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children().first().text()
                arr[i]["phone"] = $(serviceCenter).children().last().text()
            })
           

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}