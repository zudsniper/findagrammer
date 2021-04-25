// const axios = require('axios')
// const FormData = require('form-data');
// only need these if you're actually gonna implement the PicPurify NN, but you only get 2000 queries / mo so expensive, gonna rely on data for now

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const puppeteer = require('puppeteer');
const $ = require('cheerio');
const Apify = require('apify');
const { log } = Apify.utils;

//my modules
const guesser = require('./guessGender');
const info = require('./grammerInfo');

log.setLevel(log.LEVELS.DEBUG);

// LOAD SEARCH INFO FROM PARAMETER
const searchJsonPath = process.argv[2]; // first is "node", second is node file name
const searchParams = JSON.parse(fs.readFileSync(searchJsonPath));


const instagramURL = 'https://www.instagram.com/accounts/login/';
const seedURLStub = 'https://instagram.com/'; 

// CREDENTIALS
//get credentials from gitignore'd folder
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials', 'instagram.json')));

Apify.main(async() => {
	const input = await Apify.getValue('INPUT');

	const browser = await Apify.launchPuppeteer({ stealth: true });
	const page = await browser.newPage();
	
// LOGIN 
	await page.goto(instagramURL);
	await page.waitFor(2000); //2 seconds is arbitrary, just can't use waitForNavigation

	await page.waitForSelector('input[name=username]');
	await page.focus('input[name=username]');
	await page.type('input[name=username]', credentials['username']);
	//await page.$eval('input[name=username]', el => el.value = username);
	await page.focus('input[name=password]');
	await page.type('input[name=password]', credentials['password']);
	//await page.$eval('input[name=password]', el => el.value = password);
	await page.focus('button[type=submit]');
	await page.click('button[type=submit]'); //its the only one 
	await page.waitForNavigation();

	const sessionCookies = await page.cookies();

// CALL SCRAPER AFTER AUTH, WITH SAVED AUTHED COOKIES

	await page.close();
	await browser.close();
});

//MAIN CRAWLER

// let parentUsername; 
// let depth; 

// Apify.main(async () => {
// 	const requestQueue = await Apify.openRequestQueue();
// 	await requestQueue.addRequest({url: seedURLStub + searchParams['seedUsername']});

// 	const crawler = new Apify.PuppeteerCrawler({
// 		requestQueue,
// 		handlePageFunction: async ({request, page}) => {



// 			await Apify.utils.enqueueLinks({
// 				page,
// 				requestQueue,
// 				selector: '.more'
// 			});
// 		},
// 		maxRequestPerCrawl: 50
// 	});

// 	await crawler.run();
// });


// puppeteer
// 	.launch()
// 	.then(function(browser) {
// 		return browser.newPage();
// 	})
// 	.then(function(page) {
// 		return page.goto(seedURL)
// 		.then(function(){ return page.content(); })
// 	}).then(function(html) {
// 		console.log(html);
// 	});