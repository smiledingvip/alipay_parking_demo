/**
 * Created by cg on 2017/5/9.
 */

"use strict";

var resp = require('./epm_respond');

const DataExists = 23505;
const KeyStillReferenced = 23503;

exports.transaction = function(sql_list, values_list, callback){
    var trackstr = track_str();
    var rollback = function(err, client, done) {
        console.log(err);
        client.query('ROLLBACK', function(error) {
            done(error);
            console.log(error);
            callback(err, trackstr);
        });
    };
    pool.connect(function(err, client, done){
        if (err) {
            //done(err);
            callback(err, trackstr);
            return;
        }
        client.query('BEGIN', function (err) {
            done(err);
            if (err) return rollback(err, client, done);
            do_transation(callback, sql_list, values_list, 0, client, rollback, done);
        });
    });
}

function do_transation(callback, sql_list, values_list, index, client, rollback, done){
    var sql = sql_list[index];
    var values = values_list[index];

    client.query(
        sql,
        values,
        function(err){
            done(err);
            if (err) return rollback(err, client, done);
            index ++;
            if (index < sql_list.length){
                do_transation(callback, sql_list, values_list, index, client, rollback, done);
            }else{
                do_commit(callback, client, rollback, done);
            }

        }
    )
}


function do_commit(callback, client, rollback, done){
    client.query('COMMIT', function(err){
        done(err);
        if (err) {
            return rollback(err, client, done);
        }
        callback(null);

        return;
    })
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

// exports.append_update_sql = function(sql, values, key, param, index, data_type){
//     if (param == undefined) return;
//     if (index > 1){
//         sql += ',';
//     }
//     if (data_type == undefined)
//         sql += ` ${key} = $${index}::text `;
//     else
//         sql += ` ${key} = $${index}::${data_type} `;
//     arguments[0] = sql;
//     values.push(param);
//     arguments[4] = index++;
// }

// exports.append_update_sql = function(info, key, param, data_type){
//     if (param == undefined) return;
//     if (info.index > 1){
//         info.sql += ',';
//     }
//     if (data_type == undefined) {
//         info.sql += ` ${key} = $${info.index}::text `;
//     }
//     else if (data_type == 'date'){
//         info.sql += `${key} = to_date($${info.index}::text, 'YYYY-MM-DD')`;
//     }else{
//         info.sql += ` ${key} = $${info.index}::${data_type} `;
//     }
//
//     info.index++;
//     info.values.push(param);
// }
exports.append_update_sql = function(info, key, param, data_type){
    if (param == undefined) return;
    if (info.index > 1){
        info.sql += ',';
    }
    if (data_type == undefined) {
        info.sql += ` ${key} = ? `;
    }
    else if (data_type == 'date'){
        info.sql += `${key} = DATE_FORMAT( ?, '%Y-%m-%d')`;
    }else{
        info.sql += ` ${key} = ? `;
    }
    info.index++;
    info.values.push(param);
}