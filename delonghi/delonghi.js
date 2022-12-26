const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/delonghi-air-conditioners/delonghi-air-conditioners-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const delonghi = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    delonghi[i] = {}
                    delonghi[i]['state'] = ($(state).children("strong").text())
                    delonghi[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        delonghi[i]['states'][j] = {}
                        delonghi[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        delonghi[i]['states'][j]['link'] = link

                        delonghi[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(delonghi)
                    fs.writeFileSync("./delonghi/delonghi.json", brand)

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

            let count =0
            $(postDiv).children("p").each((i,serviceCenter)=>{
                if($(serviceCenter).children("strong").length ===1 &&
                !$(serviceCenter).children("strong").text().includes("De'Longhi Air Conditioner Support Products")&&
                !$(serviceCenter).children("strong").text().includes("Zip Code") &&
                !$(serviceCenter).children("strong").text().includes("De'Longhi Air Conditioner Contact Customer Service")&&
                !$(serviceCenter).children("strong").text().includes("De'Longhi Contact Customer Service")){
                    arr[count]={}
                    const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                    arr[count]["serviceCenter"] = serviceCenterName
                    arr[count]["address"] = $(serviceCenter).text().replace(serviceCenterName,"")?.split("Phone:")[0]?.trim()
                    arr[count]["phone"] = $(serviceCenter).text()?.split("Phone:")[1]?.split("\n")[0]?.trim()
                    count ++
                }
            })
            
            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}