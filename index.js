const puppeteer = require('puppeteer');
const BigNumber = require('bignumber.js');
const member = [
    "Earn",
    "Earth",
    "Eve",
    "Fame",
    "Grace",
    "Hoop",
    "Jaokhem",
    "Kaofrang",
    "Mean",
    "Monet",
    "Paeyah",
    "Pampam",
    "Pancake",
    "Peak",
    "Pim",
    "Popper",
    "Yayee",
    "Yoghurt"
];

function getVote(index) {
    return `body > div.layout-container > main > section > div.card > div.card-body > div:nth-child(11) > span > div:nth-child(${2+(3*(index+1))})`;
}

function printVote(voteResult) {
    let temp = {};
    let totalVote = new BigNumber(0)
    let previousVoteAmount = 0;
    for (let index = 1; index < voteResult.length + 1; index++) {
        const element = voteResult[index-1];
        if (previousVoteAmount === 0) {
            previousVoteAmount = element.voteAmount;
        } else {
            const rankDiff = parseFloat(previousVoteAmount) - parseFloat(element.voteAmount);
            element.rankDiff = rankDiff.toFixed(3);
            previousVoteAmount = element.voteAmount;
        }
        temp[index] = element;
        totalVote = totalVote.plus(new BigNumber(element.voteAmount))
    }
    console.clear();
    console.table(temp);
    if (previousTotalVote.comparedTo(0) > 0) {
        const diff = totalVote.minus(previousTotalVote);
        totalVoteInc = diff.plus(totalVoteInc);
        console.log(`Total Vote : ${totalVote} (+${diff.toFormat(3)})`);
    } else {
        console.log(`Total Vote : ${totalVote}`);
    }
    if (totalVoteInc.comparedTo(0) > 0) {
        console.log(`Total Run : ${runCounter} (+${totalVoteInc.toFormat(3)})`);
    } else {
        console.log(`Total Run : ${runCounter}`);
    }
    previousTotalVote = totalVote;
    if (previousUpdate !== null) {
        console.log(`Previous Updated : ${previousUpdate.toLocaleString()}`);
    }
    console.log(`Last Updated : ${lastUpdate.toLocaleString()}`);
}

const delayDuration = 60000 * 10; // 10 minutes refresh rate
const fractor = new BigNumber("1000000000000000000");
let totalVoteInc = new BigNumber(0);
let previousTotalVote = new BigNumber(0);
const previousVote = [];
const lastVote = [];
const totalVote = [];
const voteResult = [];
let previousUpdate = null;
let lastUpdate = null;
let runCounter = 0;

async function getData(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    var userAgent = require('user-agents');
    await page.setUserAgent(userAgent.toString())
    await page.goto('https://scan.tokenx.finance/address/0x1c7157A8043b04258516858Ad9bD9952E0D5ec8B/read-contract');

    // clear Vote before push
    lastVote.length = 0;
    voteResult.length = 0;
    await page.waitForSelector(getVote(1))
    for (let index = 0; index < member.length; index++) {
        let amount = await page.$(getVote(index))
        let value = await page.evaluate(el => el.textContent, amount)
        value = value.replace("(uint256) :","");
        value = new BigNumber(value)
        lastVote.push({
            name : member[index],
            voteAmount : value.dividedBy(fractor).toFixed(3)
        })
    }

    lastVote.sort((a, b) => { return b.voteAmount - a.voteAmount });
    if (previousVote.length === 0) {
        // no previous vote
        for (let el of lastVote) {
            // save vote data
            previousVote.push(el);
            const item = {
                name: el.name,
                voteAmount: el.voteAmount,
                rankDiff: "0.000",
                voteInc: "0.000",
                totalVoteInc: "0.000",
            };
            totalVote.push(item);
            voteResult.push(item);
        }
    } else {
        // find the diff of vote result
        for (let el of lastVote) {
            const found = previousVote.find((f) => f.name === el.name);
            const item = {
                name: el.name,
                voteAmount: el.voteAmount,
                rankDiff: "0.000",
                voteInc: "0.000",
                totalVoteInc: "0.000",
            };
            if (found !== undefined) {
                const voteInc = parseFloat(el.voteAmount) - parseFloat(found.voteAmount);
                if (voteInc > 0) {
                    found.voteAmount = el.voteAmount;
                }
                item.voteInc = voteInc.toFixed(3);
                const total = totalVote.find((f) => f.name === el.name);
                if (total !== undefined) {
                    const oldTotalVoteInc = parseFloat(total.totalVoteInc);
                    const newTotalVoteInc = oldTotalVoteInc + voteInc;
                    total.totalVoteInc = newTotalVoteInc.toFixed(3);
                    item.totalVoteInc = newTotalVoteInc.toFixed(3);
                }
            }
            voteResult.push(item);
        }
    }
    if (lastUpdate !== null) {
        previousUpdate = lastUpdate;
    }
    lastUpdate = new Date();
    runCounter++;
    await browser.close();
}

(async () => {
    await getData()
    printVote(voteResult);
    setInterval(async () => {
        await getData()
        printVote(voteResult);
    }, delayDuration)
})();