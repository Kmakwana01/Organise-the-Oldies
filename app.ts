import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import cors from 'cors';
import { verifyToken } from "./middleware/auth";

require('dotenv').config()
const mongodbPath: any = process.env.MONGO_URL || "mongodb+srv://kmakwana1255:kmakwana@cluster1.hfoy8xo.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(mongodbPath)
  .then(() => console.log('Connected!'))
  .catch((err) => console.log(err.message))

import userRouter from './routes/userRoute';
import siblingAndGrandParentRouter from './routes/siblingAndGrandParentRoute';
import contactRouter from './routes/contactRoute';
import keyInfoRouter from './routes/keyInfoRoute';
import eventRouter from './routes/eventRoute';
import notificationRouter from './routes/notificationRoute';
import reminderRouter from './routes/reminderRoute';
import medicinesRouter from './routes/medicinesRoute';
import socketRouter from './routes/socketRoute';
import homePageRouter from './routes/homePageRoute';
import subscriptionRouter from './routes/subscriptionRoute'

import sendMailUserRouter from './routes/sendMailRouteUser';
import medicinesTakenRouter from './routes/medicinesTakenRoute';

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(cors(), express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/images', verifyToken, express.static(path.join(__dirname, 'public/images')));
// app.use('/audio', verifyToken, express.static(path.join(__dirname, 'public/audio')));


app.use('/', userRouter);
app.use('/siblingAndGrandParent', siblingAndGrandParentRouter);
app.use('/contact', contactRouter);
app.use('/keyInfo', keyInfoRouter);
app.use('/event', eventRouter);
app.use('/notification', notificationRouter);
app.use('/reminder', reminderRouter);
app.use('/medicines', medicinesRouter);
app.use('/chat', socketRouter);
app.use('/homePage', homePageRouter);
app.use('/subscription', subscriptionRouter);
app.use('/sendMailUser', sendMailUserRouter);
app.use('/medicinesTaken', medicinesTakenRouter);

import cron from 'node-cron';
import { trashFileRemove } from './controller/cronJobController';

cron.schedule('* * * * * *', () => {
  trashFileRemove()
});

import { medicinesMail } from './util/email';

cron.schedule('30 * * * *', () => {
  medicinesMail()
})

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export = app;