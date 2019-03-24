/**
 * Created by vincent on 2018/4/15.
 */
"use strict";

var xml2js = require('xml2js');
const crypto = require('crypto');
const fs = require('fs');
var pay_help = require('../../../pay_help')
const alipay_public_key = fs.readFileSync('./alipay_public_key.txt').toString()
const app_public_key = fs.readFileSync('./app_public_key.txt').toString()
const app_private_key = fs.readFileSync('./app_private_key.txt').toString()

exports.check = function(req, res){
    var json = req.body
    console.log('body', json)
    // var hashes = crypto.getHashes();
    // console.log(hashes); // ['DSA', 'DSA-SHA', 'DSA-SHA1', ...]
    var jsonBuilder  = new xml2js.Builder({xmldec:{
            version:'1.0',
            encoding: 'GBK'}});
    let boolean = pay_help.veriySign(json, 'RSA2', true)
    var obj = {
        alipay:{
            response: {
                biz_content: APP_PUBLIC_KEY,
                success: boolean
            },
            sign: pay_help.getSign(boolean),
            sign_type: 'RSA2'
        }
    };
    // let xml = `<?xml version="1.0" encoding="GBK"?>
    // <alipay>
    //     <response>
    //         <biz_content>MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDQWiDVZ7XYxa4CQsZoB3n7bfxLDkeGKjyQPt2FUtm4TWX9OYrd523iw6UUqnQ+Evfw88JgRnhyXadp+vnPKP7unormYQAfsM/CxzrfMoVdtwSiGtIJB4pfyRXjA+KL8nIa2hdQy5nLfgPVGZN4WidfUY/QpkddCVXnZ4bAUaQjXQIDAQAB</biz_content>
    //         <success>true</success>
    //     </response>
    //     <sign>DXr8LVfHytoZ3RR0K95pzGtA3d9LdpjIjLEis2BDIPQisPwS+FMFxZt9NCMt531EeDj/nbzoIAz8Or7PuqxNfSzNI8qnhirm/Hvr8uedXX9JiQxHu8q3Rw2lJWD8cqQzgf3xwV/+wbN8yuI7s8xjo6odq6NCqrAIu7E0DDfZyKo=</sign>
    //     <sign_type>RSA2</sign_type>
    // </alipay>`

    var xml = jsonBuilder.buildObject(obj);
    console.log('xml', xml)
    // console.log('response', res)
    res.set('Content-Type', 'text/xml;charset=GBK');
    // res.writeHead(200, { 'Content-Type': 'text/xml;charset=GBK' });
    res.send(xml)
}

// //将支付宝发来的数据生成有序数列
// function getVerifyParams(params) {
//     var sPara = [];
//     if(!params) return null;
//     for(var key in params) {
//         if((!params[key]) || key == "sign") {
//             continue;
//         };
//         sPara.push([key, params[key]]);
//     }
//     sPara = sPara.sort();
//     var prestr = '';
//     for(var i2 = 0; i2 < sPara.length; i2++) {
//         var obj = sPara[i2];
//         if(i2 == sPara.length - 1) {
//             prestr = prestr + obj[0] + '=' + obj[1] + '';
//         } else {
//             prestr = prestr + obj[0] + '=' + obj[1] + '&';
//         }
//     }
//     return prestr;
// }
//
// //验签
// function veriySign(params) {
//     try {
//         // var publicPem = fs.readFileSync('./alipay_public_key.txt');
//         var publicKey = '-----BEGIN PUBLIC KEY-----\r\n' + ALIPAY_PUBLIC_KEY + '\r\n-----END PUBLIC KEY-----';
//         // var publicKey = '-----BEGIN PUBLIC KEY-----\r\n' + config.alipay.ALIPAY_PUBLIC_KEY + '\r\n-----END PUBLIC KEY-----';
//         console.log('支付宝公钥', publicKey)
//         var prestr = getVerifyParams(params);
//         console.log('prestr', prestr)
//         var sign = params['sign'] ? params['sign'] : "";
//         console.log('sign', sign)
//         var verify = crypto.createVerify('RSA-SHA256');
//         // var verify = crypto.createVerify('SHA256');
//         verify.update(prestr);
//         return verify.verify(publicKey, sign, 'base64')
//
//     } catch(err) {
//         console.log('veriSign err', err)
//     }
// }
//
// //签名
// function getSign(boolean) {
//     try {
//         // 读取秘钥
//         // var privatePem = fs.readFileSync('./app_private_key.txt');
//         var key = '-----BEGIN RSA PRIVATE KEY-----\r\n' + APP_PRIVATE_KEY + '\r\n-----END RSA PRIVATE KEY-----';
//         console.log('app_private_key', APP_PRIVATE_KEY)
//         var prestr = `<biz_content>${APP_PUBLIC_KEY}</biz_content><success>${boolean}</success>`
//         var sign = crypto.createSign('RSA-SHA256');
//         sign.update(prestr);
//         sign = sign.sign(key, 'base64');
//         return sign
//     } catch(err) {
//         console.log('err', err)
//     }
// }