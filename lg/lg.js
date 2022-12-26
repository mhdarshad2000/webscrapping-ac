const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/lg-air-conditioners/lg-air-conditioner-repair.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const lg = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                    lg[i] = {}
                    lg[i]['state'] = ($(state).children("strong").text())
                    lg[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        lg[i]['states'][j] = {}
                        lg[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        lg[i]['states'][j]['link'] = link

                        lg[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(lg)
                    fs.writeFileSync("./lg/lg.json", brand)
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
                !$(serviceCenter).children("strong").text().includes("Lg Support Products:")&&
                !$(serviceCenter).children("strong").text().includes("Zip Code")&&
                !$(serviceCenter).children("strong").text().includes("Support for Lg products") ){
                    arr[count]={}
                    const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                    arr[count]["serviceCenter"] = serviceCenterName
                    arr[count]["address"] = $(serviceCenter).text().replace(serviceCenterName,"").split("Phone:")[0].replaceAll("\n","").replaceAll("\t","")?.trim()
                    arr[count]["phone"] = $(serviceCenter).text().split("Phone:")[1].split("Fax:")[0]?.replaceAll("\n","")?.replaceAll("\t","")?.trim()
                    arr[count]["fax"] = $(serviceCenter).text().split("Phone:")[1].split("Fax:")[1]?.split("\n")[0]?.trim()


                    count ++
                }
            })


            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}