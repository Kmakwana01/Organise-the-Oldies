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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicinesMail = exports.errorMail = exports.extractLineNumber = exports.main = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
require('dotenv').config();
const medicinesTakenModel_1 = require("../models/medicinesTakenModel");
const sendMailUserModel_1 = require("../models/sendMailUserModel");
const medicinesModel_1 = require("../models/medicinesModel");
const moment_1 = __importDefault(require("moment"));
const medicinesUser_1 = require("../models/medicinesUser");
const profileModel_1 = require("../models/profileModel");
const userModel_1 = require("../models/userModel");
const main = (email, otpCode, profile) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let transporter = nodemailer_1.default.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_FORGOT_PASSWORD,
                pass: process.env.EMAIL_APP_PASSWORD,
            }
        });
        let info = yield transporter.sendMail({
            from: process.env.EMAIL_FORGOT_PASSWORD,
            to: email,
            subject: 'Your OTP Code for OTO',
            text: '',
            html: `
            <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Static Template</title>

    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body
    style="
      margin: 0;
      font-family: 'Poppins', sans-serif;
      background: #ffffff;
      font-size: 14px;
    "
  >
    <div
      style="
        max-width: 680px;
        margin: 0 auto;
        padding: 45px 30px 60px;
        background: #f4f7ff;
        background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner);
        background-repeat: no-repeat;
        background-size: 800px 452px;
        background-position: top center;
        font-size: 14px;
        color: #434343;
      "
    >


      <main>
        <div
          style="
            margin: 0;
            margin-top: 70px;
            padding: 70px 25px 70px;
            background: #ffffff;
            border-radius: 30px;
            text-align: center;
          "
        >
          <div style="width: 100%; max-width: 489px; margin: 0 auto;">
             <img
                  alt=""
                  src="https://oto.kmsoft.in/images/1723539353634-171143719.png"
                  height="50px"
    
              />
            <h1
              style="
                margin: 0;
                margin-top : 25px;
                font-size: 18px;
                font-weight: 500;
                color: #1f1f1f;
              "
            >
              Organise-the-Oldies
            </h1>
            <p
              style="
                margin: 0;
                margin-top: 17px;
                font-size: 16px;
                font-weight: 500;
              "
            >
            Dear ${profile.firstName} ${profile.lastName},
            </p>
            <p
              style="
                margin: 0;
                margin-top: 17px;
                font-weight: 500;
                letter-spacing: 0.56px;
              "
            >
              Thank you for choosing our Application. Use the following OTP
              to complete the procedure to change your password. OTP is
              valid for
              <span style="font-weight: 600; color: #1f1f1f;">5 minutes</span>.
              Do not share this code with others.
            </p>
            <p
              style="
                margin: 0;
                margin-top: 60px;
                font-size: 20px;
                font-weight: 600;
                letter-spacing: 10px;
                color: #ba3d4f;
              "
            >
              ${otpCode}
            </p>
          </div>
        </div>
      </main>

      <footer
        style="
          width: 100%;
          max-width: 490px;
          margin: 20px auto 0;
          text-align: center;
          border-top: 1px solid #e6ebf1;
        "
      >
        <div style="margin: 0; margin-top: 16px;">
          <a href="" target="_blank" style="display: inline-block;">
            <img
              width="36px"
              alt="Facebook"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook"
            />
          </a>
          <a
            href=""
            target="_blank"
            style="display: inline-block; margin-left: 8px;"
          >
            <img
              width="36px"
              alt="Instagram"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram"
          /></a>
          <a
            href=""
            target="_blank"
            style="display: inline-block; margin-left: 8px;"
          >
            <img
              width="36px"
              alt="Twitter"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503043040_372004/email-template-icon-twitter"
            />
          </a>
          <a
            href=""
            target="_blank"
            style="display: inline-block; margin-left: 8px;"
          >
            <img
              width="36px"
              alt="Youtube"
              src="https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661503195931_210869/email-template-icon-youtube"
          /></a>
        </div>
        <p style="margin: 0; margin-top: 16px; color: #434343;">
          Copyright © 2024 Company. All rights reserved.
        </p>
      </footer>
    </div>
  </body>
</html>

            
            `
        });
        console.log('Message sent: %s', 'Check your email Id');
        console.log('Preview URL: %s', nodemailer_1.default.getTestMessageUrl(info));
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
});
exports.main = main;
const extractLineNumber = function (error) {
    const stackTrace = error.stack || '';
    const matches = stackTrace.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
    if (matches && matches.length >= 5) {
        const functionName = matches[1];
        const fileName = matches[2];
        const lineNumber = matches[3];
        const columnNumber = matches[4];
        return {
            fileName: `${fileName}`,
            line: `Error in function '${functionName}' in line ${lineNumber}, column ${columnNumber}`
        };
    }
    return 'Error details not found';
};
exports.extractLineNumber = extractLineNumber;
const errorMail = function (error, req, line) {
    return __awaiter(this, void 0, void 0, function* () {
        const api = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const body = JSON.stringify(req.body, null, 2);
        const errorMessage = error.message;
        const lines = line.line;
        const fileName = line.fileName;
        const formattedData = `\napi: ${api}\n\nbody: ${body}\n\nerror: ${errorMessage}\n\nfileName: ${fileName}\n\nline: ${lines}`;
        let testAccount = yield nodemailer_1.default.createTestAccount();
        let transporter = nodemailer_1.default.createTransport({
            host: "smtp.gmail.com.",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_FORGOT_PASSWORD,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_FORGOT_PASSWORD,
            to: 'bhautik@kmsoft.org',
            subject: "OTO - Error Notification",
            text: `An error occurred: ${formattedData}`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
        });
    });
};
exports.errorMail = errorMail;
const medicinesMail = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('medicinesMail :>> ');
    const yesterdayStart = (0, moment_1.default)().add(-1, 'days').startOf('day').toISOString();
    const yesterdayEnd = (0, moment_1.default)().add(-1, 'days').endOf('day').toISOString();
    const yesterdayDays = (0, moment_1.default)().add(-1, 'days').format('dddd');
    const allUsers = yield sendMailUserModel_1.SEND_MAIL_USER.find({ isActive: true });
    if (allUsers.length) {
        for (let user of allUsers) {
            console.log('current time ', `'${(0, moment_1.default)().format('hh:mm A')}'`, " user Time ", `'${user.time}'`);
            if ((0, moment_1.default)().format('hh:mm A') == user.time) {
                console.log('time match');
                let medicines = yield medicinesModel_1.MEDICINES.find({ familyId: user.familyId, isDeleted: false });
                console.log("medicines", medicines);
                let userFind = yield userModel_1.USER.findOne({ _id: user.userId });
                let yesterdayMedicines = [];
                for (let medicine of medicines) {
                    let reminderDate = (0, moment_1.default)(medicine.date).toISOString();
                    let medicineUsers = yield medicinesUser_1.MEDICINES_USER.find({ medicinesId: medicine._id, isDeleted: false });
                    medicine._doc.medicineUser = JSON.parse(JSON.stringify(medicineUsers));
                    if (medicine.repeat === 'Daily') {
                        console.log('Daily :>> ');
                        let currentDate = (0, moment_1.default)();
                        if (currentDate.isAfter(medicine.date)) {
                            console.log('medicine add in yesterdayMedicines :>> ');
                            yesterdayMedicines.push(medicine);
                        }
                    }
                    else if (medicine.repeat === 'weekly') {
                        for (let week of medicine.weekDays) {
                            if (week === yesterdayDays) {
                                yesterdayMedicines.push(medicine);
                            }
                        }
                    }
                    else if (medicine.repeat === 'monthly') {
                        let whatIsDay = (0, moment_1.default)(reminderDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').date();
                        if ((0, moment_1.default)().add(1, 'day').date() === whatIsDay) {
                            yesterdayMedicines.push(medicine);
                        }
                    }
                    else if (medicine.repeat === 'forNightly') {
                        let intervalDays = 15;
                        let nextOccurrence = (0, moment_1.default)(reminderDate, 'YYYY-MM-DDTHH:mm:ss.SSSZ').clone();
                        while (nextOccurrence.isBefore((0, moment_1.default)().add(2, 'days'))) {
                            if (nextOccurrence.isBetween(yesterdayStart, yesterdayEnd, null, '[]')) {
                                yesterdayMedicines.push(medicine);
                                break;
                            }
                            nextOccurrence.add(intervalDays, 'days');
                        }
                    }
                }
                console.log('yesterdayMedicines.length :>> ', yesterdayMedicines.length);
                for (let medicine of JSON.parse(JSON.stringify(yesterdayMedicines))) {
                    console.log('enter yesterdayMedicines loop');
                    let findMedicine = yield medicinesModel_1.MEDICINES.findOne({ _id: medicine._id }); // Available findMedicine.selectTime1 selectTime2 selectTime3
                    for (let iterator of medicine.medicineUser) {
                        console.log('medicine UserId', yield iterator.userId);
                        let isTaken = yield medicinesTakenModel_1.MEDICINES_TAKEN.find({ medicinesId: iterator.medicinesId, userId: iterator.userId });
                        let takenTimes = isTaken.map(take => take.time);
                        let profile = yield profileModel_1.PROFILE.findOne({ userId: iterator === null || iterator === void 0 ? void 0 : iterator.userId });
                        let timesToCheck = [findMedicine.selectTime1, findMedicine.selectTime2, findMedicine.selectTime3].filter(time => time); // Filter out undefined times
                        let userMessages = timesToCheck.map(time => {
                            if (takenTimes.includes(time)) {
                                return {
                                    message: 'Take medicine',
                                    name: `${profile === null || profile === void 0 ? void 0 : profile.firstName} ${profile === null || profile === void 0 ? void 0 : profile.lastName}`,
                                    medicine: medicine.name,
                                    time: time,
                                    userId: profile === null || profile === void 0 ? void 0 : profile.userId
                                };
                            }
                            else {
                                return {
                                    message: "Didn't take medicine",
                                    name: `${profile === null || profile === void 0 ? void 0 : profile.firstName} ${profile === null || profile === void 0 ? void 0 : profile.lastName}`,
                                    medicine: medicine.name,
                                    time: time,
                                    userId: profile === null || profile === void 0 ? void 0 : profile.userId
                                };
                            }
                        });
                        if (userMessages.length) {
                            let formattedMessages = userMessages.map(({ message, name, medicine, time }) => `Message: ${message}\nName: ${name}\nMedicine: ${medicine}\nTime: ${time}\n\n`).join('');
                            console.log(formattedMessages, userFind === null || userFind === void 0 ? void 0 : userFind.email);
                            medicineMailSend(userFind === null || userFind === void 0 ? void 0 : userFind.email, formattedMessages);
                        }
                    }
                }
            }
        }
    }
});
exports.medicinesMail = medicinesMail;
function medicineMailSend(email, messages) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let transporter = nodemailer_1.default.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_FORGOT_PASSWORD,
                    pass: process.env.EMAIL_APP_PASSWORD,
                }
            });
            let info = yield transporter.sendMail({
                from: process.env.EMAIL_FORGOT_PASSWORD,
                to: email,
                subject: 'Medicines email',
                text: messages,
            });
            console.log('Message sent: %s', 'Check your email Id');
            console.log('Preview URL: %s', nodemailer_1.default.getTestMessageUrl(info));
        }
        catch (error) {
            console.error('Error sending email:', error);
        }
    });
}
