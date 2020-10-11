require('dotenv').config();
const nodemailer = require('nodemailer');
const csv = require('csvtojson/v1');
const schedule = require('node-schedule');
const template = require('./template.js');

var pubnub = require("pubnub")({
    subscribe_key: 'demo', // always required
    publish_key: 'demo'	// only required if publishing
});

var email = process.env.EMAIL;
var pwd = process.env.PASSWORD;

function send_percentage(percentage) {
    pubnub.publish({
        channel: "progress-bar",
        message: { "value": percentage },
        callback: function (m) { console.log(m) }
    });
}

const account = {
    user: email,
    pass: pwd
}

var transporter = nodemailer.createTransport({
    pool: true, //keeps the server connection open     
    host: 'smtp.gmail.com', //your email server     
    port: 465, //gmail uses SSL     
    secure: true, //gmail sends secure 
    tls: { rejectUnauthorized: false },
    auth: {
        user: account.user,
        pass: account.pass
    }
});

var testfile = './list_email.csv'; //my test list
var prodfile = './list.csv'; //path to our production list
var sendlist = []; // empty array where we'll keep //all our contacts
var message_increment = 0; //variable to move to the next //contact

function trigger_sending(env) { //env passes our email and name to //customize the message     
    var emailbody = "Hai Ini Email Marketing dari : ade.readone45@gmail.com";
    //var emailbody = template.generate(env.email).toString();

    //generates a string to send  //the personalized 
    transporter.sendMail({
        from: 'RDG STUDIO',
        to: env.email, //email address of our recipient         
        subject: 'Test Email Marketing',
        text: '##Plaintext version of the message##',
        html: emailbody,
    }, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

function set_message_delays() {
    var message_job = schedule.scheduleJob('*/10 * * * * *', function () {
        console.log(sendlist[message_increment]);
        
        trigger_sending(sendlist[message_increment]);

        if (message_increment < sendlist.length) {
            message_increment++;
        }

        if (message_increment >= sendlist.length) {
            message_job.cancel();
        }

        var total_data = 100 / sendlist.length;
        send_percentage(total_data * message_increment);       

    });
}

function get_list() {
    csv().fromFile(testfile) //or your production list     
        .on('json', (jsonObj) => {
            sendlist.push(jsonObj);
        })
        .on('done', () => {
            console.log(sendlist);
            set_message_delays();
        })
}


transporter.verify(
    function (error, success) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Server is ready to take our messages');
            get_list();
            // trigger the whole app once the mail server is ready     
        }
    });