const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/daikin/daikin-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const daikin = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    daikin[i] = {}
                    daikin[i]['state'] = ($(state).children("strong").text())
                    daikin[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        daikin[i]['states'][j] = {}
                        daikin[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        daikin[i]['states'][j]['link'] = link

                        daikin[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(daikin)
                    fs.writeFileSync("./daikin/daikin.json", brand)

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

            $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                if ($(serviceCenter).children("h3").length) {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h3").text()?.trim()
                    arr[i]["address"] = $(serviceCenter).children("p").text()?.split(" (Map")[0]?.replaceAll("\n", "")?.replaceAll("\t", "")?.trim()
                    arr[i]["phone"] = $(serviceCenter).children("p").text()?.split("Phone:")[1]?.split("\n")[0]?.trim()
                }
            })

            if(!arr.length){
                $(postDiv).children("h3:not(.fumna)").each((i,serviceCenter)=>{
                    arr[i]= {}
                    arr[i]["serviceCenter"] = $(serviceCenter).text()?.trim()
                    arr[i]["address"] = $(serviceCenter).next("p").text()?.split(" (Map")[0]?.replaceAll("\n", "")?.replaceAll("\t", "")?.trim()
                    arr[i]["phone"] = $(serviceCenter).next("p").text()?.split("Phone:")[1]?.split("\n")[0]?.trim()
                })
            }

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}