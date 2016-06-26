/*===========================
dialog
===========================*/
+ function($) {
    "use strict";

    var default_opts = {
    	title:'',
    	content:'',
    	btn:[],
    	background:'#fff',
    	skin:'',
        btns:[],
    	shade:true,
    	shadeClose:false,
    };

    jinui.modal = function(options){
    	var opts = $.extend({},default_opts, options);

    	var _html = '<div class="jinui_dialog">';

    	if(opts.shade){
    		_html += '<div class="jinui_mask_transparent"></div>';
    	}

    	_html += '<div class="jinui_dialog_inner"><div class="jinui_dialog_bd">'+ opts.content +'</div></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	$(obj).find('.jinui_dialog_inner').css({
    		background:opts.background
    	});
    	$(obj).addClass(opts.skin);


    	$(obj).delegate('[jinui-dialog-btn="close"]', 'click', function(event) {
    		$(obj).remove();
    	});

    	if(opts.shadeClose){
    		$(obj).delegate('.jinui_mask_transparent', 'click', function(event) {
	    		$(obj).remove();
	    	});
    	}
    };

    jinui.dialog = function(options){
        var opts = $.extend({},default_opts, options);

        var _html = '<div class="jinui_dialog jinui_dialog_confirm"><div class="jinui_mask_transparent"></div><div class="jinui_dialog_inner"><div class="jinui_dialog_hd"><strong class="jinui_dialog_title">'+ opts.title +'</strong></div><div class="jinui_dialog_bd">'+ opts.content +'</div><div class="jinui_dialog_ft"></div></div></div>';

        var obj = $(_html).appendTo(document.body);
        $(obj).addClass(opts.skin);


        for(var i=0;i<opts.btns.length;i++){
            opts.btns[i].style = opts.btns[i].style==='' ? 'default' : opts.btns[i].style;
            var btnHtml = '<a href="javascript:;" class="jinui_dialog_btn '+ opts.btns[i].style +'">'+ opts.btns[i].text +'</a>';
            var fn = opts.btns[i].handle;
            $(btnHtml).appendTo($(obj).find('.jinui_dialog_ft')).bind('click', function(event) {
                fn.call(this);
            });
        }

        return obj;
    };

    jinui.alert = function(title,content,fn){
    	var _html = '<div class="jinui_dialog jinui_dialog_alert"><div class="jinui_mask_transparent"></div><div class="jinui_dialog_inner"><div class="jinui_dialog_hd"><strong class="jinui_dialog_title">'+ title +'</strong></div><div class="jinui_dialog_bd">'+ content +'</div><div class="jinui_dialog_ft"><a href="javascript:;" class="jinui_dialog_btn primary">确定</a></div></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	$(obj).delegate('.jinui_dialog_btn.primary', 'click', function(event) {
    		$(obj).remove();
    		fn ? fn.call(this) : '';
    	});
    	return obj;
    };

    jinui.confirm = function(title,content,fn){
    	var _html = '<div class="jinui_dialog jinui_dialog_confirm"><div class="jinui_mask_transparent"></div><div class="jinui_dialog_inner"><div class="jinui_dialog_hd"><strong class="jinui_dialog_title">'+ title +'</strong></div><div class="jinui_dialog_bd">'+ content +'</div><div class="jinui_dialog_ft"><a href="javascript:;" class="jinui_dialog_btn default">取消</a><a href="javascript:;" class="jinui_dialog_btn primary">确定</a></div></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	$(obj).delegate('.jinui_dialog_btn.primary', 'click', function(event) {
    		$(obj).remove();
    		fn ? fn.call(this,true) : '';
    	});
    	$(obj).delegate('.jinui_dialog_btn.default', 'click', function(event) {
    		$(obj).remove();
    		fn ? fn.call(this,false) : '';
    	});
    	return obj;
    };

}($);