/**
 * Created by vincent on 2018/3/26.
 */

"use strict";

var resp = require('./epm_respond');


exports.transaction_begin = function(req){
    return new Promise(function (resolve, reject) {
        req.promise_params.client.query('BEGIN', function (err) {
            // req.promise_params.client.release();
            if (err)  return reject(err);
            resolve(req);
        });
    })
}

exports.commit = function(req){
    return new Promise(function (resolve, reject) {
        req.promise_params.client.query('COMMIT', function(err){
            // req.promise_params.client.release();
            req.promise_params.done()
            if (err) {
                return reject(err)
            }

            return resolve(req.res_json)
        })
    })
}

exports.rollback = function(error, client, done) {
    // console.log('进来回滚了吗')
    client.query('ROLLBACK', function(err) {
        if (err) {
            console.error('Error rolling back client', err.stack)
        }
        console.log('成功回滚')
        // client.release();//MYSQL释放连接到连接池
        done()
        return;
    });
};