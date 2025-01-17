import { Server } from "socket.io";
import http from "http";
import getRooms from "./services/getRooms";
import createRoom from "./services/createRoom";
import getMessages from "./services/getMessages";
import createMessage, { MessageWithSocket } from "./services/createMessage";
import changeMessageRead from "./services/changeMessageRead";

export default function socketIO(server: http.Server) {
  const io = new Server(server, { path: "/socket.io" });

  // { [userId: string] : socket.id } []
  const users: { [userId: string]: string } = {};

  io.on("connection", (socket) => {
    socket.on("join all rooms", async (userId: string) => {
      users[userId] = socket.id;

      const rooms = await getRooms(userId);

      rooms.forEach((room) => {
        socket.join(room.roomId);
        console.log("user joins the room:", room.roomId);
      });

      // send rooms to the user
      io.in(socket.id).emit("rooms", rooms);
    });

    socket.on("create a room", async (loginUserId: string, partnerUserName: string) => {
      try {
        const { room, partnerUserId, type } = await createRoom(partnerUserName, loginUserId);

        // join the room if the room was created just before
        if (type === "new") {
          socket.join(room.roomId);

          if (users[partnerUserId]) {
            // make the partner join if he/she logged in
            io.in(users[partnerUserId]).socketsJoin(room.roomId);
          }
        }

        // send new room to login user
        io.in(socket.id).emit("newRoom", { status: 200, data: room });
        // - partner user can know that he/she was invited to the room
        //    when the login user sends a message in the room

        console.log("new room is:", room);
        //
      } catch (error: any) {
        console.log(error);

        if (error.message === "user doesn't exist") {
          io.in(socket.id).emit("newRoom", {
            status: 400,
            error: { message: error.message },
          });
        } else {
          io.in(socket.id).emit("newRoom", {
            status: 500,
            error: { message: undefined },
          });
        }
      }
    });

    socket.on("get messages", async ({ roomId, userId }: { roomId: string; userId: string }) => {
      try {
        const data = await getMessages(roomId, userId);

        io.in(socket.id).emit("messages in the room", { status: 200, data });

        console.log("data from an event get-messages:", data);
        //
      } catch (error: any) {
        console.log(error);

        if (error.message === "room doesn't exist" || error.message === "user is not in the room") {
          io.in(socket.id).emit("messages in the room", {
            status: 400,
            error: { message: error.message },
          });
        } else {
          io.in(socket.id).emit("messages in the room", {
            status: 500,
            error: { message: undefined },
          });
        }
      }
    });

    socket.on("send message", async (data: MessageWithSocket) => {
      const messageToUser = await createMessage({ ...data });

      io.to(data.roomId).emit("new message", messageToUser);

      console.log("message was sent to the room:", data.roomId);
    });

    socket.on("change message read", async (messageId: string) => {
      await changeMessageRead(messageId);

      console.log("change message read");
    });

    socket.on("logout", async (userId: string) => {
      // leave all the room he/she joined
      io.in(socket.id).socketsLeave([...socket.rooms]); // socket.rooms holds socket id as a room

      // remove the user
      delete users[userId];

      console.log("user disconnected");
    });

    // when the page is refreshed or the user leaves the website
    // - user automatically leaves all the room he/she joined
    socket.on("disconnect", async (reason) => {
      // remove the user
      const [currentUser] = Object.entries(users).filter(
        ([userId, socketId]) => socketId === socket.id,
      );
      if (currentUser) {
        delete users[currentUser[0]];
      }

      console.log("user disconnected, reason:", reason);
    });

    console.log("socket connection fired");
  });

  return io;
}
