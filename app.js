var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var fs = require('fs');
const { Pool } = require('pg')
global.AlipaySdk = require('alipay-sdk').default;
ALIPAY_PUBLIC_KEY = fs.readFileSync('./alipay_public_key.txt').toString();
APP_PUBLIC_KEY = fs.readFileSync('./app_public_key.txt').toString();
APP_PRIVATE_KEY = fs.readFileSync('./app_private_key.txt').toString();
SDK_APP_PRIVATE_KEY = fs.readFileSync('./app_private_key.txt', 'ascii');
SDK_ALIPAY_PUBLIC_KEY = fs.readFileSync('./alipay_public_key.txt', 'ascii');
// global.alipaySdk = new AlipaySdk({
//     appId: '2019031763590032', //正式第三方应用appid
//     // appId: '2019031163550021', // 自主应用（生活号）appid
//     // appId: '2016092800614637', //沙箱appid
//     privateKey: fs.readFileSync('./app_private_key.txt', 'ascii'), // 正式应用私钥
//     alipayPublicKey: fs.readFileSync('./alipay_public_key.txt', 'ascii') // 正式应用公钥
//     // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
//     // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
// });

// 正式授权地址
// https://openauth.alipay.com/oauth2/appToAppAuth.htm?app_id=2019031763590032&redirect_uri=https%3a%2f%2fparking.nayuntec.cn%2falipay%2fauth_redirect.html
// 沙箱授权地址
// https://openauth.alipay.com/oauth2/appToAppAuth.htm?app_id=2016092800614637&redirect_uri=https%3a%2f%2fparking.nayuntec.cn%2falipay%2fauth_redirect.html
// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.set('view engine', 'jade');



app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

//使用了gbk编码，会报错，在这里拦截处理一下
app.use(function (req, res, next) {
    if (req.headers['content-type'] && req.headers['content-type'].indexOf('GBK') > -1) {
        req.headers['content-type'] = req.headers['content-type'].replace('GBK', 'UTF-8');
    }
    next();
});


app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

global.config = JSON.parse(fs.readFileSync('./config.json', "utf-8"));

// 链接pg数据库
global.pool = new Pool(config.pg_parking_pay)

HTTPS_ROUTES_PATH = __dirname + '/routes/api';


var route = require('./routes/api/route');

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    // res.header("Content-Type", "application/x-www-form-urlencoded; text/html;");
    next();
});

// // 测试验签
// global.alipaySdk.exec('alipay.system.oauth.token', {
//     grantType: 'authorization_code',
//     code: 'code',
//     refreshToken: 'token'
// }, {
//     // 验签
//     validateSign: true,
//     // 打印执行日志
//     log: this.logger,
// })
//     .then(result => {
//         console.log('result', result);
//     })
//     .catch(err => {
//         console.log('err', err)
//     })

// // ISV系统配置查询
// alipaySdk.exec('alipay.eco.mycar.parking.config.query', {
//     interface_name: 'alipay.eco.mycar.parking.userpage.query',
//     interface_type: 'interface_page'
// }, {
//     // 验签
//     validateSign: true,
//     // 打印执行日志
//     log: this.logger,
// })
//     .then(result => {
//         console.log('result', result);
//     })
//     .catch(err => {
//         console.log('err', err)
//     })

// // ISV系统配置set
// alipaySdk.exec('alipay.eco.mycar.parking.config.set', {
//     bizContent: {
//         merchant_name: '杭州育恩科技有限公司',
//         merchant_service_phone: '18057185219',
//         account_no: 'servicepay@nayuntec.cn',
//         interface_info_list: [{
//             interface_name: 'alipay.eco.mycar.parking.userpage.query',
//             interface_type: 'interface_page',
//             interface_url: 'https%3a%2f%2fwww.nayuntec.cn%2faliorderdetail%2faliorderdetail.html'
//         }],
//         merchant_logo: ''
//     }
//     // merchant_logo: 'data:image/png;base64,' + fs.readFileSync('./logo.png').toString('base64')
// }, {
//     // 验签
//     validateSign: true,
//     // 打印执行日志
//     log: this.logger,
// })
//     .then(result => {
//         console.log('result', result);
//     })
//     .catch(err => {
//         console.log('err', err)
//     })



app.all('*', function (req, res, next) {
    // console.log(global.pool.idleCount);
    // if (req.protocol == 'https') {
    var ip = req.ip.match(/\d+\.\d+\.\d+\.\d+/);
    if (ip != null){
        req.remote_ip = ip[0];
    }
    next();
    // } else {
    //     res.status(400).send('must be https!!');
    //     next();
    // }
});

app.options('*', function(req, res){
    console.log(`------------  options  --------------`);
    console.log('pppp___', res)
    // resp.respond(resp.RespMsg.InternalServerError, req, res);
    res.json({code: "ok"});
    console.log(')))结束')

})

// var multipart = require('connect-multiparty');
//
// var multipartMiddleware = multipart();

var multer  = require('multer')
var upload = multer({ dest: config.path.doc_file })
var alipay_check = require('./routes/api/parking/alipay/check');
var get_notify_msg = require('./routes/api/parking/alipay/get_notify_msg');
app.all('/api/parking/alipay/check', function (req, res, next) {
    console.log(`------------  alipay/check  --------------`);
    // console.log('req.body', req.body)
    alipay_check.check(req, res, next);
});

app.all('/api/parking/alipay/get_notify_msg', function (req, res, next) {
    console.log(`------------  alipay/check  --------------`);
    // console.log('req.body', req.body)
    get_notify_msg.get_notify_msg(req, res, next);
});



app.all('/api/*', upload.single('file'), function (req, res, next) {
    let api = req.params[0];
    req.api = api;
    console.log('AAA', req.body, req.params)

    let content_type = req.header('content-type');
    if (content_type.indexOf(`multipart/form-data`) >= 0){  //某些文件上传的api
        req.body.json = JSON.parse(req.body.json);
    }
    console.log(`------------  ${api} --------------`)
    console.log(req.body);
    route.route(req, res, next);
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
