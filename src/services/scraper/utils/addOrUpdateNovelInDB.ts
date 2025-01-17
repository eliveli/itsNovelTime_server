import puppeteer, { SerializableOrJSHandle } from "puppeteer";
import { setNovel } from "../../novel/novels";
import db from "../../utils/db";
import removeLabelsFromTitle from "./removeLabelsFromTitle";
import getCurrentTime from "../../utils/getCurrentTime";
import { NovelPlatform } from "./types";

type SeveralNovelInfo = {
  novelTitle: string;
  novelAuthor: string;
  novelUrl: string;
  isBL: boolean;
};

type NovelUrlAndTitle = {
  novelUrl: string;
  novelTitle: string;
};

type NewNovelPages = Array<{
  platform: string;
  url: string;
}>;

type NovelForChecking = {
  novelId: string;
  novelTitle: string;
  novelAuthor: string;
  novelPlatform: string;
  novelPlatform2: string;
  novelPlatform3: string;
  novelUrl: string;
  novelUrl2: string;
  novelUrl3: string;
};

const selectorsOfNovelPage = {
  // this is often changed in its platform
  kakape: {
    img: "#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div.flex.h-full.flex-1 > div.mb-28pxr.flex.w-320pxr.flex-col > div:nth-child(1) > div.w-320pxr.css-0 > div > div.css-0 > div.mx-auto.css-u4ybgy > div > div > img",
    title:
      "#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div.flex.h-full.flex-1 > div.mb-28pxr.flex.w-320pxr.flex-col > div:nth-child(1) > div.w-320pxr.css-0 > div > div.css-0 > div.relative.text-center.mx-32pxr.py-24pxr > span",
    desc: "#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div.flex.h-full.flex-1 > div.mb-28pxr.ml-4px.flex.w-632pxr.flex-col > div.flex-1.bg-bg-a-20 > div.text-el-60.py-20pxr.pt-31pxr.pb-32pxr > span",
    age: "#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div.flex.h-full.flex-1 > div.mb-28pxr.ml-4px.flex.w-632pxr.flex-col > div.flex-1.bg-bg-a-20 > div.flex.pr-32pxr > div:nth-child(1) > div.mt-16pxr.px-32pxr > div:nth-child(3) > div",
    author:
      "#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div.flex.h-full.flex-1 > div.mb-28pxr.ml-4px.flex.w-632pxr.flex-col > div.flex-1.bg-bg-a-20 > div.flex.pr-32pxr > div:nth-child(2) > div.mt-16pxr.px-32pxr > div > div",
    genre:
      "#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div.flex.h-full.flex-1 > div.mb-28pxr.flex.w-320pxr.flex-col > div:nth-child(1) > div.w-320pxr.css-0 > div > div.css-0 > div.relative.text-center.mx-32pxr.py-24pxr > div.mt-16pxr.flex.items-center.justify-center.text-el-60.all-child\\:font-small2 > span:last-child",
    isEnd:
      "#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div.flex.h-full.flex-1 > div.mb-28pxr.flex.w-320pxr.flex-col > div:nth-child(1) > div.w-320pxr.css-0 > div > div.css-0 > div.relative.text-center.mx-32pxr.py-24pxr > div.flex.items-center.justify-center.mt-4pxr.flex-col.text-el-50.opacity-100.all-child\\:font-small2 > div:nth-child(1) > span",
  },

  series: {
    // use descendant selector (don't use ">" in front of "img")
    // because there can be different selector
    // such as "#container > div.aside.NE\\=a\\:nvi > span >  img"
    //    and  "#container > div.aside.NE\\=a\\:nvi >   a  > img"
    img: "#container > div.aside.NE\\=a\\:nvi   img",

    title: "#content > div.end_head > h2",

    desc: {
      parent: "#content > div.end_dsc",
      child1: "#content > div.end_dsc > div:nth-child(1)",
      child2: "#content > div.end_dsc > div:nth-child(2)",
    },

    age: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:last-child",

    author: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:nth-child(3) > a",

    genre: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:nth-child(2) > span > a",

    isEnd: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:nth-child(1) > span",
  },
  ridi: {
    img: "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img",

    title:
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div.info_title_wrap > h1",

    desc: "article.detail_box_module.detail_introduce_book #introduce_book > p",

    // 성인 작품 제외
    age: "#notice_component > ul > li",

    author:
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_writer > span > a",

    genre:
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > p",

    isEnd:
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_info_series_complete_wrap > span.metadata_item.not_complete",
  },
  joara: {
    img: "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-mid > div.cover-col > img",

    title:
      "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-top > div.title-wrap > div.title-col",

    keywords:
      "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-bottom > div > div.content-col.keyword",
    desc: "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-mid > div.intro-col",

    iconForAge19:
      "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-mid > div.cover-col > img.ic-adult",

    author:
      "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-top > div.writer > div",

    genre:
      "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-top > div.category > span:nth-child(1)",

    iconsIncludingEnd:
      "#root > div > div.subpage-container.work-detail > div.content-info.pc-content-info > div.pc-info-top > div.icon-tag > img",
    endIcon: "https://cf.joara.com/book_icon/mobile_pc_icon_v2_e.png",
  },
};

