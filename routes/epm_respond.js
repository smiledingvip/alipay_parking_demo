/**
 * Created by cg on 2017/5/9.
 */
"use strict";

exports.RespMsg = {
    //成功
    OK:{
        code: 10000,
        msg: 'Success'
    },
    //重复插入数据
    DataExists : {
        code: 10001,
        msg: 'Data exists'
    },
    //外键冲突
    KeyStillReferenced : {
        code: 10002,
        msg: 'Key still referenced.'
    },
    // //验证码错误
    // VerifyCodeError : {
    //     code: 10009,
    //     msg: 'Verify code error.'
    // },

    ProductInfoErr:{
        code: 10100,
        msg: 'Product info error.'
    },

    //没有登录
    Unauthorized : {
        code: 11000,
        msg: 'Unauthorized, needs login.'
    },
    //没有权限
    Forbidden : {
        code: 11001,
        msg: 'Forbidden, no right to access.'
    },
    //无法登录
    LoginFailed : {
        code: 11002,
        msg: 'Login failed, username or password error.'
    },
    //账号被锁定
    UserLocked : {
        code: 11003,
        msg: 'Account was locked.'
    },
    //数据已被后续流程使用，不允许删除或修改
    DataLocked: {
        code: 11004,
        msg: 'Data has been used, not allow to be change.'
    },
    //业务流程错误
    InvalidFlow: {
        code: 11005,
        msg: 'Invalid flow.'
    },
    //业务流程错误
    HandlerNoCap: {
        code: 11006,
        msg: 'waste handler has no capability.'
    },
    //内部错误
    InternalServerError : {
        code: 11100,
        msg: 'Internal server error.'
    },
    //postgresql访问错误
    PostgresqlServerError : {
        code: 11101,
        msg: 'Postgresql error.'
    },
    //redis访问错误
    RedisServerError : {
        code: 11102,
        msg: 'Redis error.'
    },
    //api参数错误
    ParamsError : {
        code: 11103,
        msg: 'Api params error.'
    },
    //资源未找到
    ResourceNotFound: {
        code: 11104,
        msg: 'Resource not be found.'
    },

    //接口已废弃
    InterfaceDisabled : {
        code: 11105,
        msg: 'Interface disabled.'
    },
    //mysql访问错误
    MysqlServerError : {
        code: 11106,
        msg: 'Mysql error.'
    },
    //mysql访问错误
    UserExists : {
        code: 11107,
        msg: 'The account exists.'
    },
    // 支付宝数据库访问失败
    AlipayServerError: {
        code: 11108,
        msg: 'Alipay server error.'
    },
    VerifySignError: {
        code: 11109,
        msg: 'Verify sign error.'
    }
}

function extend(des, src, override){
    if(src instanceof Array){
        for(var i = 0, len = src.length; i < len; i++)
            extend(des, src[i], override);
    }
    for( var i in src){
        if(override || !(i in des)){
            des[i] = src[i];
        }
    }
    return des;
}


function track_str() {
    var info = stackInfo();
    var method = info['method'];
    var file = info['file'];
    var line = info['line'];
    return "<" + file + ":" + line + "> ";
}

function stackInfo() {
    var path = require('path');
    var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i;
    var stackReg2 = /at\s+()(.*):(\d*):(\d*)/i;
    var stacklist = (new Error()).stack.split('\n').slice(3);
    var s = stacklist[1];
    var sp = stackReg.exec(s) || stackReg2.exec(s);
    var data = {};
    if (sp && sp.length === 5) {
        data.method = sp[1];
        data.path = sp[2];
        data.line = sp[3];
        data.pos = sp[4];
        data.file = path.basename(data.path);
    }

    return data;
}

exports.respond_ok = function(req, res, result){
    var json = {};
    json.api = req.api;
    json.code = module.exports.RespMsg.OK.code;
    json.msg = module.exports.RespMsg.OK.msg;
    // console.log('看看', json, result)

    if (result != undefined)
        extend(json, result, true);
    res.json(json);
}

exports.check_params = function(...params){
    for (var param of params){
        if (param == undefined || param === ''){
            return false;
        }
    }

    return true;
}

exports.respond = function(msg, req, res, err){
    var json = {};
    json.api = req.api;
    if (msg){
        json.code = msg.code;
        json.msg = msg.msg;
        if(err && err.track){
            json.track = err.track;
        }else{
            json.track = track_str();
        }

    }
    else{
        if (err.code){

            switch(err.code){
                case '23505':
                    json.code = module.exports.RespMsg.DataExists.code;
                    json.msg = module.exports.RespMsg.DataExists.msg;
                    json.track = track_str();
                    break;
                case '23503':
                    json.code = module.exports.RespMsg.KeyStillReferenced.code;
                    json.msg = module.exports.RespMsg.KeyStillReferenced.msg;
                    json.track = track_str();
                    break;
                default:
                    json.code = module.exports.RespMsg.InternalServerError.code;
                    json.msg = module.exports.RespMsg.InternalServerError.msg;
                    json.track = track_str();
                    break;
            }
        }else{
            json.code = module.exports.RespMsg.InternalServerError.code;
            json.msg = module.exports.RespMsg.InternalServerError.msg;
            json.track = track_str();
        }

    }


    if (err){
        json.err = '';
        if (err.code){
            // json.err += '<'+err.code+'> ';
            json.err += `<${err.code}>`;
        }
        if (err.message){
            json.err += err.message;
        }
        if (json.err == ''){
            delete json.err;
        }
    }

    console.log(json);
    res.json(json);
}


exports.gen_err = function(msg){
    var err = {
        msg:msg,
        track: track_str()
    }
    return err;
}
