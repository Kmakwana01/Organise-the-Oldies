"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const socketController_1 = require("./controller/socketController");
let ioInstance;
const io = function (io) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance = io;
        io.on("connection", (socket) => {
            console.log("a user connected");
            socket.on("joinRoom", (roomId) => {
                socket.join(roomId.roomId);
                console.log(`User ${socket.id} joined room ${JSON.stringify(roomId)}`);
            });
            socket.on("chat", (data) => __awaiter(this, void 0, void 0, function* () {
                (0, socketController_1.chatCreate)(data, io, socket);
            }));
            socket.on("chatUpdate", (data) => __awaiter(this, void 0, void 0, function* () {
                (0, socketController_1.chatUpdate)(data, io, socket);
            }));
            socket.on("chatDelete", (data) => __awaiter(this, void 0, void 0, function* () {
                (0, socketController_1.chatDelete)(data, io, socket);
            }));
            socket.on("disconnect", () => {
                console.log("user disconnected");
            });
        });
    });
};
exports.io = io;
exports.broadcastChatAttachment = function (response, familyId) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance.to(familyId).emit('chat', response);
    });
};
exports.broadcastKeyInfo = function (response, familyId) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance.to(familyId).emit('keyInfo', response);
    });
};
exports.broadcastEvent = function (response, familyId) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance.to(familyId).emit('event', response);
    });
};
exports.broadcastMedicines = function (response, familyId) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance.to(familyId).emit('medicines', response);
    });
};
exports.broadcastReminder = function (response, familyId) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance.to(familyId).emit('reminder', response);
    });
};
exports.broadcastGrandParent = function (response, familyId) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance.to(familyId).emit('grandParentAndSibling', response);
    });
};
exports.broadcastContact = function (response, familyId) {
    return __awaiter(this, void 0, void 0, function* () {
        ioInstance.to(familyId).emit('contact', response);
    });
};
