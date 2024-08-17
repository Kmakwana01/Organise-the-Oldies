import { chatCreate, chatDelete, chatUpdate } from "./controller/socketController";
let ioInstance:any;

export const io = async function(io : any) {

    ioInstance = io;

    io.on("connection", (socket : any) => {
        console.log("a user connected");

        socket.on("joinRoom", (roomId : any) => {
            socket.join(roomId.roomId);
            console.log(`User ${socket.id} joined room ${JSON.stringify(roomId)}`);
        });

        socket.on("chat", async (data : any) => {
            chatCreate(data , io, socket) 
        });

        socket.on("chatUpdate", async (data : any) => {
            chatUpdate(data , io, socket) 
        });

        socket.on("chatDelete", async (data : any) => {
            chatDelete(data , io, socket) 
        });

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    })
};

exports.broadcastChatAttachment = async function (response : any , familyId : any) {
    ioInstance.to(familyId).emit('chat', response);
};

exports.broadcastKeyInfo = async function (response : any , familyId : any) {
    ioInstance.to(familyId).emit('keyInfo', response);
};

exports.broadcastEvent = async function (response : any , familyId : any) {
    ioInstance.to(familyId).emit('event', response);
};

exports.broadcastMedicines = async function (response : any , familyId : any) {
    ioInstance.to(familyId).emit('medicines', response);
};

exports.broadcastReminder = async function (response : any , familyId : any) {
    ioInstance.to(familyId).emit('reminder', response);
};

exports.broadcastGrandParent = async function (response : any , familyId : any) {
    ioInstance.to(familyId).emit('grandParentAndSibling', response);
};

exports.broadcastContact = async function (response : any , familyId : any) {
    ioInstance.to(familyId).emit('contact', response);
};


