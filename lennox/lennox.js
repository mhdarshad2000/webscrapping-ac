const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/lennox/lennox-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const lennox = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    lennox[i] = {}
                    lennox[i]['state'] = ($(state).children("strong").text())
                    lennox[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        lennox[i]['states'][j] = {}
                        lennox[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        lennox[i]['states'][j]['link'] = link

                        lennox[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(lennox)
                    fs.writeFileSync("./lennox/lennox.json", brand)

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
            $(postDiv).find(" table > tbody > tr ").each((i,serviceCenter)=>{
                arr[count]= {}
                if(/[a-z]/gi.test($(serviceCenter).text())){

                    const temp = $(serviceCenter).children("td").text().split("\n")
                    arr[count]["serviceCenter"] = temp[0].trim()
                    arr[count]["address"] = temp[1].replaceAll("\t","").trim()
                    arr[count]["phone"] = temp[2]?.replaceAll("\t","").trim()
                    count ++
                }
            })


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}