/**
 * Created by cg on 2017/5/9.
 */
"use strict";
var resp = require('../epm_respond');


exports.route = function(req, res, next){

    Promise.resolve(req)
        // .then(check_app_key)
        // .then(check_access_token)
        // .then(check_right)
        .then(do_api_route)
        .then((route) =>{
            route(req, res);
        })
        .catch((error) => {
            if (!error){
                return next();
            }
            resp.respond(error.msg, req, res, error);
        });
}


function check_app_key(req){

    return new Promise(function(resolve, reject){
        let json ;
        if (req.body.json != undefined){
            json = req.body.json;
        }
        else{
            json = req.body;
        }
        let sql = 'select id from tb_account_app where app_key= ? and app_pass= ? ';
        let values  = [json.app_key, json.app_pass];

        pool.query(sql, values, function(err, result){
            if (err){
                return reject(err);
            }

            if (result.length <= 0){
                return reject(resp.gen_err(resp.RespMsg.Forbidden));
            }

            var app_id = result[0].id;
            req.app_id = app_id;
            resolve(req);
        })
    })
}

function check_access_token(req){
    return new Promise(function(resolve, reject){
        let json ;
        if (req.body.json != undefined){
            json = req.body.json;
        }
        else{
            json = req.body;
        }
        if (json.access_token == undefined){
            return reject(resp.gen_err(resp.RespMsg.Unauthorized));
        }

        redis.hgetall(json.access_token, function(err, result){
            if (err){
                return reject(resp.gen_err(resp.RespMsg.RedisServerError))
            }

            if (result == null){
                return reject(resp.gen_err(resp.RespMsg.Unauthorized));
            }

            let user_info = result;
            if (user_info.app_key != json.app_key || user_info.app_pass != json.app_pass){
                return reject(resp.gen_err(resp.RespMsg.Forbidden));
            }
            // json.user = user_info.userid;

            req.user = {
                uid: user_info.userid,
                user: user_info.user_name,
                role: Number(user_info.user_role),
                govern_domain: Number(user_info.govern_domain),
                domain_type: Number(user_info.domain_type)
            }
            redis.expire(json.access_token, 3600);

            resolve(req);
        })
    })
}

function check_right(req){

    return new Promise(function(resolve, reject){

        let json ;
        if (req.body.json != undefined){
            json = req.body.json;
        }
        else{
            json = req.body;
        }

        if (json.user == ADMINISTRATOR){
            return resolve(req);
        }

        let sql = 'select tb_account_role_func.role_id, tb_sys_function.api, tb_sys_function.rw \
                from tb_sys_function, tb_account_role_func \
                where (role_id in (select role_id from tb_account_user_role where user_id= ?) \
                and tb_sys_function.id = tb_account_role_func.function_id \
                and tb_sys_function.api = ?) or (tb_sys_function.check_auth=false and tb_sys_function.api = ?);'
        let values = [json.user, req.api, req.api];
        pool.query(sql, values, function(err, result){
            if (err){
                return reject(err);
            }

            if (result.length < 1){
                return reject(resp.gen_err(resp.RespMsg.Forbidden));
            }
            resolve(req);
        })
    })
}


function do_api_route(req){

    return new Promise(function(resolve, reject){
        var api = req.api;

        let api_part = api.split('.');
        if (api_part[1] == 'document' && api_part[2] != 'file'){
            req.body.template_id = api_part[2];
            api = 'enterprise.document.info.'+api_part[3];
        }
        var path = api;

        var len = path.length;
        var c = path.charAt(len - 1);

        if (c == '/' || !c) path += 'index';
        var pathArr = path.split('.');

        var requirePath = '/';
        var requestMethod = pathArr[pathArr.length - 1];


        for (let i = 0; i < pathArr.length - 1; i++) {
            requirePath = requirePath + pathArr[i] + "/";
        }

        var route;
        try {

            route = require(HTTPS_ROUTES_PATH + requirePath + requestMethod);
            console.log(HTTPS_ROUTES_PATH + requirePath + requestMethod+'---------')
            console.log('route', route, requestMethod)
            if (route[requestMethod] != null) {
                // console.log('??')
                return resolve(route[requestMethod]);
            }
            else {
                // console.log('????')
                return reject(null);
            }
        }catch(err){
            console.log(err);
            return reject(err);
        }
    })
}