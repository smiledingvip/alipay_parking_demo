var win_url = window.location.href.indexOf(window.location.pathname);
console.log("y1 = " + window.location.href);
console.log("y2 = " + win_url);
const WEBAPI_URL = window.location.href.substring(0,win_url+1);
console.log("y3 = " + WEBAPI_URL);

   // var app_baseurl = 'http://192.168.1.199:6002/';
// var app_baseurl = 'http://www.hz-yuen.cn/';
// var app_baseurl = 'http://www.hz-yuen.cn:8087/';
// var app_baseurl = 'http://localhost:8087/';
// app_baseurl = 'http://127.0.0.1:6003/';
app_baseurl = WEBAPI_URL;
var app_api = app_baseurl + 'api/';
page_base_url = app_baseurl + 'h5';
// page_base_url = 'http://' + window.location.host + '/h5';
// page_base_url = 'http://127.0.0.1/'
// var hostUrl = page_base_url + '/index1.html';
// var app_api_ocr = 'https://api-cn.faceplusplus.com/cardpp/v1/ocridcard';
// var app_api_ocr_key = 'SmfGS-k_vtHaPpPU-d_VOhyVr5foF_cB';
// var app_api_ocr_secret = 'c96g1jWMj5wvCpm5FHu_LznGwOFGoGS7';
// var wx_outhor_url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx1705612aeb142957&redirect_uri=' + encodeURIComponent(hostUrl) + '&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
//
// var app_page_size = 20;
// var app_large_pagesize = 99999;

var errordef = {
    //成功
    OK:{
        code: 10000,
        msg: '操作成功.'
    },
    //重复插入数据
    DataExists : {
        code: 10001,
        msg: '重复插入数据.'
    },
    //外键冲突
    KeyStillReferenced : {
        code: 10002,
        msg: '外键冲突.'
    },
    // //验证码错误
    // VerifyCodeError : {
    //     code: 10009,
    //     msg: 'Verify code error.'
    // },

    ProductInfoErr:{
        code: 10100,
        msg: '商品信息错误.'
    },

    //没有登录
    Unauthorized : {
        code: 11000,
        msg: '没有登录,请先登录.'
    },
    //没有权限
    Forbidden : {
        code: 11001,
        msg: '没有权限.'
    },
    //无法登录
    LoginFailed : {
        code: 11002,
        msg: '无法登录, 用户名或者密码错误.'
    },
    //账号被锁定
    UserLocked : {
        code: 11003,
        msg: '账号被锁定.'
    },
    //数据已被后续流程使用，不允许删除或修改
    DataLocked: {
        code: 11004,
        msg: '数据已被后续流程使用，不允许删除或修改.'
    },
    //业务流程错误
    InvalidFlow: {
        code: 11005,
        msg: '业务流程错误.'
    },

    //内部错误
    InternalServerError : {
        code: 11100,
        msg: '内部错误.'
    },
    //postgresql访问错误
    PostgresqlServerError : {
        code: 11101,
        msg: '数据库访问错误.'
    },
    //redis访问错误
    RedisServerError : {
        code: 11102,
        msg: 'Redis数据库访问错误.'
    },
    //api参数错误
    ParamsError : {
        code: 11103,
        msg: '接口参数错误.'
    },
    //资源未找到
    ResourceNotFound: {
        code: 11104,
        msg: '资源未找到.'
    },

    //接口已废弃
    InterfaceDisabled : {
        code: 11105,
        msg: '接口已废弃.'
    },
    MysqlServerError : {
        code: 11106,
        msg: '数据库错误.'
    },
    UserExists : {
        code: 11107,
        msg: '该账号已经存在，请分配其他账号.'
    },

    Unknown:{
        code: -1,
        msg: '未知错误！'
    }
};

var constants = {

};
function err_translate(code) {
    var msg = "未知错误";
    for (var prop in errordef) {
        if (errordef[prop].code == code) {
            msg = errordef[prop].msg;
            break;
        }
    }
    return msg;
}


function getimgurl(id) {
    if (!!id) {
        return app_baseurl + 'get_img?id=' + id
    } else {
        return "";
    }
}

function customertype_traslate(type) {
    if (type == constants.domain_type.govern_unit) {
        return "行政单位";
    } else if (type == constants.domain_type.boat_unit) {
        return "重点船";
    } else if (type == constants.domain_type.shop_unit) {
        return "普通商户";
    } else if (type == constants.domain_type.second_hand_car_unit) {
        return "二手车";
    } else if (type == constants.domain_type.dock_unit) {
        return "码头";
    } else if (type == constants.domain_type.car_rent_unit) {
        return "汽车租赁商户";
    }
}

