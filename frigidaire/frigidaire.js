const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/frigidaire/frigidaire-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const frigidaire = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    frigidaire[i] = {}
                    frigidaire[i]['state'] = ($(state).children("strong").text())
                    frigidaire[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        frigidaire[i]['states'][j] = {}
                        frigidaire[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        frigidaire[i]['states'][j]['link'] = link

                        frigidaire[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(frigidaire)
                    fs.writeFileSync("./frigidaire/frigidaire.json", brand)

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

            $(postDiv).children("p.elenchi").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children("span").children("strong").text()
                arr[i]["address"] = $(serviceCenter).children("span").children("span.evidenziato").text()
                if(!/[a-z]/gi.test($(serviceCenter).children("span").last().text()))
                arr[i]["phone"] = $(serviceCenter).children("span").last().text()
            })
            
            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}