async function getInfo(
  page: puppeteer.Page,
  selector: string,
  instruction?: "attr" | "html",
  attributeName = "",
) {
  try {
    const infoElement = await page.waitForSelector(selector);

    const info: string = await page.evaluate(
      (element, instr, attrName) => {
        if (instr === "attr") {
          return element.getAttribute(attrName);
        }

        if (instr === "html") {
          return element.innerHTML;
        }

        return element.innerText;
      },
      infoElement,
      instruction as SerializableOrJSHandle,
      attributeName as SerializableOrJSHandle,
    );
    return info;
  } catch (err: any) {
    console.log(err);
    return undefined; // for when there is no certain node
  }
}

async function getImg(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return await getInfo(page, selectorsOfNovelPage.kakape.img, "attr", "src");
  }
  if (novelPlatform === "네이버 시리즈") {
    return await getInfo(page, selectorsOfNovelPage.series.img, "attr", "src");
  }
  if (novelPlatform === "리디북스") {
    return await getInfo(page, selectorsOfNovelPage.ridi.img, "attr", "src");
  }
  if (novelPlatform === "조아라") {
    return await getInfo(page, selectorsOfNovelPage.joara.img, "attr", "src");
  }
}

async function getTitle(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  selectorOfTitle: string,
) {
  try {
    if (novelPlatform === "네이버 시리즈") {
      // 제목 앞에 추가정보(from some icon) 붙은 경우 제외하고 가져오기
      const titleElement = await page.waitForSelector(selectorOfTitle, { timeout: 5000 });
      // timeout 5초로 시간 절약
      // : 비로그인 상태에서 19세 작품 페이지 조회 시 실패하므로
      //   특히 네이버 시리즈 (로그인페이지 나옴)

      return (await page.evaluate((element) => {
        if (element.childNodes.length !== 1) {
          const beforeTitle = element.children[0].innerText;
          return element.innerText.slice(beforeTitle.length);
        }
        return element.innerText;
      }, titleElement)) as string;
    }

    return await getInfo(page, selectorOfTitle);
  } catch (err) {
    console.log(err);
  }
}

async function getDescFromPageForRidi(page: puppeteer.Page) {
  const descElement = await page.waitForSelector(
    "article.detail_box_module.detail_introduce_book #introduce_book > p",
  );

  return await page.evaluate((element) => {
    // 첫 줄에 제목 + 로맨스 가이드 있을 때 그 부분 제외
    if (
      element.children[0].tagName === "SPAN" &&
      element.innerText.includes(">\n로맨스 가이드\n\n")
    ) {
      const idxForSettingStart: number = element.innerText.indexOf(">\n로맨스 가이드\n\n");
      return element.innerText.slice(idxForSettingStart + 11);
    }
    // 첫 줄 제목 제외
    if (
      element.children[0].tagName === "SPAN" &&
      (element.children.length === 1 || element.children[1].tagName !== "IMG")
    ) {
      const idxForSettingStart: number = element.innerText.indexOf(">\n");
      return element.innerText.slice(idxForSettingStart + 2);
    }
    // 첫 줄에 제목, 둘째 줄에 이미지, 셋째 넷째 비어있을 때 제외
    if (
      element.children[0].tagName === "SPAN" &&
      element.children[1].tagName === "IMG" &&
      element.children[2].tagName === "BR" &&
      element.children[3].tagName === "BR"
    ) {
      const idxForSettingStart: number = element.innerText.indexOf(">\n\n\n");
      return element.innerText.slice(idxForSettingStart + 4);
    }
    return "";
  }, descElement);
}

