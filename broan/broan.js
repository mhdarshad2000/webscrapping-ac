const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/broan/broan-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const broan = []
            rp(brandUrl).then((htmlString) => {
                const $ = cheerio.load(htmlString)
                const postDiv = $(".post")
                $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                    broan[i] = {}
                    broan[i]['state'] = ($(state).children("strong").text())
                    broan[i]['states'] = []
                    $(state).children("li").each(async (j, city) => {
                        broan[i]['states'][j] = {}
                        broan[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        broan[i]['states'][j]['link'] = link

                        broan[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    })

                })
                setTimeout(() => {
                    const brand = JSON.stringify(broan)
                    fs.writeFileSync("./broan/broan.json", brand)

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

            $(postDiv).find(" table > tbody > tr").each((i,serviceCenter)=>{
                if(i!==0){
                    arr[i-1]={}
                    const serviceCenterName = $(serviceCenter).children("td").first().children("strong").text()
                    arr[i-1]["serviceCenter"] = serviceCenterName.trim() 
                    arr[i-1]["address"]= $(serviceCenter).children("td").first().text().replace(serviceCenterName,"").replaceAll("\n","").replaceAll("\t","").replaceAll("      "," ").trim()
                    arr[i-1]["phone"] = $(serviceCenter).children("td").last().text().trim()
                }
            })
           

            resolve(arr)
        } catch (error) {
            console.log(error.message)
        }
    })
}