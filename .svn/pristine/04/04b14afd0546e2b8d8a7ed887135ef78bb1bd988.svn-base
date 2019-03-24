/**
 * Created on 2019/3/15.
 */
"use strict";



var resp = require('../../../epm_respond');
// var check = require('../../check_authority');
// var sqlhelp = require('../../../mysql_help')

var transaction_step = require('../../../transaction_step');

exports.get_parking_id = function(req, res) {
    let json = req.body;

    if (resp.check_params(json.id) == false) {
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
            // .then(transaction_step.transaction_begin)
            .then(query_pg_parking_lot)
            // .then(query_alipay_parking_lot)
            // .then(update_alipay_parking_id)
            // .then(update_imgs_disable)
            // .then(update_imgs)
            // .then(update_imgcover)
            // .then(transaction_step.commit)
            .then((result) => {
                resp.respond_ok(req, res, result);
            })
            .catch((error) => {
                console.log('error', error);
                // transaction_step.rollback(error, client, done);
                return resp.respond(error.msg, req, res, error);
            });
    })

}


function query_pg_parking_lot (req) {
    return new Promise(function (resolve, reject) {
        let json = req.body;
        let sql = `select id, alipay_parking_id, weixin_parking_id  from tb_parking_lot where id = $1`;

        let values = [json.id];

        pool.query(sql, values, function(err, result){
            if (err){
                return reject(err);
            }
            console.log('result', result)
            if (result.length == 0){
                return reject(resp.gen_err(resp.RespMsg.ResourceNotFound));
            }

            resolve({id: result[0].id, alipay_parking_id: result[0].alipay_parking_id, weixin_parking_id: result[0].weixin_parking_id});
        })
    })
}

