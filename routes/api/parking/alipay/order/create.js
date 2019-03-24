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

exports.create = function (req, res) {
    let json = req.body;

    if (resp.check_params(json.buyer_id, json.total_amount, json.subject, json.body, json.discountable_amount,
            json.yuen_parking_id, json.parking_name, json.car_number, json.in_time, json.in_duration, json.parking_id) == false) {
        return resp.respond(resp.RespMsg.ParamsError, req, res);
    }

    pool.connect((err, client, done) => {
        if (err) {
            return console.error('Error acquiring client', err.stack)
        }
        req.promise_params = {
            client: client,
            done: done
        }
        Promise.resolve(req)
            .then(transaction_step.transaction_begin)
            .then(get_app_auth_token)
            .then(create_yuen_order)
            .then(create_alipay_order)
            .then(update_alipay_trade_no)
            .then(transaction_step.commit)
            .then((result) => {
                resp.respond_ok(req, res, result);
            })
            .catch((error) => {
                console.log('error', error);
                transaction_step.rollback(error, client, done);
                return resp.respond(error.msg, req, res, error);
            });
    })

}

function get_app_auth_token (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select tb_merchant.app_auth_token, tb_merchant.auth_app_id from tb_park, tb_merchant 
        where tb_park.parking_id = $1 and tb_park.type = $2 and tb_park.owner_id = tb_merchant.user_id and tb_park.type = tb_merchant.type`;
        let values = [json.parking_id, constants.auth_type.alipay];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            console.log('result', result.rows[0])
            if (result.rows.length === 0) return reject(resp.gen_err(resp.RespMsg.ResourceNotFound))

            req.body.app_auth_token = result.rows[0].app_auth_token;
            req.body.auth_app_id = result.rows[0].auth_app_id;
            resolve(req);
        })
    })
}

function create_yuen_order (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let yuen_order_number = pay_help.create_order_num(json.yuen_parking_id);
        let sql = `insert into tb_order (yuen_order_number, yuen_parking_id, car_number, total_money, parking_name, status, in_time, in_duration, info, create_time, type, discountable_money, actually_money) 
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, current_timestamp, $10, $11, $12)`;


        let values = [yuen_order_number, json.yuen_parking_id, json.car_number, json.total_amount, json.parking_name, constants.paid_status.unpaid, json.in_time, json.in_duration, {user_id: json.buyer_id, parking_id: json.parking_id}, constants.auth_type.alipay]

            values.push(json.discountable_amount, ((json.total_amount * 100 - json.discountable_amount * 100)/100).toFixed(2))


        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            console.log('result', result);
            req.body.yuen_order_number = yuen_order_number;
            resolve(req);
        })
    })
}

function create_alipay_order (req) {
    return new Promise(function (resolve, reject) {
        var json = req.body;
        let bizContent = {
            out_trade_no: json.yuen_order_number,
            total_amount: json.total_amount,
            discountable_amount: json.discountable_amount || '',
            subject: json.subject,
            body: json.body,
            buyer_id: json.buyer_id,
            timeout_express: '30m'
        }

        req.body.alipaySdk = new AlipaySdk({
            appId: json.auth_app_id,
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });

        json.alipaySdk.exec('alipay.trade.create', {
            // appID: json.auth_app_id,
            // appAuthToken: json.app_auth_token,
            notifyUrl: 'https://parking.nayuntec.cn/api/parking/alipay/get_notify_msg',
            bizContent: bizContent
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: _this.logger,
        }).then(result => {
            console.log('result', result);
            if (result.tradeNo) {
                req.body.trade_no = result.tradeNo
                resolve(req)
            } else {
                return reject(resp.gen_err(resp.RespMsg.AlipayServerError))
            }
        }).catch(err => {
            console.log('err', err)
            return reject(err);
        })
    })
}


function update_alipay_trade_no (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `update tb_order set trade_no = $1 where yuen_order_number = $2 and type = $3`;

        let values = [json.trade_no, json.yuen_order_number, constants.auth_type.alipay];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            req.res_json = {trade_no: json.trade_no}
            resolve(req)
        })
    })
}