async function getKeywordsForRidi(page: puppeteer.Page) {
  return await page.evaluate(() => {
    const keywordList = document.querySelectorAll(
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_box_module.detail_keyword.js_detail_keyword_module > ul > li",
    );
    let keywordSet = "";

    filterKeyword: for (let i = 0; i < keywordList.length; i += 1) {
      const keyword = keywordList[i].textContent;
      if (keyword === null) {
        throw new Error("키워드가 없는데도 반복문 실행됨");
      }
      const exceptKeys = [
        "만원",
        "3000",
        "리뷰",
        "별점",
        "평점",
        "연재",
        "단행본",
        "무료",
        "2013",
        "2015",
        "권이하",
        "년출간",
      ];
      for (let j = 0; j < exceptKeys.length; j += 1) {
        if (keyword.includes(exceptKeys[j])) continue filterKeyword;
        if (exceptKeys[j] === exceptKeys[exceptKeys.length - 1]) {
          keywordSet += `${keyword} `;
        }
      }
    }
    return keywordSet;
  });
}

async function getKeywordsForJoara(page: puppeteer.Page) {
  const keywordsFromPage = await getInfo(page, selectorsOfNovelPage.joara.keywords);
  if (!keywordsFromPage) return;

  const keywords = `#${keywordsFromPage.replace(/\n/g, " #")}`;

  return keywords;
}

export async function getDesc(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return await getInfo(page, selectorsOfNovelPage.kakape.desc);
  }

  if (novelPlatform === "네이버 시리즈") {
    const parentDescElement = await page.waitForSelector(selectorsOfNovelPage.series.desc.parent);
    const childrenLengthOfDesc = await page.evaluate(
      (element) => element.children.length,
      parentDescElement,
    );

    // if there is not a more-button of desc
    if (childrenLengthOfDesc === 1) {
      return await getInfo(page, selectorsOfNovelPage.series.desc.child1);
    }

    // if there is a more-button of desc
    await page.waitForSelector(selectorsOfNovelPage.series.desc.child2);

    const descriptionWithOtherTag = await getInfo(page, selectorsOfNovelPage.series.desc.child2);
    if (!descriptionWithOtherTag) return;

    // beforeTextOfDesc is : \n\t\t\t\t\t\t\t
    const afterIndexOfDesc = descriptionWithOtherTag.indexOf("\n\t\t\t\t\t\t접기");

    const desc = descriptionWithOtherTag.slice(8, afterIndexOfDesc);

    return desc;

    // this is the old way I used before how to get desc info //
    // // get desc : [더보기] 여부에 따라
    // const descElement = await page.waitForSelector("#content > div.end_dsc > div:nth-child(1)");
    // const _desc = await page.evaluate((descElement) => descElement.innerText, descElement);
    // // [더보기] 버튼 있을 때 상세정보 받아오기
    // if (_desc.slice(-3) === "더보기") {
    //   await page.click("#content > div.end_dsc > div:nth-child(1) span > a");
    //   await page.waitForSelector("#content > div.end_dsc.open > div:nth-last-child(1)");
    //   const moreDescElement = await page.waitForSelector(
    //     "#content > div.end_dsc > div:nth-last-child(1)",
    //   );
    //   const desc = await page.evaluate(
    //     (moreDescElement) => moreDescElement.innerText,
    //     moreDescElement,
    //   );
    //   novelInfo.novelDesc = desc.slice(0, -3); // '접기' 글자 제외
    // }
    // // [더보기] 없을 때 기존 정보 할당
    // else {
    //   novelInfo.novelDesc = _desc;
    // }
  }

  if (novelPlatform === "리디북스") {
    const desc: string = await getDescFromPageForRidi(page);

    const keywords = await getKeywordsForRidi(page);

    // set desc only : 기존 작품소개에 키워드가 포함되어 있거나 받아온 키워드가 없다면
    if (desc.includes("#") || desc.includes("키워드") || keywords === "") {
      return desc;
    }
    // set desc with keywords
    return `${keywords}\n\n${desc}`;
  }

  if (novelPlatform === "조아라") {
    const desc = await getInfo(page, selectorsOfNovelPage.joara.desc);
    if (!desc) return;

    // when desc includes keywords
    if (desc.includes("#") || desc.includes("[") || desc.includes("키워드")) return desc;

    const keywords = await getKeywordsForJoara(page);

    if (!keywords) return desc;

    return `${keywords}\n\n${desc}`;
  }
}

