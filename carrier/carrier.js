const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/carrier/carrier-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const carrier = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    carrier[i] = {}
                    carrier[i]['state'] = ($(state).children("strong").text())
                    carrier[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        carrier[i]['states'][j] = {}
                        carrier[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        carrier[i]['states'][j]['link'] = link

                        carrier[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(carrier)
                    fs.writeFileSync("./carrier/carrier.json", brand)

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
            $(postDiv).children("div:not(.advlaterale)").each((i, serviceCenter) => {
                if ($(serviceCenter).children("strong").length && 
                !$(serviceCenter).children("strong").text().includes("Sears Roebuck & Co")) {
                    arr[count] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text()?.trim()
                    arr[count]["serviceCenter"] = serviceCenterName
                    arr[count]["address"] = $(serviceCenter).text().replace(serviceCenterName, "")?.split("Address:")[1]?.split("Distance:")[0]?.trim()
                    arr[count]["phone"] = $(serviceCenter).text()?.split("Phone:")[1]?.split("Fax:")[0]?.trim()
                    arr[count]["fax"] = $(serviceCenter).text()?.split("Fax:")[1]?.split("\t")[0]?.trim()
                    count++
                }
            })
            
            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}