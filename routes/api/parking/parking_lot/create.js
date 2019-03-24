/**
 * Created on 2019/3/15.
 */
"use strict";



var resp = require('../../../epm_respond');
// var check = require('../../check_authority');
// var sqlhelp = require('../../../mysql_help');
var constants = require('../../../constants').constants;

var transaction_step = require('../../../transaction_step');

exports.create = function(req, res) {
    let json = req.body;

    if (resp.check_params(json.address, json.name, json.yuen_parking_id, json.alipay_info, json.alipay_info.parking_type,
            json.alipay_info.parking_poiid, json.alipay_info.parking_mobile, json.alipay_info.pay_type, json.alipay_info.time_out,
            json.alipay_info.mchnt_id, json.customer_id) == false) {
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
            .then(create_pg_parking_lot)
            .then(create_alipay_parking_lot)
            .then(update_alipay_parking_id)
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
        let sql = `select app_auth_token, auth_app_id, user_id from tb_merchant where customer_id = $1 and type = $2`;
        let values = [json.customer_id, constants.auth_type.alipay];

        req.promise_params.client.query(sql, values, function (err, result) {
            if (err) return reject(err);

            if (result.rows.length === 0) return reject(resp.gen_err(resp.RespMsg.ResourceNotFound))

            req.body.app_auth_token = result.rows[0].app_auth_token;
            req.body.auth_app_id = result.rows[0].auth_app_id;
            req.body.owner_id = result.rows[0].user_id;
            resolve(req);
        })
    })
}

function create_pg_parking_lot (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `insert into tb_park (address, name, info, yuen_parking_id, owner_id, customer_id, type) values ($1, $2, $3, $4, $5, $6)`;

        let values = [json.address, json.name];
        let alipay_info = {
            parking_type: json.alipay_info.parking_type,
            parking_poiid: json.alipay_info.parking_poiid,
            parking_mobile: json.alipay_info.parking_mobile,
            pay_type: json.alipay_info.pay_type,
            time_out: json.alipay_info.time_out,
            // agent_id: json.alipay_info.agent_id,
            mchnt_id: json.alipay_info.mchnt_id
        }
        if (json.alipay_info.shoppingmall_id) {
            alipay_info.shoppingmall_id = json.alipay_info.shoppingmall_id
        }
        if (json.alipay_info.parking_fee_description) {
            alipay_info.parking_fee_description = json.alipay_info.parking_fee_description
        }
        if (json.alipay_info.agent_id) {
            alipay_info.agent_id = json.alipay_info.agent_id
        }
        values.push(alipay_info, json.yuen_parking_id, json.owner_id, json.customer_id, constants.auth_type.alipay);


        req.promise_params.client.query(sql, values, function(err, result){
            if (err){
                return reject(err);
            }
            // console.log('result', result)
            // if (result.rows) {
            //     req.body.yuen_parking_id = result.rows[0].id
            // } else {
            //     return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));
            // }

            resolve(req);
        })
    })
}


function create_alipay_parking_lot (req) {
    // console.log('req.body', req.body)
    return new Promise(function (resolve, reject) {
        var json = req.body;

        req.body.alipaySdk = new AlipaySdk({
            appId: json.auth_app_id,
            privateKey: SDK_APP_PRIVATE_KEY, // 正式应用私钥
            alipayPublicKey: SDK_ALIPAY_PUBLIC_KEY // 正式应用公钥
            // privateKey: fs.readFileSync('./sandbox_app_private_key.txt', 'ascii'), // 沙盒第三方应用私钥
            // alipayPublicKey: fs.readFileSync('./sandbox_alipay_public_key.txt', 'ascii') // 沙盒第三方应用公钥
        });

        json.alipaySdk.exec('alipay.eco.mycar.parking.parkinglotinfo.create', {
            // appId: json.auth_app_id,
            // appAuthToken: json.app_auth_token,
            bizContent: {
                out_parking_id: String(json.yuen_parking_id),
                parking_address: json.address,
                parking_lot_type: String(json.alipay_info.parking_type),
                parking_poiid: json.alipay_info.parking_poiid,
                parking_mobile: json.alipay_info.parking_mobile,
                pay_type: json.alipay_info.pay_type,
                shopingmall_id: json.alipay_info.shopingmall_id || '',
                parking_fee_description: json.alipay_info.parking_fee_description || '',
                parking_name: json.name,
                time_out: String(json.alipay_info.time_out),
                agent_id: json.alipay_info.agent_id,
                mchnt_id: json.alipay_info.mchnt_id
            }
        }, {
            // 验签
            validateSign: true,
            // 打印执行日志
            // log: _this.logger,
        }).then(result => {
            console.log('result', result);
            if (result.code === '10000' && result.parkingId) {
                req.body.parking_id = result.parkingId
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

function update_alipay_parking_id (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `update tb_park set parking_id = $1 where yuen_parking_id = $2 and type = $3`;
        let values = [json.parking_id, json.yuen_parking_id, constants.auth_type.alipay];
        req.promise_params.client.query(sql, values, function(err, result){
            if (err){
                return reject(err);
            }
            resolve(req);
        })
    })
}