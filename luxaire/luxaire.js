const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/luxaire/luxaire-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const luxaire = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    luxaire[i] = {}
                    luxaire[i]['state'] = ($(state).children("strong").text())
                    luxaire[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        luxaire[i]['states'][j] = {}
                        luxaire[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        luxaire[i]['states'][j]['link'] = link

                        luxaire[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(luxaire)
                    fs.writeFileSync("./luxaire/luxaire.json", brand)
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

            let count = 0
            $(postDiv).children("p").each((i,serviceCenter)=>{
                if($(serviceCenter).children("strong").length ===1 &&
                !$(serviceCenter).children("strong").text().includes("Support for Luxaire")&&
                !$(serviceCenter).children("strong").text().includes("Zip Code") ){
                    arr[count]={}
                    const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                    arr[count]["serviceCenter"] = serviceCenterName
                    arr[count]["address"] = $(serviceCenter).text().replace(serviceCenterName,"")?.split("(")[0].replaceAll("\t","").replaceAll("\n"," ")?.trim()
                    arr[count]["phone"] = "("+$(serviceCenter).text()?.split("(")[1]?.split("\n")[0]?.trim()
                    count ++
                }
            })


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}