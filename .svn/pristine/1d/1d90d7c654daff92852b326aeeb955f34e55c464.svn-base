window.axiosReq = function(url, para, callback, method){
	var params = para;
    mui.showLoading("正在加载..","div");
	console.log('para', para)
	// debugger
	axios({
		method: method? method: 'post',
		url: url,
		timeout: 10000,
		responseType: 'json',
		params: params,
		data: params
	}).then(function (response) {
        mui.hideLoading();
		// mui.toast('登陆成功',{ duration:'long', type:'div' })
		console.log('axiosrespo----nse', response)
        // myloading.hide(windex);
		if (response.status>=200 && response.status<300) {
			console.log('response', response)
			// debugger
			if (response && response.data && response.data.code === errordef.OK.code) {
				callback(null, response.data);
			} else if (response.data.code === errordef.Unauthorized.code){
                window.location = page_base_url;
			} else {
                callback(err_translate(response.data.code), response.data)
                mui.toast(err_translate(response.data.code),{ duration:'long', type:'div' })
                // app.showToast(err_translate(response.data.code));
			}
		} else {
            mui.toast(err_translate(response.data.code),{ duration:'long', type:'div' })
            // app.showToast(err_translate(errordef.Unknown.code));
			callback(err_translate(errordef.Unknown.code));
		}
	}).catch(function (response) {
        mui.hideLoading();
		// myloading.hide(windex);
		callback(response);
	})
};