async function getAge(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return await getInfo(page, selectorsOfNovelPage.kakape.age);
  }
  if (novelPlatform === "네이버 시리즈") {
    return await getInfo(page, selectorsOfNovelPage.series.age);
  }
  if (novelPlatform === "리디북스") {
    const notification = await getInfo(page, selectorsOfNovelPage.ridi.age);
    if (notification === undefined) return;

    if (notification.includes("15세")) return "15세 이용가";
    if (notification.includes("12세")) return "12세 이용가";
    return "전체 이용가";
  }
  if (novelPlatform === "조아라") {
    const adultElement = await page.evaluate(
      (element) => document.querySelector(element),
      selectorsOfNovelPage.joara.iconForAge19, // 표지 위 19금 아이콘
    );
    return adultElement !== null ? "청소년 이용불가" : "전체 이용가";
  }
}

function divideGenreForRidi(genre: string) {
  if (genre.includes("로판")) return "로판";
  if (genre.includes("로맨스")) return "로맨스";
  if (genre.includes("무협")) return "무협";
  if (genre.includes("라이트노벨")) return "라이트노벨";
  if (genre.includes("BL")) return "BL";
  if (genre.includes("현대") || genre.includes("게임") || genre.includes("스포츠")) {
    return "현판";
  }
  if (genre.includes("판타지")) return "판타지";
  return `extra|${genre}`;
}

function divideGenreForJoara(genre: string) {
  if (genre.includes("패러디")) return "패러디";
  if (genre.includes("로판")) return "로판";
  if (genre.includes("로맨스")) return "로맨스";
  if (genre.includes("게임") || genre.includes("스포츠")) return "현판";
  if (genre.includes("판타지") || genre.includes("퓨전") || genre.includes("역사")) return "판타지";
  if (genre.includes("무협")) return "무협";
  if (genre.includes("라이트노벨")) return "라이트노벨";
  if (genre.includes("BL")) return "BL";
  return `extra|${genre}`;
}

async function getGenre(page: puppeteer.Page, novelPlatform: NovelPlatform, isBL: boolean) {
  if (novelPlatform === "카카오페이지") {
    if (isBL) {
      return "BL";
    }
    return await getInfo(page, selectorsOfNovelPage.kakape.genre);
  }
  if (novelPlatform === "네이버 시리즈") {
    return await getInfo(page, selectorsOfNovelPage.series.genre);
  }
  if (novelPlatform === "리디북스") {
    const genre = await getInfo(page, selectorsOfNovelPage.ridi.genre);
    if (!genre) return;

    return divideGenreForRidi(genre);
  }
  if (novelPlatform === "조아라") {
    const genre = await getInfo(page, selectorsOfNovelPage.joara.genre);
    if (!genre) return;

    return divideGenreForJoara(genre);
  }
}

//  -- check novel image in db and make sure that img is saved as small size in DB
//     to reduce time when downloading image
//     only send image as big size when it is needed especially when showing the full image
//       to do remove the following in the end of the img src when needed : "&filename=th3"
//

async function searchForEndIconForJoara(page: puppeteer.Page) {
  return await page.evaluate(
    (icons, endIcon) => {
      const iconList = document.querySelectorAll(icons);
      if (iconList === null) return false; // when there is no icon

      for (let i = 0; i < iconList.length; i += 1) {
        if (iconList[i].getAttribute("src") === endIcon) {
          return true; // when there is an end icon
        }
      }
      return false; // when there is not an end icon
    },
    selectorsOfNovelPage.joara.iconsIncludingEnd,
    selectorsOfNovelPage.joara.endIcon,
  );
}

