// ref page: https://toidicodedao.com/2018/09/04/project-luyen-tap-ki-nang-lap-trinh/

import puppeteer, { Page } from "puppeteer";

const browser = await puppeteer.launch();

const parseOnePage = async (url: string, page: Page) => {
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
    const publishedTime = await page.$eval(".date", (el: HTMLElement) => {
      return el.innerText;
    });

    const title = await page.$eval(".title-detail", (el: HTMLElement) => {
      return el.innerText;
    });

    const description = await page.$eval(".title-detail + .description", (el: HTMLElement) => el.innerText);

    const content = await page.$eval(".fck_detail", (listEl) => {
      return Array.from(listEl.children).map((el: HTMLElement) => {
        if (el === listEl.lastElementChild) return `authour - ${el.innerText}`;
        switch (el.className.split(" ")[0]) {
          case "Normal":
            return `${el.tagName} - ${el.innerText}`;
          case "tplCaption":
            return `img - [placeHolder]`;
          default:
            return null;
        }
      });
    });

    const articlePhotos = await page.$$eval(".fck_detail .fig-picture > img", (listEl) => {
      return Array.from(listEl).map((el: HTMLImageElement) => {
        return {
          url: el.src,
          alt: el.alt,
        };
      });
    });
    console.log(title);
    return {
      publishedTime,
      title,
      description,
      content,
      photos: articlePhotos,
    };
  } catch (error) {
    console.log(error.message);
  }
};

const vnExpressSession = async () => {
  const page = await browser.newPage();
  await page.goto("https://vnexpress.net/");
  const homePageArticlesUrl = await page.$$eval("h3.title-news", (listEl) => {
    const urls = [];
    for (const el of listEl) {
      urls.push(el.getElementsByTagName("a")[0].href);
    }
    return urls;
  });
  return homePageArticlesUrl;
};

const urls = await vnExpressSession();

const filteredUrls = urls.filter((url) => url.startsWith("https://vnexpress.net/"));

for (const url of filteredUrls) {
  const page = await browser.newPage();
  await parseOnePage(url, page);
  await page.close();
}

await browser.close();