function role_traslate(role) {
    if (role == constants.role.root) {
        return "管理员";
    } else if (role == constants.role.admin) {
        return "管理员";
    } else if (role == constants.role.normal) {
        return "普通用户";
    }
}


function ApiParam() {
    var para = {
        v: '1.0',
        app_key: '1BEC46CF-AA48-4DCF-A744-CB6450F21384',
        app_pass: 'BA444698-AFAC-459F-AA7B-63A085B63602',
        access_token: window.localStorage.getItem('access_token')
    };
    return para;
}

function get_governdomain() {
    var govern_domain = window.localStorage.getItem('govern_domain');
    return govern_domain;
}

function get_userrole() {
    var user_role = window.localStorage.getItem('user_role');
    return user_role;
}

function get_user_domain_type() {
    return window.localStorage.getItem('domain_type');
}

function date_format(date, fmt) { //author: meizz
    var o = {
        "M+": date.getMonth() + 1,                 //月份
        "d+": date.getDate(),                    //日
        "h+": date.getHours(),                   //小时
        "m+": date.getMinutes(),                 //分
        "s+": date.getSeconds(),                 //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds()             //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

// 获取url后面的参数转换成json
function GetRequest() {

    var url = location.search; //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]]=(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}

/*
* 获取上一个月
*
* @date 格式为yyyy-mm-dd的日期，如：2014-01-25
*/
function getPreMonth(date) {
    var arr = date.split('-');
    var year = arr[0]; //获取当前日期的年份
    var month = arr[1]; //获取当前日期的月份
    var day = arr[2]; //获取当前日期的日
    var days = new Date(year, month, 0);
    days = days.getDate(); //获取当前日期中月的天数
    var year2 = year;
    var month2 = parseInt(month) - 1;
    if (month2 == 0) {
        year2 = parseInt(year2) - 1;
        month2 = 12;
    }
    var day2 = day;
    var days2 = new Date(year2, month2, 0);
    days2 = days2.getDate();
    if (day2 > days2) {
        day2 = days2;
    }
    if (month2 < 10) {
        month2 = '0' + month2;
    }
    var t2 = year2 + '-' + month2 + '-' + day2;
    return t2;
}

/**
 * 获取下一个月
 *
 * @date 格式为yyyy-mm-dd的日期，如：2014-01-25
 */
function getNextMonth(date) {
    var arr = date.split('-');
    var year = arr[0]; //获取当前日期的年份
    var month = arr[1]; //获取当前日期的月份
    var day = arr[2]; //获取当前日期的日
    var days = new Date(year, month, 0);
    days = days.getDate(); //获取当前日期中的月的天数
    var year2 = year;
    var month2 = parseInt(month) + 1;
    if (month2 == 13) {
        year2 = parseInt(year2) + 1;
        month2 = 1;
    }
    var day2 = day;
    var days2 = new Date(year2, month2, 0);
    days2 = days2.getDate();
    if (day2 > days2) {
        day2 = days2;
    }
    if (month2 < 10) {
        month2 = '0' + month2;
    }

    var t2 = year2 + '-' + month2 + '-' + day2;
    return t2;
}

function xreader(file, callback) {
    var Orientation;
    var all_file_info
    EXIF.getData(file, function() {
        all_file_info = EXIF.getAllTags(file);
        Orientation = EXIF.getTag(file,'Orientation');
    });
    // 压缩图片需要的一些元素和对象
    var reader = new FileReader(), img = new Image();

// 选择的文件对象
//     var file = null;

// 缩放图片需要的canvas
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

// base64地址图片加载完毕后
    img.onload = function () {

        // 图片原始尺寸
        var originWidth = this.width;
        var originHeight = this.height;
        // 最大尺寸限制
        var maxWidth = 800, maxHeight = 800;
        // 目标尺寸
        var targetWidth = originWidth, targetHeight = originHeight;
        // 图片尺寸超过400x400的限制
        if (originWidth > maxWidth || originHeight > maxHeight) {
            if (originWidth / originHeight > maxWidth / maxHeight) {
                // 更宽，按照宽度限定尺寸
                targetWidth = maxWidth;
                targetHeight = Math.round(maxWidth * (originHeight / originWidth));
            } else {
                targetHeight = maxHeight;
                targetWidth = Math.round(maxHeight * (originWidth / originHeight));
            }
        }

        // canvas对图片进行缩放

        // 清除画布
        context.clearRect(0, 0, targetWidth, targetHeight);
        // context.drawImage(img, 0, 0, targetWidth, targetHeight);
        // var test_div = document.createElement('DIV');
        // test_div.setAttribute('id', 'testdiv')
        // test_div.style.cssText= 'position: absolute; top: 0; right: 0;bottom: 0;left: 0;'
        // document.getElementsByTagName('body')[0].appendChild(test_div)
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        if (Orientation) {
            switch (Orientation){
                case 3: //3表示图片是上下颠倒的
                    context.rotate(180 * Math.PI / 180);
                    context.drawImage(img, -targetWidth, -targetHeight, targetWidth, targetHeight);
                    break;
                case 6: // 6代表图片需要顺时针（向左）
                    // document.getElementById('testdiv').innerText='6'
                    context.save();//保存状态
                    context.translate(targetWidth / 2, targetHeight / 2);//设置画布上的(0,0)位置，也就是旋转的中心点
                    context.rotate(90 * Math.PI / 180);//把画布旋转90度
                    context.drawImage(img, -targetHeight/2, - targetWidth/2, targetHeight, targetWidth);//把图片绘制在画布translate之前的中心点，
                    context.restore();//恢复状态
                    break;
                case 8: //8代表需要逆时针（向右）90度旋转
                    // document.getElementById('testdiv').innerText='8'
                    context.save();//保存状态
                    context.translate(targetWidth / 2, targetHeight / 2);//设置画布上的(0,0)位置，也就是旋转的中心点
                    context.rotate(-90 * Math.PI / 180);
                    context.drawImage(img, -targetHeight/2, -targetWidth/2, targetHeight, targetWidth);//把图片绘制在画布translate之前的中心点，
                    context.restore();//恢复状态
                    break;
                default:
                    // document.getElementById('testdiv').innerText='1'
                    // canvas.width = targetWidth;
                    // canvas.height = targetHeight;
                    context.drawImage(img, 0, 0, targetWidth, targetHeight);
            }
        } else {
            // document.getElementById('testdiv').innerText= all_file_info ? JSON.stringify(all_file_info) : 'none'
            context.drawImage(img, 0, 0, targetWidth, targetHeight);
        }


        // canvas转为blob并上传
        canvas.toBlob(function (blob) {
            // 图片ajax上传
            // var xhr = new XMLHttpRequest();
            // // 文件上传成功
            // xhr.onreadystatechange = function() {
            //     if (xhr.status == 200) {
            //         // xhr.responseText就是返回的数据
            //     }
            // };
            // // 开始上传
            // xhr.open("POST", 'upload.php', true);
            // xhr.send(blob);
            callback(blob);
        }, file.type || 'image/png');
    };

// 文件base64化，以便获知图片原始尺寸
    reader.onload = function(e) {
        var e = e || window.event;
        var target = e.target || e.srcElement;
        img.src = target.result;
    };

    return reader;
}

function GetQueryString(name) {  
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");  
    var r = window.location.search.substr(1).match(reg);  //获取url中"?"符后的字符串并正则匹配
    var context = "";  
    if (r != null)  
         context = r[2];  
    reg = null;  
    r = null;  
    return context == null || context == "" || context == "undefined" ? "" : context;  
}
myloading = {
    img: page_base_url + '/img/loading.gif',
    creatId: function () {
        return new Date().getTime() + Math.random().toString().substr(3);
    },
    thisid: null,
    html: function () {
        return '        <div>\n' +
            '            <div style="background: transparent;padding: 0.3rem;border-radius: 0.1rem">\n' +
            '                <img src="' + this.img + '" style="width: 0.5rem;height: 0.5rem"/>\n' +
            '            </div>\n' +
            '            <p style="color: transparent;"></p>\n' +
            '        </div>\n'
    },
    show: function () {
        var nonde = document.createElement("DIV");
        var id = this.creatId();
        nonde.setAttribute('id', id);
        nonde.style.cssText = "position: absolute;top: 0;left: 0;bottom: 0;right: 0;z-index: 9999;display: flex;justify-content: center;align-items: center;background: rgba(0,0,0,.01)";
        document.getElementsByTagName('body')[0].appendChild(nonde);
        nonde.innerHTML = this.html();
        return id;
    },
    hide: function (id) {
        // if (document.readyState == "complete") {
        var loadingMask = document.getElementById(id);
        loadingMask && loadingMask.parentNode.removeChild(loadingMask);
        // }
    }
}

   // document.addEventListener('WeixinJSBridgeReady', function onBridgeReady() {
   //
   //     WeixinJSBridge.call('hideToolbar');
   //
   // });