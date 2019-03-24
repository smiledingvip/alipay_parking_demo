/**
 * Created on 2019/3/15.
 */
"use strict";

// 暂时没用

var resp = require('../../../../epm_respond');
// var check = require('../../check_authority');
// var sqlhelp = require('../../../mysql_help')

var transaction_step = require('../../../../transaction_step');

exports.query = function (req, res) {
    let json = req.body;
    console.log('参数', req.query, req.search)
    if (req.query && JSON.stringify(req.query) !== '{}') {
        res.type('html');
        res.render('orderdetail/orderdetail', {auth_code: req.query.auth_code, car_id: req.query.car_id, parking_id: req.query.parking_id})
        res.send({code: '10000'})
    }

    // res.write('ok')
    // if (resp.check_params(json.address, json.name, json.alipay_info, json.alipay_info.parking_type,
    //     json.alipay_info.gaode_poiid, json.alipay_info.mobile, json.alipay_info.pay_type, json.alipay_info.time_out,
    //     json.alipay_info.agent_id, json.alipay_info.mchnt_id) == false) {
    //     return resp.respond(resp.RespMsg.ParamsError, req, res);
    // }
}