async function getIsEnd(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    const checkingEnd = await getInfo(page, selectorsOfNovelPage.kakape.isEnd);
    if (!checkingEnd) return;

    if (checkingEnd.includes("완결")) {
      return true;
    }
    return false;
  }

  if (novelPlatform === "네이버 시리즈") {
    const checkingEnd = await getInfo(page, selectorsOfNovelPage.series.isEnd);
    if (!checkingEnd) return;

    if (checkingEnd.includes("완결")) {
      return true;
    }
    return false;
  }

  if (novelPlatform === "리디북스") {
    const isEnd = await page.evaluate((selectorOfIsEnd) => {
      const notEndElement = document.querySelector(selectorOfIsEnd);
      return notEndElement === null;
    }, selectorsOfNovelPage.ridi.isEnd);
    return isEnd;
  }

  if (novelPlatform === "조아라") {
    return await searchForEndIconForJoara(page);
  }
}

export async function searchForNovelsByTitleAndAuthor(novelTitle: string, novelAuthor: string) {
  return (await db(
    `SELECT novelId, novelTitle, novelAuthor, novelPlatform, novelPlatform2, novelPlatform3, novelUrl, novelUrl2, novelUrl3 FROM novelInfo
    WHERE novelTitle LIKE (?) AND novelAuthor = (?)`,
    [`%${novelTitle}%`, novelAuthor],
    "all",
  )) as Array<NovelForChecking>;
}

export async function addNewNovel(
  page: puppeteer.Page,
  severalNovelInfo: SeveralNovelInfo,
  novelPlatform: NovelPlatform,
) {
  // don't add this novel into DB
  //  if I can't get its certain info from detail page
  //  just return undefined and continue loop for getting a next novel
  const novelImg = await getImg(page, novelPlatform);
  if (!novelImg) throw Error("can't get this novel");

  const novelDesc = await getDesc(page, novelPlatform);
  if (!novelDesc) throw Error("can't get this novel");

  const novelAge = await getAge(page, novelPlatform);
  if (!novelAge) throw Error("can't get this novel");

  const novelGenre = await getGenre(page, novelPlatform, severalNovelInfo.isBL);
  if (!novelGenre) throw Error("can't get this novel");

  const novelIsEnd = await getIsEnd(page, novelPlatform);
  if (novelIsEnd === undefined) throw Error("can't get this novel");

  const novelId = getCurrentTime();
  const { novelAuthor, novelTitle, novelUrl } = severalNovelInfo;

  const novel = {
    novelId,
    novelImg,
    novelTitle,
    novelDesc,
    novelAuthor,
    novelAge,
    novelGenre,
    novelIsEnd,
    novelPlatform,
    novelUrl,
  };

  await setNovel(novel);

  return novelId;
}

function findSameNovelsFromTitlesWithLabels(
  existingNovelsInDB: NovelForChecking[],
  novelTitleWithoutLabels: string,
) {
  const sameNovelsInDB = [];
  // 찾은 소설을 조회하며 제목에서 라벨 떼고
  //  현재 플랫폼에서 읽어 온 소설 제목에서 라벨 뗀 것과 일치하는 지 확인
  //   일치할 경우 배열을 구성해 같은 소설의 정보로 취급
  for (const existingNovel of existingNovelsInDB) {
    const novelTitleWithoutLabelsInDB = removeLabelsFromTitle(existingNovel.novelTitle);

    if (novelTitleWithoutLabels === novelTitleWithoutLabelsInDB) {
      sameNovelsInDB.push(existingNovel);
    }
  }
  return sameNovelsInDB;
}

function getSelectorsByPlatform(novelPlatform: NovelPlatform) {
  let selectorOfTitle = "";
  let selectorOfAuthor = "";

  if (novelPlatform === "카카오페이지") {
    selectorOfTitle = selectorsOfNovelPage.kakape.title;
    selectorOfAuthor = selectorsOfNovelPage.kakape.author;
  }
  if (novelPlatform === "네이버 시리즈") {
    selectorOfTitle = selectorsOfNovelPage.series.title;
    selectorOfAuthor = selectorsOfNovelPage.series.author;
  }
  if (novelPlatform === "리디북스") {
    selectorOfTitle = selectorsOfNovelPage.ridi.title;
    selectorOfAuthor = selectorsOfNovelPage.ridi.author;
  }
  if (novelPlatform === "조아라") {
    selectorOfTitle = selectorsOfNovelPage.joara.title;
    selectorOfAuthor = selectorsOfNovelPage.joara.author;
  }

  return { selectorOfTitle, selectorOfAuthor };
}

