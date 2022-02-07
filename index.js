const puppeteer = require('puppeteer');
const BigNumber = require('bignumber.js');
const member = ["Earn","Earth","Eve","Fame","Grace","Hoop","Jaokhem","Kaofrang","Mean","Monet","Paeyah","Pampam","Pancake","Peak","Pim","Popper","Yayee","Yoghurt"];

function getVote(index) {
    return `body > div.layout-container > main > section > div.card > div.card-body > div:nth-child(11) > span > div:nth-child(${2+(3*(index+1))})`;
}

function printVote(VoteReceive) {
    let temp = {};
    let totalVote = new BigNumber(0)
    for (let index = 1; index < VoteReceive.length + 1; index++) {
        const element = VoteReceive[index-1];
        temp[index] = element;
        totalVote = totalVote.plus(new BigNumber(element.voteAmount))
    }
    console.clear();
    console.table(temp);
    console.log(`totalVote : ${totalVote}`);
}

const delayDuration = 5000; // 5s refresh rate
const fractor = new BigNumber("1000000000000000000");
let VoteReceive = []

async function getData(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    var userAgent = require('user-agents');
    await page.setUserAgent(userAgent.toString())
    await page.goto('https://scan.tokenx.finance/address/0x1c7157A8043b04258516858Ad9bD9952E0D5ec8B/read-contract');

    // clear Vote before push
    VoteReceive.splice(0,VoteReceive.length)
    await page.waitForSelector(getVote(1))
    for (let index = 0; index < 17; index++) {
        let amount = await page.$(getVote(index))
        let value = await page.evaluate(el => el.textContent, amount)
        value = value.replace("(uint256) :","");
        value = new BigNumber(value)
        VoteReceive.push({
            name : member[index],
            voteAmount : value.dividedBy(fractor).toFixed(3)
        })
    }

    VoteReceive.sort( (a, b) => {return b.voteAmount - a.voteAmount });
    await browser.close();
}

async function main() {
    setTimeout(async () => {
        await getData()
        printVote(VoteReceive);
        await main();
    }, delayDuration)
}

(async () => {
    await main();
})();