import db from "../utils/db";

type NovelInDetail = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelDesc: string;
  novelAuthor: string;
  novelAge: string;
  novelGenre: string;
  novelIsEnd: boolean;
  novelPlatform: string;
  novelPlatform2: string;
  novelPlatform3: string;
  novelUrl: string;
  novelUrl2: string;
  novelUrl3: string;
};

type Novel = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelAuthor: string;
  novelAge: string;
  novelGenre: string;
};

async function getNovelsByTheAuthor(novelAuthor: string) {
  const query =
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelAge, novelGenre FROM novelInfo WHERE novelAuthor = (?)";
  const novels = (await db(query, novelAuthor, "all")) as Novel[];
  return novels;
}

async function getNovel(novelId: string) {
  const query = "SELECT * FROM novelInfo WHERE novelId = (?)";
  const novel = (await db(query, novelId, "first")) as NovelInDetail;
  return novel;
}

export default async function getNovelInDetail(novelId: string) {
  const novel = await getNovel(novelId);

  const novelsPublishedByTheAuthor = await getNovelsByTheAuthor(novel.novelAuthor);

  return {
    novel,
    novelsPublishedByTheAuthor,
  };
}
