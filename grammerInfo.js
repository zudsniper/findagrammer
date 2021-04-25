const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const puppeteer = require('puppeteer');
const $ = require('cheerio');
const Apify = require('apify');
const { log } = Apify.utils;

//my modules
const guesser = require('./guessGender');

const seedURLStub = 'https://instagram.com/'; 

// Get info from an instagram user page, return json object.
// currently only tested on a fully defined user with: 
// 		username
//		name
//		accType
//		bio
//		website
// but these don't all have to be defined- namely in terms of a private account. Private accounts are also a dead-end for search.
function getInfo(page, username, saveImages) {
	
	let insta = [];

	await page.goto(seedURLStub + username);
	const content = await page.content();
	const infoParentDiv = $('div h1', content).parent();

	//private acc?
	const privateAcc = false;

	const privateDescriptor = $('article div div h2', content); //this is the banner that says "this account is private." if it's null, public account
	if(privateDescriptor) {
		privateAcc = true;
	} 

	//get text info
	//MANDATORY
	const instaUsername = $('div h2',content).text();
	const instaName = $('div h1', content).text(); //i think you have to define this?
	//OPTIONAL (may not exist)
	const instaAccTypeObj = infoParentDiv.find('> div span');
	let instaAccType;
	if(instaAccTypeObj) { //exists
		instaAccType = instaAccTypeObj.text().trim();
	}
	const instaBioObj = infoParentDiv.find('> span');
	let instaBio;
	if(instaBioObj) {
		instaBio = instaBioObj.text().trim();
	}
	const instaWebsiteObj = infoParentDiv.find('> a');
	let instaWebsite;
	if(instaWebsiteObj) {
		instaWebsite = instaWebsiteObj.first().text().trim();
	}

	//get internet value points
	//WILL ONLY WORK FOR PUBLIC ACCOUNTS CURRENTLY
	//3 li's: posts, followers, following

	const IVPList = $('ul > li > span > span', content).parent().parent().parent();

	const posts = $('ul > li > span > span', content).text().trim();

	let followers;
	let following;

	if(!privateAcc) {
		//for second and third li, which are followers & following, populate the right variables.
		IVPList.find('> li').each(function(i, elem) {
			//ignore i=0 because we already set posts (hopefully)
			if(i == 1) {
				followers = $(this).find('> a span').text().trim();

			} else if(i == 2) {
				following = $(this).find('> a span').text().trim();
			}
		});
	} else { //private accounts don't have links to follow lists
		IVPList.find('> li').each(function(i, elem) {
			//ignore i=0 because we already set posts (hopefully)
			if(i == 1) {
				followers = $(this).find('> span span').text().trim();

			} else if(i == 2) {
				following = $(this).find('> span span').text().trim();
			}
		});
	}
	
	log.debug("------------------------------");
	log.debug("username: " + instaUsername);
	log.debug("name: " + instaName);
	log.debug("acctype: " + instaAccType);
	log.debug("bio: " + instaBio);
	log.debug("website: " + instaWebsite);
	log.debug("posts: " + posts);
	log.debug("followers: " + followers);
	log.debug("following: " + following);

	const guessedGender = guesser.guessGenderFromName(instaName.split(" ")[0]);

	log.debug("gender: " + guessedGender); //assumes there's not a space at the beginning of name field... hopefully there isn't
	log.debug("------------------------------");

	const imageURL = $('div div span img').attr('src');
	const imageB64 = await page.goto(imageURL).buffer().toString('base64');

	//put all of this info into object
	insta.push({'username', instaUsername});
	insta.push({'name', instaName});
	insta.push({'private', privateAcc});
	insta.push({'acctype', instaAccType});
	insta.push({'bio', instaBio});
	insta.push({'website', instaWebsite});
	insta.push({'posts', posts});
	insta.push({'followers', followers});
	insta.push({'following', following});
	insta.push({'gender', guessedGender});
	if(saveImages) {
		insta.push({'profilePicture', imageB64});
	}
	
	return insta;
}