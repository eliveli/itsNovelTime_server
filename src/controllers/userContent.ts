import { RequestHandler } from "express";

import dotenv from "dotenv";
import getUserId from "../services/shared/getUserId";
import userWritingService from "../services/userContent/writings";
import userCommentService from "../services/userContent/comments";
import novelListSummaryService from "../services/userContent/novelListSummary";
import novelListDetailedService from "../services/userContent/novelListDetailed";
import myNovelListService from "../services/userContent/myNovelList";
import toggleLike from "../services/shared/toggleLike";

dotenv.config();

export const userHomeController: RequestHandler = (async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);

    if (!userId) throw new Error("유저 없음");
    const { talksUserCreated, recommendsUserCreated } =
      await userWritingService.getWritingsUserCreatedForUserHome(userId);
    const { talksUserLikes, recommendsUserLikes } =
      await userWritingService.getWritingsUserLikedForUserHome(userId);
    const commentsUserCreated = await userCommentService.getCommentsForUserHome(userId);
    const listsUserCreated = await novelListSummaryService.getListsUserCreated(userId, true);
    const listsUserLikes = await novelListSummaryService.getListsUserLiked(userId, true);

    res.json({
      talksUserCreated,
      recommendsUserCreated,
      talksUserLikes,
      recommendsUserLikes,
      commentsUserCreated,
      novelLists: {
        listsUserCreated,
        listsUserLikes,
      },
    });
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json({ message: "존재하지 않는 사용자입니다." });
    }
    console.log("failed to get user's content in userHomeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getWritingUserCreatedController: RequestHandler = (async (req, res) => {
  try {
    const { userName, contentType, order } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");
    if (contentType === "T" || contentType === "R") {
      const { talksOrRecommendsSet, isNextOrder } = await userWritingService.getWritingsUserCreated(
        userId,
        contentType,
        Number(order),
      );
      res.json({ writingsUserCreated: talksOrRecommendsSet, isNextOrder });
    }

    if (contentType === "C") {
      const { commentsSet, isNextOrder } = await userCommentService.getComments(
        userId,
        Number(order),
      );
      res.json({
        commentsUserCreated: commentsSet,
        isNextOrder,
      });
    }
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json({ message: "존재하지 않는 사용자입니다." });
    }
    console.log("failed to get user's content in userMyWritingController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getWritingUserLikedController: RequestHandler = (async (req, res) => {
  try {
    const { userName, contentType, order } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");
    const { talksOrRecommendsSet, isNextOrder } = await userWritingService.getWritingsUserLiked(
      userId,
      contentType as "T" | "R",
      Number(order),
    );
    res.json({ writingsUserLikes: talksOrRecommendsSet, isNextOrder });
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json({ message: "존재하지 않는 사용자입니다." });
    }
    console.log("failed to get user's content in userOthersWritingController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getListUserCreatedController: RequestHandler = (async (req, res) => {
  try {
    const { userName, listId, order } = req.params;
    const loginUserId = req.userId;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");

    const data = await novelListDetailedService.getListUserCreated(
      userId,
      listId,
      Number(order),
      loginUserId,
    );

    res.json(data);
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json({ message: "존재하지 않는 사용자입니다." });
    }
    console.log("failed to get user's content in getListUserCreatedController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getListUserLikedController: RequestHandler = (async (req, res) => {
  try {
    const { userName, listId, order } = req.params;
    const loginUserId = req.userId;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");

    const data = await novelListDetailedService.getListUserLiked(
      userId,
      listId,
      Number(order),
      loginUserId,
    );

    res.json(data);
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json({ message: "존재하지 않는 사용자입니다." });
    }
    console.log("failed to get user's content in getListUserLikedController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getNovelListTitlesController: RequestHandler = (async (req, res) => {
  try {
    const { userName, isCreated } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("유저 없음");

    const data = await novelListDetailedService.getAllListTitles(userId, isCreated);

    res.json(data);
  } catch (error: any) {
    if (error.message === "유저 없음") {
      res.status(400).json({ message: "존재하지 않는 사용자입니다." });
    }
    console.log("failed to get user's content in getNovelListTitlesController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getAllListSummaryUserCreatedController: RequestHandler = (async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("user doesn't exist");

    const lists = await novelListSummaryService.getListsUserCreated(userId);

    res.json(lists);
  } catch (error: any) {
    console.log("failed to get user's content in getAllListSummaryUserCreatedController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getAllListSummaryUserLikedController: RequestHandler = (async (req, res) => {
  try {
    const { userName } = req.params;
    const userId = await getUserId(userName);
    if (!userId) throw new Error("user doesn't exist");

    const lists = await novelListSummaryService.getListsUserLiked(userId);

    res.json(lists);
  } catch (error: any) {
    console.log("failed to get user's content in getAllListSummaryUserLikedController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const getMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const loginUserId = req.userId;
    const { novelId } = req.params;

    if (!loginUserId) {
      res.status(400).json("유효하지 않은 사용자입니다");
      return;
    }
    if (!novelId) {
      throw Error("novel id was not given");
    }

    const myNovelLists = await myNovelListService.getMyList(loginUserId, novelId);

    res.json(myNovelLists);
  } catch (error: any) {
    console.log("failed to get user's content in getMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const createMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const { listTitle } = req.body;

    const loginUserId = req.userId;

    if (!listTitle || !loginUserId) {
      throw Error("some value doesn't exist");
    }

    const listId = await myNovelListService.createMyList(listTitle as string, loginUserId);

    res.json({ listId });
  } catch (error: any) {
    console.log("failed to create user's content in createMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const changeListTitleController: RequestHandler = (async (req, res) => {
  try {
    const { listId, listTitle } = req.body;

    if (!listId || !listTitle) {
      throw Error("some value doesn't exist");
    }

    await myNovelListService.changeListTitle(listId as string, listTitle as string);

    res.json("your novel list title was changed successfully");
  } catch (error: any) {
    console.log("failed to change user's content in changeListTitleController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const removeMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const { listId } = req.body;

    if (!listId) {
      throw Error("list id wasn't given");
    }

    await myNovelListService.removeMyList(listId as string);

    res.json("your novel list was removed successfully");
  } catch (error: any) {
    console.log("failed to remove user's content in removeMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const addOrRemoveNovelInListController: RequestHandler = (async (req, res) => {
  try {
    const loginUserId = req.userId;
    if (!loginUserId) {
      res.status(400).json("유효하지 않은 사용자입니다");
      return;
    }

    const { novelId, listIDsToAddNovel, listIDsToRemoveNovel } = req.body;

    if (!novelId || !listIDsToAddNovel || !listIDsToRemoveNovel) {
      throw Error("some value doesn't exist");
    }
    if (typeof listIDsToAddNovel !== "object" || typeof listIDsToRemoveNovel !== "object") {
      throw Error("listIDs is not string array");
    }

    await myNovelListService.addOrRemoveNovelInList(
      novelId as string,
      listIDsToAddNovel as string[],
      listIDsToRemoveNovel as string[],
    );

    res.json("novel was added or removed in your lists successfully");
  } catch (error: any) {
    console.log("failed to add user's content in addNovelToMyNovelListController :", error);
    res.status(500).end();
  }
}) as RequestHandler;

export const removeNovelFromMyNovelListController: RequestHandler = (async (req, res) => {
  try {
    const { listId, novelIDs } = req.body;

    if (!listId || !novelIDs) {
      throw Error("some value doesn't exist");
    }
    if (typeof novelIDs !== "object") {
      throw Error("novelIDs is not string array");
    }

    await myNovelListService.removeNovelFromMyList(listId as string, novelIDs as string[]);

    res.json("novels were removed from your list successfully");
  } catch (error: any) {
    console.log(
      "failed to remove novels from list in removeNovelFromMyNovelListController :",
      error,
    );
    res.status(500).end();
  }
}) as RequestHandler;

export const toggleLikeController: RequestHandler = (async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const loginUserId = req.userId;

    const { isLike, likeNo } = await toggleLike(
      contentType as "writing" | "novelList",
      contentId,
      loginUserId as string,
    );
    if (isLike === undefined) throw new Error("error occurred as toggling LIKE");

    res.json({ isLike, likeNo });
  } catch (error: any) {
    console.log("failed to toggle Like in toggleLikeController :", error);
    res.status(500).end();
  }
}) as RequestHandler;
