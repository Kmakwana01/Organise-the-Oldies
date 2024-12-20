"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
require('dotenv').config();
const mongodbPath = process.env.MONGO_URL || "mongodb://localhost:27017/OTO";
mongoose_1.default.connect(mongodbPath)
    .then(() => console.log('Connected!'))
    .catch((err) => console.log(err.message));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const siblingAndGrandParentRoute_1 = __importDefault(require("./routes/siblingAndGrandParentRoute"));
const contactRoute_1 = __importDefault(require("./routes/contactRoute"));
const keyInfoRoute_1 = __importDefault(require("./routes/keyInfoRoute"));
const eventRoute_1 = __importDefault(require("./routes/eventRoute"));
const notificationRoute_1 = __importDefault(require("./routes/notificationRoute"));
const reminderRoute_1 = __importDefault(require("./routes/reminderRoute"));
const medicinesRoute_1 = __importDefault(require("./routes/medicinesRoute"));
const socketRoute_1 = __importDefault(require("./routes/socketRoute"));
const homePageRoute_1 = __importDefault(require("./routes/homePageRoute"));
const subscriptionRoute_1 = __importDefault(require("./routes/subscriptionRoute"));
const sendMailRouteUser_1 = __importDefault(require("./routes/sendMailRouteUser"));
const medicinesTakenRoute_1 = __importDefault(require("./routes/medicinesTakenRoute"));
const app = (0, express_1.default)();
// view engine setup
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)(), express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// app.use('/images', verifyToken, express.static(path.join(__dirname, 'public/images')));
// app.use('/audio', verifyToken, express.static(path.join(__dirname, 'public/audio')));
app.use('/', userRoute_1.default);
app.use('/siblingAndGrandParent', siblingAndGrandParentRoute_1.default);
app.use('/contact', contactRoute_1.default);
app.use('/keyInfo', keyInfoRoute_1.default);
app.use('/event', eventRoute_1.default);
app.use('/notification', notificationRoute_1.default);
app.use('/reminder', reminderRoute_1.default);
app.use('/medicines', medicinesRoute_1.default);
app.use('/chat', socketRoute_1.default);
app.use('/homePage', homePageRoute_1.default);
app.use('/subscription', subscriptionRoute_1.default);
app.use('/sendMailUser', sendMailRouteUser_1.default);
app.use('/medicinesTaken', medicinesTakenRoute_1.default);
const node_cron_1 = __importDefault(require("node-cron"));
const cronJobController_1 = require("./controller/cronJobController");
node_cron_1.default.schedule('* * * * * *', () => {
    (0, cronJobController_1.trashFileRemove)();
});
const email_1 = require("./util/email");
node_cron_1.default.schedule('30 * * * *', () => {
    (0, email_1.medicinesMail)();
});
// catch 404 and forward to error handler
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
module.exports = app;
