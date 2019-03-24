/**
 * Created on 2019/3/15.
 */
"use strict";



var resp = require('../../../../epm_respond');
var moment = require('moment');
var pay_help = require('../../../../pay_help');
var constants = require('../../../../constants').constants;
// var check = require('../../check_authority');
// var sqlhelp = require('../../../mysql_help')

var transaction_step = require('../../../../transaction_step');

exports.set = function (req, res) {
    let json = req.body;

    if (resp.check_params(json.merchant_name, json.merchant_service_phone, json.interface_url, json.account_no, json.customer_id) == false) {
        return resp.respond(resp.RespMsg.ParamsError, req, res);
    }

    Promise.resolve(req)
        .then(get_app_auth_token)
        .then(set_isv)
        .then((result) => {
            resp.respond_ok(req, res, result);
        })
        .catch((error) => {
            console.log('error', error);
            return resp.respond(error.msg, req, res, error);
        });


}

function get_app_auth_token (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select app_auth_token, auth_app_id from tb_merchant where customer_id = $1 and type = $2`;
        let values = [json.customer_id, constants.auth_type.alipay];

        pool.query(sql, values, function (err, result) {
            if (err) return reject(err);
            if (result.rows.length === 0) return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));
            console.log('result', result);
            req.body.app_auth_token = result.rows[0].app_auth_token;
            req.body.auth_app_id = result.rows[0].auth_app_id;
            resolve(req);
        })
    })
}

function set_isv (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        req.body.alipaySdk = new AlipaySdk({
            appId: json.auth_app_id,
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });
        // // ISV系统配置set
        json.alipaySdk.exec('alipay.eco.mycar.parking.config.set', {
            // appID: json.auth_app_id,
            // appAuthToken: json.app_auth_token,
            bizContent: {
                merchant_name: json.merchant_name,
                merchant_service_phone: json.merchant_service_phone,
                account_no: json.account_no,
                interface_info_list: [{
                    interface_name: 'alipay.eco.mycar.parking.userpage.query',
                    interface_type: 'interface_page',
                    interface_url: encodeURIComponent(json.interface_url)
                }],
                merchant_logo: json.merchant_logo || ''
            }
            // merchant_logo: 'data:image/png;base64,' + fs.readFileSync('./logo.png').toString('base64')
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: this.logger,
        })
            .then(result => {
                console.log('result', result)
                resolve()
            })
            .catch(err => {
                return reject(err)
            })
    })

}