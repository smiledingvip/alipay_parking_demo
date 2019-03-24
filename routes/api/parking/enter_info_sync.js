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

exports.enter_info_sync = function (req, res) {
    let json = req.body;

    if (resp.check_params(json.yuen_parking_id, json.car_number, json.in_time) == false) {
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
            .then(get_alipay_parking_id)
            .then(create_car_history)
            .then(enter_info_alipay_sync)
            // .then(query_alipay_parking_lot)
            // .then(update_alipay_parking_id)
            // .then(update_imgs_disable)
            // .then(update_imgs)
            // .then(update_imgcover)
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


function get_alipay_parking_id (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select tb_park.parking_id, tb_merchant.app_auth_token, tb_merchant.auth_app_id from tb_park, tb_merchant 
        where tb_park.yuen_parking_id = $1 and tb_park.type = $2 and tb_park.owner_id = tb_merchant.user_id and tb_park.type = tb_merchant.type`
        // let sql = `select * from tb_parking_lot`
        let values = [json.yuen_parking_id, constants.auth_type.alipay]

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err){
                return reject(err);
            }
            if (result.rows.length > 0) {
                console.log('row', result.rows)
                req.body.parking_id = result.rows[0].parking_id;
                req.body.app_auth_token = result.rows[0].app_auth_token;
                req.body.auth_app_id = result.rows[0].auth_app_id;
            } else {
                return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));
            }
            resolve(req);
        })
    })

}

function create_car_history (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `insert into tb_car_in_out_record (car_num, in_time, status, yuen_parking_id, alipay_parking_id, parking_name) values ($1, $2, $3, $4, $5, $6)`;
        let values = [json.car_number, moment(new Date(json.in_time)).format('YYYY-MM-DD HH:mm:ss'), constants.car_status.in, json.yuen_parking_id, json.parking_id, json.parking_name];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err){
                return reject(err);
            }
            resolve(req)
        })
    })
}

function enter_info_alipay_sync (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;

        req.body.alipaySdk = new AlipaySdk({
            appId: json.auth_app_id,
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });

        json.alipaySdk.exec('alipay.eco.mycar.parking.enterinfo.sync', {
            // appId: json.auth_app_id,
            // appAuthToken: json.app_auth_token,
            bizContent: {
                parking_id: json.parking_id,
                car_number: json.car_number,
                in_time: moment(new Date(json.in_time)).format('YYYY-MM-DD HH:mm:ss')
            }
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: _this.logger,
        }).then(result => {
            console.log('result', result);
            if (result.code === '10000') {
                // console.log('参数', req.body, json.car_number, moment(new Date(json.in_time)).format('YYYY-MM-DD HH:mm:ss'))
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