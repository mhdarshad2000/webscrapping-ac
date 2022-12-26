const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/armstrong/armstrong-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const armstrong = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    armstrong[i] = {}
                    armstrong[i]['state'] = ($(state).children("strong").text())
                    armstrong[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        armstrong[i]['states'][j] = {}
                        armstrong[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        armstrong[i]['states'][j]['link'] = link

                        armstrong[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(armstrong)
                    fs.writeFileSync("./armstrong/armstrong.json", brand)

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
            $(postDiv).children((i, serviceCenter) => {
                if ($(serviceCenter).children("strong").length === 1 &&
                    !$(serviceCenter).children("strong").text().includes("Support for Armstrong products") &&
                    !$(serviceCenter).children("strong").text().includes("Zip Code")
                ) {
                    arr[count] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text()
                    arr[count]["serviceCenter"] = serviceCenterName
                    arr[count]["address"] = $(serviceCenter).text().replace(serviceCenterName, "").replaceAll("\n", "  ").replaceAll("\t", "").trim()
                    arr[count]["phone"] = $(serviceCenter).next().text().split("Phone:")[1].split("\n")[0].trim()
                    arr[count]["fax"] = $(serviceCenter).next().text().split("FAX:")[1].trim()

                    count++
                }
            })

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}