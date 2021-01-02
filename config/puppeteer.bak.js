const Promise   = require('bluebird');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const settings  = require('./appSettings');
const captcha  = require('./captcha');
const tesseract = require("node-tesseract-ocr");
const timeout = 100000;
module.exports.ibriLogin = async function(sendData, userID) {
    
    return new Promise((resolve, reject) => {

        (async () => {
            const chromeOptions = {
                headless: settings.ProductionMode,
                userDataDir: './cache/session/',
                defaultViewport: null,
                args: [
                    "--incognito",
                    "--no-sandbox",
                    "--single-process",
                    "--no-zygote",  
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    '--ignoreHTTPSErrors=true',
                    '--disable-features=site-per-process'
                ],
            };

            try {
                console.log("LOG : Open Browser...");
                puppeteer.use(StealthPlugin());
                const browser = await puppeteer.launch(chromeOptions);

                const page = await browser.newPage();

                // login progress
                const url           = 'https://ib.bri.co.id/ib-bri/Login.html';   
                const username      = userID.username;
                const pwd           = userID.password;
                const no_rekening   = sendData.account_number;
                const date          = sendData.date.split("/");
                const day           = date[0];
                const month         = date[1];
                const year          = date[2];

                
                // set navigation without timeout
                await page.setDefaultNavigationTimeout(timeout);
                await page.setDefaultTimeout(timeout);
                await page.setUserAgent(settings.user_agent);
                await page.evaluateOnNewDocument(() => {
                    // Pass webdriver check
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => false,
                    });
                });

                await page.evaluateOnNewDocument(() => {
                    // Pass chrome check
                    window.chrome = {
                        runtime: {},
                        // etc.
                    };
                });

                // start here.. go to login page
                try {

                    console.log("LOG : Go to URL " + url);
                    await page.goto(url, {
                        waitUntil: 'load',
                        timeout: timeout
                    });
                    
                    console.log("LOG : Loading progress");
                    // get captcha images
                    const captchaPath = './cache/';
                    try {
                        await page.waitForSelector('img[class="alignimg"]').then(() => 
                            console.log('LOG : all page loaded')
                        );
                        const element = await page.$('img[class="alignimg"]');
                        console.log("LOG : Screenshoot captcha Images...");
                        await element.screenshot({path: captchaPath + 'captcha.png'});                      
                    }catch(err){
                        console.log('cant load the page, maybe server is busy : ' + err);
                        closeBrowser(browser);
                        return reject(err);
                    }

                    // solved captcha with tesseract
                    console.log("LOG : Bypass Captcha token");
                    captcha.bypass(captchaPath);
                    const cap = captchaPath + 'captcha.png';
                    const config = {
                        lang: "eng",
                        psm: 10,
                        tessedit_char_whitelist: "0123456789",
                      }
                    const bypassCaptcha = await tesseract.recognize(cap, config);

                    // get captcha token from tesseract
                    var token = bypassCaptcha.replace(/\s/g, "");
                    token = token.replace("|","");
                    token = token.replace(",","");
                    
                    console.log("RESULT : Token Captcha : " + token);
                    // input username and password with captcha
                    console.log("INPUT : Input username in form..");
                    await page.type('input[placeholder="user ID"]', username);
                    console.log("INPUT : Input password in form..");
                    await page.type('input[placeholder="password"]', pwd);
                    console.log("INPUT : Input captcha token in form..");
                    await page.type('input[name="j_code"]', token);
                    // login proses
                    console.log("SUBMIT : Login progress..");
                    await page.click('#loginForm > button',{ timeout: timeout, waitUntil: 'load' });
                    // wait after login click and all loaded the page                
                    console.log("LOG : Waiting progress after submit login");
                    try {
                        await page.waitForSelector('a[id="myaccounts"]').then(() => 
                            console.log('LOG : all page loaded')
                        );
                        // check if login succesfully and menu myaccount exist
                        if((await page.$('a[id="myaccounts"]')) !== null || (await page.$('a[href="Logout.html"]')) !== null){
                            console.log("LOG : Go to myaccounts menu...");
                            await page.click('a[id="myaccounts"]', { timeout: timeout, waitUntil: 'domcontentloaded' });
                            console.log("LOG : Loading ajax progress after click myaccounts...");
                            // click mutasi menu in iframe
                            try {
                                frame = await page.frames().find(fr => fr.name() === 'menus');
                                console.log("LOG : Go to mutasi menu...");
                                await frame.waitForSelector('a[href="AccountStatement.html"]').then(() => 
                                    console.log('LOG : all page loaded for mutasi menu')
                                );
                                console.log("LOG : Loading ajax progress after click accountStatement menu...");
                                frame.click('a[href="AccountStatement.html"]', {timeout: timeout, waitUntil: 'domcontentloaded'});
                            } catch (err) {
                                console.log("LOG : " + err);
                                await logout(page,browser);
                                return reject(err);
                            }

                            try {
                                // find content after click accountstatement
                                frame = await page.frames().find(fr => fr.name() === 'content');
                                // find form for accountstatement
                                await frame.waitForSelector('#ACCOUNT_NO').then(() => 
                                    console.log('LOG : all page loaded')
                                );

                                await frame.select('#ACCOUNT_NO', no_rekening);
                                console.log("INPUT : Input rekening in form..");
                                // pilih type periode transaksi
                                await frame.type('#VIEW_TYPE2', '2');
                                // transaksi dari tanggal
                                await frame.select('select[name="DDAY1"]', day);
                                console.log("INPUT : Input day in form..");
                                await frame.select('select[name="DMON1"]', month);
                                console.log("INPUT : Input month in form..");
                                await frame.select('select[name="DYEAR1"]', year);
                                console.log("INPUT : Input year in form..");
                                // transaksi sampai tanggal
                                await frame.select('select[name="DDAY2"]', day);
                                await frame.select('select[name="DMON2"]', month);
                                await frame.select('select[name="DYEAR2"]', year);
                                await frame.click('input[name="submitButton"]', { timeout: timeout, waitUntil: 'domcontentloaded' });
                                console.log("SUBMIT : Submit form..");
                                console.log("LOG : Loading ajax progress after submit form mutasi");
                                try {
                                    const DataMutasi = await frame.evaluate(() => {
                                        const rows = document.querySelectorAll('#tabel-saldo > tbody > tr');
                                        const arr = Array.from(rows, row => {
                                            const columns = row.querySelectorAll('td');
                                            return Array.from(columns, column => column.innerText);
                                        }); 

                                        // data mutasi
                                        console.log("LOG : Generate mutasi data...");
                                        const ResDataMutasi = [];
                                        arr.forEach(function(data) {
                                            // column 1
                                            const date = data[0];
                                            const desc = data[1];
                                            const debet = data[2];
                                            const kredit = data[3];
                                            const saldo = data[4];

                                            if(desc === 'Saldo Awal' | desc === 'Total Mutasi' | desc === 'Saldo Akhir'){
                                                return;
                                            }

                                            if(debet.length > 0){
                                                var type      = 'debet';
                                                var jumlah    = debet.replace(",00", ".00");
                                            }
                                            else {
                                                var type      = 'kredit';
                                                var jumlah    = kredit.replace(",00", ".00");
                                            }

                                            ResDataMutasi.push({
                                                'date': date,
                                                'description': desc,
                                                'type': type,
                                                'jumlah': jumlah,
                                                'saldo': saldo.replace(",00", ".00")
                                            });
                                        });

                                        const rekeningData = document.querySelectorAll(".info1.rekkor > tbody > tr > td:nth-child(2)");
                                        // data rekening
                                        const nama_pemilik      = rekeningData[0].innerText.trim();
                                        const account_number    = rekeningData[1].innerText.trim();
                                        const mata_uang         = rekeningData[2].innerText.trim();
                                        const periode           = rekeningData[3].innerText.trim();
                                        const tanggal_mutasi    = rekeningData[4].innerText.trim();
                                        return {
                                            nama_pemilik: nama_pemilik,
                                            account_number: account_number,
                                            mata_uang: mata_uang,
                                            periode: periode,
                                            tanggal_mutasi: tanggal_mutasi,
                                            response: ResDataMutasi
                                        };
                                    });

                                    await logout(page,browser);
                                    return resolve(DataMutasi);

                                } catch (err) {
                                    console.log("LOG : " + err);
                                    await logout(page,browser);
                                    return reject(err);
                                }   
                            } catch (err) {
                                console.log("LOG : " + err);
                                await logout(page,browser);
                                return reject(err);
                            }
                        }
                        else {

                            if((await page.$('#errormsg-wrap')) !== null){

                                const error_msg = await page.evaluate(() => document.querySelector('h2.errorresp').innerText); 
                                const err = {
                                    status: 'ERROR',
                                    error_code: 104,
                                    error_message: error_msg
                                }
                                closeBrowser(browser);
                                return reject(err);
                            }
                            else {

                                await logout(page,browser);

                                const err = {
                                    status: 'ERROR',
                                    error_code: 105,
                                    error_message: 'Please try again...'
                                }

                                return reject(err);
                            }
                        }    
                    } catch (err) {
                        await logout(page,browser);
                        return reject(err);
                    }
                    

                }catch (e) {
                    console.log('LOG : cant load the page, maybe server is busy : ' + e);            
                    closeBrowser(browser);
                    return reject(e);
                }

            } catch (e) {
                console.log('LOG : cant load the page, maybe server is busy : ' + e);            
                return reject(e);
            }

        })();
    });

    async function logout(page, browser){
        if((await page.$('a[href="Logout.html"]')) !== null) {

            await page.click('a[href="Logout.html"]',{ timeout: timeout, waitUntil: 'load'});
            console.log("LOG : Logout account from ibri");                    
            page.on("dialog", async (dialog) => {
                console.log(dialog.message());
                await dialog.accept();
            });
        }

        closeBrowser(browser);
    }

    async function closeBrowser(browser){
        console.log("LOG : Close browser");
        await browser.close();
    }
}

