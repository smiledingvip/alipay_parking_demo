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

exports.get_notify_msg = function (req, res) {
    console.log('收到支付宝消息', req.query, req.params, req.body);

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
            .then(verify_sign)
            .then(get_order_msg)
            .then(get_app_auth_token)
            .then(sync_alipay_order)
            .then(sync_yuen_order)
            .then(sync_tb_car)
            .then(transaction_step.commit)
            .then((result) => {
                res.send('success'); // 响应支付宝异步通知的验签成功
                // resp.respond_ok(req, res, result);
            })
            .catch((error) => {
                if (error.code === resp.RespMsg.VerifySignError.code) {
                    res.send('failed'); // 响应支付宝异步通知的验签失败
                }
                console.log('error', error);
                transaction_step.rollback(error, client, done);
                return resp.respond(error.msg, req, res, error);
            });
    })
}

function verify_sign (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let boolean = pay_help.veriySign(json, json.sign_type, false)
        console.log('boolean', boolean)
        if (!boolean) {
            return reject(resp.gen_err(resp.RespMsg.VerifySignError))
        }
        resolve(req)
    })
}


function get_order_msg (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select in_time, in_duration, yuen_parking_id, parking_name, car_number, create_time, info 
        from tb_order where trade_no = $1 and type = $2`;
        let values = [json.trade_no, constants.auth_type.alipay];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            console.log('result', result.rows)
            if (result.rows.length > 0) {
                req.body.in_time = result.rows[0].in_time;
                req.body.in_duration = result.rows[0].in_duration;
                req.body.yuen_parking_id = result.rows[0].yuen_parking_id;
                req.body.parking_name = result.rows[0].parking_name;
                req.body.car_number = result.rows[0].car_number;
                req.body.create_time = result.rows[0].create_time;
                req.body.info = result.rows[0].info;
            } else {
                return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));
            }
            resolve(req);
        })
    })
}

function get_app_auth_token (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select tb_merchant.app_auth_token, tb_merchant.auth_app_id from tb_park, tb_merchant 
        where tb_park.yuen_parking_id = $1 and tb_park.type = $2 and tb_park.owner_id = tb_merchant.user_id and tb_park.type = tb_merchant.type`;
        let values = [json.yuen_parking_id, constants.auth_type.alipay];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);

            if (result.rows.length === 0) return reject(resp.gen_err(resp.RespMsg.ResourceNotFound))

            req.body.app_auth_token = result.rows[0].app_auth_token;
            req.body.auth_app_id = result.rows[0].auth_app_id;
            resolve(req);
        })
    })
}

function sync_alipay_order (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let bizContent = {
            userId: json.buyer_id,
            outParkingId: json.yuen_parking_id,
            parkingName: json.parking_name,
            carNumber: json.car_number,
            outOrderNo: json.out_trade_no,
            orderStatus: (json.trade_status === 'TRADE_SUCCESS' || json.trade_status === 'TRADE_FINISHED')? '0': '1',
            orderTime: moment(new Date(json.create_time)).format('YYYY-MM-DD HH:mm:ss'),
            orderNo: json.trade_no,
            payTime: json.gmt_payment,
            payType: '1',
            payMoney: json.buyer_pay_amount,
            inTime: moment(new Date(json.in_time)).format('YYYY-MM-DD HH:mm:ss'),
            parkingId: json.info.parking_id,
            inDuration: json.in_duration,
            cardNumber: '*'
        }

        req.body.alipaySdk = new AlipaySdk({
            appId: json.auth_app_id,
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });

        json.alipaySdk.exec('alipay.eco.mycar.parking.order.sync', {
            // appId: json.auth_app_id,
            // appAuthToken: json.app_auth_token,
            bizContent: bizContent
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

function sync_yuen_order (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `update tb_order set status = $1`
        if (json.trade_status === 'TRADE_SUCCESS' || json.trade_status === 'TRADE_FINISHED') {
            sql += `, info = $2 where trade_no = $3 and type = $4`
        } else {
            sql = ` where trade_no = $2 and type = $3`;
        }
        let values = []
        if (json.trade_status === 'TRADE_SUCCESS' || json.trade_status === 'TRADE_FINISHED') {
            let info = json.info;
            info.alipay_trade_no = json.trade_no
            info.pay_type = 1

            values.push(constants.paid_status.success, info, json.trade_no, constants.auth_type.alipay);
        } else {
            values.push(constants.paid_status.failed, json.trade_no, constants.auth_type.alipay);
        }
        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);
            resolve(req);
        })
    })
}

function sync_tb_car (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        if (json.trade_status === 'TRADE_SUCCESS' || json.trade_status === 'TRADE_FINISHED') {
            let sql = `update tb_car_in_out_record set status = $1, pay_time = $2 where car_num = $3 and yuen_parking_id = $4 and status in ($5, $6)`
            let values = [constants.car_status.payed, json.gmt_payment, json.car_number, json.yuen_parking_id, constants.car_status.in, constants.car_status.payed]

            req.promise_params.client.query(sql, values, function (err, result) {
                if (err) return reject(err);

                resolve(req);
            })
        } else { // 支付未成功，不更新车辆信息
            resolve(req)
        }
    })
}