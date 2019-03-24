/**
 * Created on 2019/3/15.
 */
"use strict";



var resp = require('../../../epm_respond');
var moment = require('moment');
var pay_help = require('../../../pay_help');
var constants = require('../../../constants').constants;
// var check = require('../../check_authority');
// var sqlhelp = require('../../../mysql_help')

var transaction_step = require('../../../transaction_step');

exports.get_car_number = function (req, res) {
    let json = req.body;

    if (resp.check_params(json.auth_code, json.parking_id, json.car_id) == false) {
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
            .then(get_alipay_token)
            .then(get_car_number)
            .then(get_in_duration)
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
        where tb_park.owner_id = tb_merchant.user_id and tb_park.type = tb_merchant.type and tb_merchant.type = $1 and tb_park.parking_id = $2`;
        let values = [constants.auth_type.alipay, json.parking_id];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);

            if (result.rows.length === 0) return reject(resp.gen_err(resp.RespMsg.ResourceNotFound))
            console.log('result', result.rows[0])

            req.body.app_auth_token = result.rows[0].app_auth_token;
            req.body.auth_app_id = result.rows[0].auth_app_id;
            resolve(req);
        })
    })
}

function get_alipay_token (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;

        req.body.alipaySdk = new AlipaySdk({
            appId: json.auth_app_id,
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });

        json.alipaySdk.exec('alipay.system.oauth.token', {
            // appID: json.auth_app_id,
            // appAuthToken: json.app_auth_token,
            grantType: 'authorization_code',
            code: json.auth_code
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: _this.logger,
        }).then(result => {
            console.log('result', result);
            if (result.userId && result.accessToken) {
                // console.log('参数', req.body, json.car_number, moment(new Date(json.in_time)).format('YYYY-MM-DD HH:mm:ss'))
                req.body.userId = result.userId;
                req.body.accessToken = result.accessToken
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

function get_car_number (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        json.alipaySdk.exec('alipay.eco.mycar.parking.vehicle.query', {
            // appID: json.auth_app_id,
            // appAuthToken: json.app_auth_token,
            authToken: json.accessToken,
            bizContent: {
                carId: json.car_id
            }
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: _this.logger,
        }).then(result => {
            console.log('result', result);
            if (result.carNumber) {
                // console.log('参数', req.body, json.car_number, moment(new Date(json.in_time)).format('YYYY-MM-DD HH:mm:ss'))
                req.body.carNumber = result.carNumber;
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

// function get_yuen_parking_id (req) {
//     return new Promise(function (resolve, reject) {
//         let json = req.body;
//         let sql = `select name, yuen_parking_id from tb_parking_lot where alipay_parking_id = $1`;
//         let values = [json.carNumber];
//         req.promise_params.client.query(sql, values, function (err, result) {
//             if (err) return reject(err);
//             if (result.rows) {
//                 req.body.parking_name = result.rows[0].name;
//                 req.body.yuen_parking_id = result.rows[0].yuen_parking_id;
//                 // req.res_json = {parking_name: result.rows[0].name, yuen_parking_id: result.rows[0].yuen_parking_id, car_number: json.carNumber, user_id: json.userId}
//             } else {
//                 return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));
//             }
//             resolve(req);
//         })
//     })
// }

function get_in_duration (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select in_time, pay_time, parking_name, yuen_parking_id from tb_car_in_out_record where car_num = $1 and status in ($2, $3)`;
        let values = [json.carNumber, constants.car_status.in, constants.car_status.payed];
        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            // console.log('result', result.rows)
            if (result.rows.length > 0) {
                req.body.parking_name = result.rows[0].parking_name;
                req.body.yuen_parking_id = result.rows[0].yuen_parking_id;
                req.body.in_time = result.rows[0].in_time;
                if (result.rows[0].pay_time) {
                    req.body.in_duration = Math.ceil((new Date() - new Date(result.rows[0].pay_time))/(60*1000))
                } else {
                    req.body.in_duration = Math.ceil((new Date() - new Date(result.rows[0].in_time))/(60*1000))
                }
                console.log('result', {parking_name: result.rows[0].parking_name, yuen_parking_id: result.rows[0].yuen_parking_id, car_number: json.carNumber, user_id: json.userId,
                    in_time: json.in_time, in_duration: json.in_duration})
                req.res_json = {parking_name: result.rows[0].parking_name, yuen_parking_id: result.rows[0].yuen_parking_id, car_number: json.carNumber, user_id: json.userId,
                    in_time: moment(new Date(json.in_time)).format('YYYY-MM-DD HH:mm:ss'), in_duration: json.in_duration}
            } else {
                return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));
            }
            resolve(req);
        })
    })
}