export async function goToDetailPage(
  page: puppeteer.Page,
  novelUrl: string,
  novelPlatform: NovelPlatform,
) {
  try {
    // - wait longer in joara only as setting { waitUntil: "networkidle0" }
    // - in other platforms it's okay to set "domcontentloaded"
    //    to reduce time for scrapping one novel
    //    "networkidle0" requires more time but it is necessary for joara
    if (novelPlatform === "조아라") {
      await page.goto(`${novelUrl}`, { waitUntil: "networkidle0" });
      return;
    }

    if (novelPlatform === "카카오페이지") {
      // 상세페이지의 '작품소개' 탭에서 정보 읽기
      // waitUntil option to wait for elements loading
      await page.goto(`${novelUrl}?tab_type=about`, { waitUntil: "domcontentloaded" });
      return;
    }

    await page.goto(`${novelUrl}`, { waitUntil: "domcontentloaded" });
  } catch (err) {
    console.log(err);
  }
}

export async function getSameNovelsAndSeveralInfo(
  page: puppeteer.Page,
  novelUrl: string,
  novelPlatform: NovelPlatform,
) {
  try {
    await goToDetailPage(page, novelUrl, novelPlatform);

    const { selectorOfTitle, selectorOfAuthor } = getSelectorsByPlatform(novelPlatform);

    const novelTitleFromPage = await getTitle(page, novelPlatform, selectorOfTitle);
    if (!novelTitleFromPage) throw Error("can't get this novel when getting novel title");

    // 조아라 소설일 때는 제목 태그 안 뗌
    //  : 패러디 장르의 경우 제목 앞에 [ ] 태그를 붙이는 게 일반적이기 때문
    const novelTitleWithoutLabels =
      novelPlatform !== "조아라" ? removeLabelsFromTitle(novelTitleFromPage) : novelTitleFromPage;

    const novelAuthor = await getInfo(page, selectorOfAuthor);
    if (!novelAuthor) throw Error("can't get this novel when getting novel author");

    // 라벨 뗀 문구가 포함된 제목으로 소설 검색 in DB
    // get novels that have titles including text without labels in them
    const existingNovelsInDB = await searchForNovelsByTitleAndAuthor(
      novelTitleWithoutLabels,
      novelAuthor,
    );

    const sameNovelsInDB = findSameNovelsFromTitlesWithLabels(
      existingNovelsInDB,
      novelTitleWithoutLabels,
    );

    const isBL = novelTitleFromPage.includes("[BL]"); // only for kakape platform

    const severalNovelInfo = {
      novelTitle: novelTitleWithoutLabels,
      novelAuthor,
      novelUrl,
      isBL,
    };
    return { sameNovelsInDB, severalNovelInfo };
  } catch (err: any) {
    console.log(err);
  }
}

async function updateNovel(
  novelId: string,
  newNovelPages: NewNovelPages,
  novelTitleWithoutLabels: string,
) {
  await db(
    "UPDATE novelInfo SET novelTitle = (?), novelPlatform = (?), novelUrl = (?), novelPlatform2 = (?), novelUrl2 = (?), novelPlatform3 = (?), novelUrl3 = (?) WHERE novelId = (?)",
    [
      novelTitleWithoutLabels,
      newNovelPages[0].platform,
      newNovelPages[0].url,
      newNovelPages[1].platform,
      newNovelPages[1].url,
      newNovelPages[2].platform,
      newNovelPages[2].url,
      novelId,
    ],
  );
}

async function deleteSameNovel(novelId: string) {
  await db("DELETE FROM novelInfo WHERE novelId = (?)", [novelId]);
}
async function deleteSameNovels(novelIDs: Array<string>) {
  for (const novelId of novelIDs) {
    await deleteSameNovel(novelId);
  }
}

