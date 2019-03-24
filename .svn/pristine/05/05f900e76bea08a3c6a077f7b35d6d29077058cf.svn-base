/**
 * Created by cg on 2019/3/17.
 */
"use strict";

var moment = require('moment');
const crypto = require('crypto');

exports.create_order_num = function (parking_id) {
    let day = new Date()
    return moment().format('YYYYMMDDHHmmss') + parking_id + Math.random().toString().substr(2,3)
}

//将支付宝发来的数据生成有序数列
function getVerifyParams(params, needSignType) {
    var sPara = [];
    if(!params) return null;
    if (needSignType) { // 需要保留sign_type字段
        for(var key in params) {
            if((!params[key]) || key == "sign") {
                continue;
            };
            sPara.push([key, params[key]]);
        }
    } else { // 不需要保留sign_type字段
        for(var key in params) {
            if((!params[key]) || key == "sign" || key == "sign_type") {
                continue;
            };
            sPara.push([key, params[key]]);
        }
    }

    sPara = sPara.sort();
    var prestr = '';
    for(var i2 = 0; i2 < sPara.length; i2++) {
        var obj = sPara[i2];
        if(i2 == sPara.length - 1) {
            prestr = prestr + obj[0] + '=' + obj[1] + '';
        } else {
            prestr = prestr + obj[0] + '=' + obj[1] + '&';
        }
    }
    return prestr;
}

//验签RSA2
exports.veriySign = function (params, signType, needSignType) {
    try {
        // var publicPem = fs.readFileSync('./alipay_public_key.txt');
        var publicKey = '-----BEGIN PUBLIC KEY-----\r\n' + ALIPAY_PUBLIC_KEY + '\r\n-----END PUBLIC KEY-----';
        // var publicKey = '-----BEGIN PUBLIC KEY-----\r\n' + config.alipay.ALIPAY_PUBLIC_KEY + '\r\n-----END PUBLIC KEY-----';
        console.log('支付宝公钥', publicKey)
        var prestr = getVerifyParams(params, needSignType);
        console.log('prestr', prestr)
        var sign = params['sign'] ? params['sign'] : "";
        console.log('sign', sign)
        if (signType.toUpperCase() === 'RSA2') {
            var verify = crypto.createVerify('RSA-SHA256');
        } else if (signType.toUpperCase() === 'RSA') {
            sign = crypto.createSign("RSA-SHA1");
        } else {
            throw new Error('请传入正确的签名方式，signType：' + signType);
        }
        // var verify = crypto.createVerify('SHA256');
        verify.update(prestr);
        return verify.verify(publicKey, sign, 'base64')

    } catch(err) {
        console.log('veriSign err', err)
    }
}

//签名
exports.getSign = function (boolean) {
    try {
        // 读取秘钥
        // var privatePem = fs.readFileSync('./app_private_key.txt');
        var key = '-----BEGIN RSA PRIVATE KEY-----\r\n' + APP_PRIVATE_KEY + '\r\n-----END RSA PRIVATE KEY-----';
        console.log('app_private_key', APP_PRIVATE_KEY)
        var prestr = `<biz_content>${APP_PUBLIC_KEY}</biz_content><success>${boolean}</success>`
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(prestr);
        sign = sign.sign(key, 'base64');
        return sign
    } catch(err) {
        console.log('err', err)
    }
}