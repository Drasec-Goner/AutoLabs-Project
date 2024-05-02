const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const compression = require('compression');

const electricRouter = require('./routes/electric_index');
const gasRouter = require('./routes/gas_index');
const adminRouter = require('./routes/admin');
var UserModel = require("./models/CustomerModel");
const app = express();

const dotenv = require('dotenv');
dotenv.config();

//Connecting to Mongodb
const db = async () => {
    try {
        const conn = await mongoose.connect(process.env.URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });

        console.log("MongoDB connected");

    } catch (err) {
        console.log("MongoDB Error : Failed to connect");
        console.log(err);
        process.exit(1);
    }
}

db('autolabs');


// view engine setup
app.engine('.hbs', exphbs({
    defaultLayout: 'layout', extname: '.hbs',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());

console.log("App running on Localhost:5000");


// Routing
app.get('/', (req, res) => {
    res.redirect('/home');
});


app.get('/home', function (req, res) {
    res.sendFile(__dirname + "/routes/home.html");
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname, 'routes', 'login.html'));
});
app.use('/admin', adminRouter);
app.use('/electric', electricRouter);
app.use('/gas', gasRouter);


//Users
app.post('/customer', async (req, res) => {
    const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

mg.messages.create(process.env.MAILGUN_DOMAIN, {
	from: 'AutoLabs Pvt Ltd. <autolabspvtltd@gmail.com>',
	to: [req.body.useremail],
	subject: "Welcome To AutoLabs ",
	text: "Thanks for Registering with us. We will keep you updated with our latest offers and services.",
	html: `<h1>Thanks for showing interest in our product. Hope you get your ride soon!</h1>`
})
.then(msg => console.log(msg)) 
.catch(err => console.log(err));

    const user = new UserModel({
        name: req.body.username,
        email: req.body.useremail,
        phone: req.body.userphone
    })

    const user_res = await user.save();
    console.log(user_res);
});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