async function makeNovelOne(
  novelIDs: Array<string>,
  newNovelPages: NewNovelPages,
  novelTitleWithoutLabels: string,
) {
  const novelIdForUpdate = novelIDs[0];
  await updateNovel(novelIdForUpdate, newNovelPages, novelTitleWithoutLabels);

  if (novelIDs.length > 1) {
    const novelIDsForDelete = novelIDs.slice(1, novelIDs.length);

    await deleteSameNovels(novelIDsForDelete);
  }

  return novelIdForUpdate;
}

export async function updateNovelWithPlatform(
  novelUrlAndTitle: NovelUrlAndTitle,
  novelsInDB: NovelForChecking[],
  novelPlatform: NovelPlatform,
) {
  const novelPlatforms: Array<string> = [];
  const novelUrls: Array<string> = [];

  // check novel rows that has same title and author
  // get platform info that is not empty
  for (const novelPlatformPage of novelsInDB) {
    for (const { platform, url } of [
      { platform: novelPlatformPage.novelPlatform, url: novelPlatformPage.novelUrl },
      { platform: novelPlatformPage.novelPlatform2, url: novelPlatformPage.novelUrl2 },
      { platform: novelPlatformPage.novelPlatform3, url: novelPlatformPage.novelUrl3 },
    ]) {
      if (platform) {
        novelPlatforms.push(platform);
        novelUrls.push(url);
      }
    }
  }

  // remove duplicate platform info
  const newNovelPages = novelPlatforms
    .map((platform, index) => {
      if (novelPlatforms.indexOf(platform) === index) {
        return { platform, url: novelUrls[index] };
      }
      return undefined;
    })
    // remove undefined item from the array made by map function
    .filter((platform) => !!platform) as NewNovelPages;

  // add the platform ridi if it is not in the table novelInfo of DB
  if (!novelPlatforms.includes(novelPlatform)) {
    newNovelPages.push({ platform: novelPlatform, url: novelUrlAndTitle.novelUrl });
  }

  // remove JOARA platform of the novel info if platform is more than 3
  //  typically I won't consider 조아라 in this case because that is popular as free platform
  //   just consider novel platforms up to 3
  if (novelPlatforms.length > 3 && novelPlatforms.includes("조아라")) {
    for (const [index, value] of newNovelPages.entries()) {
      if (value?.platform === "조아라") {
        newNovelPages.splice(index, 1);
        break;
      }
    }
  }

  // make newNovelPages array had 3 platforms and urls including empty string
  //  to deal with db when updating novel
  for (let i = newNovelPages.length; i < 3; i += 1) {
    newNovelPages.push({ platform: "", url: "" });
  }

  // update one novel
  //  and remove other novel rows if there was more than one novel row in DB
  //
  // make an array of novelID with the same novel
  const novelIDsWithSameNovel: Array<string> = [];
  for (const novel of novelsInDB) {
    novelIDsWithSameNovel.push(novel.novelId);
  }
  //
  // make same novels one and set title without labels and return the novel id
  const novelId = await makeNovelOne(
    novelIDsWithSameNovel,
    newNovelPages,
    novelUrlAndTitle.novelTitle,
  );

  return novelId;
}

// check whether the novel is in novelInfo table or not
// and add a new novel or update a novel as changing its platform and url info
// finally get the novel id
export default async function addOrUpdateNovelInDB(
  page: puppeteer.Page,
  novelUrl: string,
  novelPlatform: NovelPlatform,
) {
  try {
    const sameNovelsAndInfo = await getSameNovelsAndSeveralInfo(page, novelUrl, novelPlatform);

    if (!sameNovelsAndInfo) throw Error("can't get this novel");

    const { sameNovelsInDB, severalNovelInfo } = sameNovelsAndInfo;

    // when the novel is not in db //
    //  add new novel to novelInfo table
    if (sameNovelsInDB.length === 0) {
      const novelId = await addNewNovel(page, severalNovelInfo, novelPlatform);
      return novelId;
    }

    // when novel is in db //
    //  update the novel with its platform and url
    const novelUrlAndTitle = { novelUrl, novelTitle: severalNovelInfo.novelTitle };
    const novelId = await updateNovelWithPlatform(novelUrlAndTitle, sameNovelsInDB, novelPlatform);
    return novelId;
  } catch (err: any) {
    console.log(err);
  }
}
