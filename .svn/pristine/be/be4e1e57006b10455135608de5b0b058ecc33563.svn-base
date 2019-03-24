/**
 * Created on 2019/3/15.
 */
"use strict";



var resp = require('../../../epm_respond');
var moment = require('moment');
var pay_help = require('../../../pay_help');
var constants = require('../../../constants').constants;
// var check = require('../../check_authority');
// var sqlhelp = require('../../../mysql_help');

var transaction_step = require('../../../transaction_step');

exports.get_auth_msg_insert = function (req, res) {
    let json = req.body;

    if (resp.check_params(json.app_auth_code, json.merchant_name, json.principal_name, json.mobile) == false) {
        return resp.respond(resp.RespMsg.ParamsError, req, res);
    }

    console.log('获取支付宝授权信息', req.body, req.params, req.query);

    Promise.resolve(req)
        .then(get_auth_token)
        .then(update_tb_merchant)
        .then((result) => {
            resp.respond_ok(req, res, result);
        })
        .catch((error) => {
            console.log('error', error);
            return resp.respond(error.msg, req, res, error);
        });
}

function get_auth_token (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;

        req.body.alipaySdk = new AlipaySdk({
            appId: '2019031763590032', //正式第三方应用appid
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });

        json.alipaySdk.exec('alipay.open.auth.token.app', {
            bizContent: {
                grantType: 'authorization_code',
                code: json.app_auth_code
            }
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: _this.logger,
        }).then(result => {
            console.log('result', result);
            if (result.code === '10000') {
                req.body.app_auth_token = result.tokens[0].appAuthToken;
                req.body.user_id = result.tokens[0].userId;
                req.body.auth_app_id = result.tokens[0].authAppId;
                resolve(req)
            } else {
                return reject(resp.gen_err(resp.RespMsg.AlipayServerError))
            }
        }).catch(err => {
            // console.log('err', err)
            return reject(err);
        })
    })
}

function update_tb_merchant (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;

        // let sql = `insert into tb_merchant (merchant_name, app_auth_token, user_id, type, principal_name, mobile)
        // values ($1, $2, $3, $4, $5, $6)`;

        let sql = `insert into tb_merchant (merchant_name, app_auth_token, user_id, type, principal_name, mobile, auth_app_id)
        values ($1, $2, $3, $4, $5, $6, $7) on conflict (user_id, type) do update set merchant_name = excluded.merchant_name,
        app_auth_token = excluded.app_auth_token, principal_name = excluded.principal_name, mobile = excluded.mobile, auth_app_id = excluded.auth_app_id`;

        let values = [json.merchant_name, json.app_auth_token, json.user_id, constants.auth_type.alipay, json.principal_name, json.mobile, json.auth_app_id];

        pool.query(sql, values, function (err, result) {
            if (err) return reject(err);
            resolve();
        })
    })
}