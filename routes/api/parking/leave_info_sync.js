/**
 * Created on 2019/3/15.
 */
"use strict";



var resp = require('../../epm_respond');
var moment = require('moment');
var pay_help = require('../../pay_help');
var constants = require('../../constants').constants;
// var check = require('../../check_authority');
// var sqlhelp = require('../../../mysql_help')

var transaction_step = require('../../transaction_step');

exports.leave_info_sync = function (req, res) {
    let json = req.body;
    console.log('出场消息', req.params, req.body)

    if (resp.check_params(json.car_number, json.out_time, json.yuen_parking_id) == false) {
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
            .then(update_tb_leave_msg)
            .then(translate_park_id)
            .then(update_alipay_leave_msg)
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

function update_tb_leave_msg (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `update tb_car_in_out_record set status = $1, out_time = $2 where car_num = $3 and status in ($4, $5)`;
        let values = [constants.car_status.payed_and_leave, moment(new Date(json.out_time)).format('YYYY-MM-DD HH:mm:ss'), json.car_number, constants.car_status.in, constants.car_status.payed];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            resolve(req);
        })
    })
}

function translate_park_id (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select tb_park.parking_id, tb_merchant.app_auth_token, tb_merchant.auth_app_id from tb_park, tb_merchant 
        where tb_park.yuen_parking_id = $1 and tb_park.type = $2 and tb_park.owner_id = tb_merchant.user_id and tb_park.type = tb_merchant.type`;
        let values = [json.yuen_parking_id, constants.auth_type.alipay];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            console.log('result', result)
            if (result.rows.length === 0) return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));

            req.body.alipay_parking_id = result.rows[0].parking_id;
            req.body.alipay_app_auth_token = result.rows[0].app_auth_token;
            req.body.alipay_auth_app_id = result.rows[0].auth_app_id;
            resolve(req);
        })
    })
}

function update_alipay_leave_msg (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;

        req.body.alipaySdk = new AlipaySdk({
            appId: json.alipay_auth_app_id,
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });

        json.alipaySdk.exec('alipay.eco.mycar.parking.exitinfo.sync', {
            // appId: json.alipay_auth_app_id,
            // appAuthToken: json.alipay_app_auth_token,
            bizContent: {
                parkingId: json.alipay_parking_id,
                carNumber: json.car_number,
                outTime: moment(new Date(json.out_time)).format('YYYY-MM-DD HH:mm:ss')
            }
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: _this.logger,
        }).then(result => {
            console.log('result', result);
            if (result.code === '10000') {
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