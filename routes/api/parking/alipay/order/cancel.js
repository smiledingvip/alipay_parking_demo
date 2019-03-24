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

exports.cancel = function (req, res) {
    let json = req.body;

    if (resp.check_params(json.alipay_order_number) == false) {
        return resp.respond(resp.RespMsg.ParamsError, req, res);
    }

    Promise.resolve(req)
    .then(cancel_order)
    .then((result) => {
        resp.respond_ok(req, res, result);
    })
    .catch((error) => {
        console.log('error', error);
        return resp.respond(error.msg, req, res, error);
    });
}

function cancel_order (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;

        let sql = `update tb_order set status = $1 where trade_no = $2 and type = $3`;
        let values = [constants.paid_status.cancel, json.alipay_order_number, constants.auth_type.alipay];

        pool.query(sql, values, function (err, result) {
            if (err) return reject(err);
            resolve(req);
        })
    })
}