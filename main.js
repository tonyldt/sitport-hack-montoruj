const { app, BrowserWindow } = require('electron')
const pie = require("puppeteer-in-electron")
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

pie.initialize(app);

async function createWindow () {
  
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1152,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Open the DevTools.
  win.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const click = async (page, xpath, errorMessage) => {
    const element = await page.$x(xpath);

    if (element.length > 0) {
      await element[element.length-1].click();
    } else {
      console.log(errorMessage);
    }
}

const type = async (page, xpath, text) => {
    await page.focus(xpath)
    await page.keyboard.type(text);
}

const createClass = async (page) => {
    await page.waitForSelector('div[aria-label="Create or join a class"]');
    await click(page, '//div[@aria-label="Create or join a class"]', 'Plus button not found');
    await new Promise(r => setTimeout(r, 3000));
    await click(page, '//span[@aria-label="Create class"]', 'Create class not found');
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//div[@jsname="RsaxGc"]', 'Checkbox not found');
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//div[@class="uArJ5e UQuaGc kCyAyd l3F1ye ARrCac HvOprf evJWRb M9Bg4d"]', 'Continue not found');
    await new Promise(r => setTimeout(r, 1000));
    await type(page, 'input[aria-label="Class name (required)"]', "test classroom two");
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//div[@class="uArJ5e UQuaGc kCyAyd l3F1ye ARrCac HvOprf evJWRb M9Bg4d"]', "Classroom create button not found")
}

const addPeople = async (page) => {
    await page.waitForSelector('a[guidedhelpid="studentTab"]');
    await click(page, '//a[@class="iph-dialog-dismiss"]', "Click x doesn't work");
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//a[@guidedhelpid="studentTab"]', "People tab not found");
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//div[@aria-label="Invite students"]', "Add people not found");
    await new Promise(r => setTimeout(r, 1000));
    await type(page, 'input[aria-label="Type a name or email"]', 'test.jmularski+testing@gmail.com');
    await new Promise(r => setTimeout(r, 500));
    await click(page, '//div[@class="OE6hId J9fJmf"]', 'Input click didnt work');
    await new Promise(r => setTimeout(r, 500));
    await click(page, '//div[@data-id="EBS5u"]', "Invite didn't work");

}

const createMeet = async (page) => {
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//button[@jsname="SkMU8"]', 'Meeting not found');
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//li[@aria-label="Get a meeting link to share"]', "Get a meeting link");
    await new Promise(r => setTimeout(r, 5000));
    const link = await page.$x('//div[@jsname="DkF5Cf"]')
    return await page.evaluate(element => element.textContent, link[0]);
}

const goToEmail = async (page) => {
    await new Promise(r => setTimeout(r, 5000));
    await click(page, '//div[@aria-label="Select or deselect all student checkboxes"]', "Select all checkbox not found");
    await new Promise(r => setTimeout(r, 1000)); 
    await click(page, '//div[@class="U26fgb p0oLxb BEAGS tggdAd CG2qQ"]', 'Actions combo not found!');
    await new Promise(r => setTimeout(r, 1000));
    await click(page, '//span[@aria-label="Email"]', "Email button not found");
    await new Promise(r => setTimeout(r, 10000));
}

const sendEmail = async (page, meetingUrl) => {
  await type(page, 'input[placeholder="Subject"]', "Your classroom is having an online meeting!");
  await type(page, 'div[aria-label="Message Body"]', meetingUrl);
}

const main = async () => {
  const browser = await pie.connect(app, puppeteer);

  const window = new BrowserWindow();
  await window.loadURL("https://classroom.google.com/u/0/h");
 
  let page = await pie.getPage(browser, window);
  await createClass(page);
  await addPeople(page);

  const createdPageUrl = page.url();

  await window.loadURL("https://meet.google.com/landing");
  page = await pie.getPage(browser, window);
  const meetingUrl = await createMeet(page);
  
  await window.loadURL(createdPageUrl);
  page = await pie.getPage(browser, window);
  await goToEmail(page);
  const pages = await browser.pages();
  pages.forEach(page => {
      console.log(page.url())
  });
  await sendEmail(pages[3], meetingUrl)

  await new Promise(r => setTimeout(r, 30000));
};

const ipc = require('electron').ipcMain

ipc.on('start', function (event, arg) {
  main();
});