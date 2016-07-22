/*===========================
toast
===========================*/
+ function($) {
    "use strict";

    var default_opts = {
    	content:'已完成',
    	type:0,//0完成，1错误，2，纯文本
    	time:800,//自动关闭时间ms
        toptip:'',//tips 纯文本提示，顶部 info,success,danger,primary,warning
    };

    jinui.toast = function(options) {
    	var opts = $.extend({},default_opts, options);

    	var _html = '<div class="jinui_toast"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_success"><i class="jinui_icon jinui_icon_success_empty"></i><p class="jinui_toast_content">'+ opts.content +'</p></div></div>';


    	if(opts.type == 1){
    		_html = '<div class="jinui_toast"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_warn"><i class="jinui_icon jinui_icon_warn"></i><p class="jinui_toast_content">'+ opts.content +'</p></div></div>';
    	}

    	if(opts.type == 2){
    		_html = '<div class="jinui_toast"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_tip"><p class="jinui_toast_content">'+ opts.content +'</p></div></div>';
            if(opts.toptip !== ''){
                if(opts.time<2000){
                    opts.time = 2000;
                }
                switch(opts.toptip){
                    case 'info':
                        _html = '<div class="jinui_toptip bg_info">'+ opts.content +'</div>';
                        break;
                    case 'success':
                        _html = '<div class="jinui_toptip bg_success">'+ opts.content +'</div>';
                        break;
                    case 'danger':
                        _html = '<div class="jinui_toptip bg_danger">'+ opts.content +'</div>';
                        break;
                    case 'primary':
                        _html = '<div class="jinui_toptip bg_primary">'+ opts.content +'</div>';
                        break;
                    case 'warning':
                        _html = '<div class="jinui_toptip bg_warning">'+ opts.content +'</div>';
                        break;
                    default:
                       _html = '<div class="jinui_toptip '+ opts.toptip +'">'+ opts.content +'</div>';
                        break;
                }
            }
    	}

        var obj = $(_html).appendTo(document.body);

    	setTimeout(function(){
            $(obj).remove();
    	},opts.time);

    	return obj;
    };

    jinui.loading = function(text) {
    	var _html = '<div class="jinui_toast jinui_toast_loading_warp"><div class="jinui_mask_transparent"></div><div class="jinui_toast_inner jinui_toast_loading"><div class="jinui_loading"><div class="jinui_loading_leaf jinui_loading_leaf_0"></div><div class="jinui_loading_leaf jinui_loading_leaf_1"></div><div class="jinui_loading_leaf jinui_loading_leaf_2"></div><div class="jinui_loading_leaf jinui_loading_leaf_3"></div><div class="jinui_loading_leaf jinui_loading_leaf_4"></div><div class="jinui_loading_leaf jinui_loading_leaf_5"></div><div class="jinui_loading_leaf jinui_loading_leaf_6"></div><div class="jinui_loading_leaf jinui_loading_leaf_7"></div><div class="jinui_loading_leaf jinui_loading_leaf_8"></div><div class="jinui_loading_leaf jinui_loading_leaf_9"></div><div class="jinui_loading_leaf jinui_loading_leaf_10"></div><div class="jinui_loading_leaf jinui_loading_leaf_11"></div></div><p class="jinui_toast_content">加载中</p></div></div>';

    	var obj = $(_html).appendTo(document.body);
    	return obj;
    };

    jinui.hideLoading = function(){
    	$('.jinui_toast_loading_warp').remove();
    };

    //actionsheet
    jinui.actionsheet = function(options){
        var actionsheet_default_opts = {
            title:'',
            actions:[]
        }
        var opts = $.extend({},actionsheet_default_opts, options);


        var _html = '<div class="jinui_actionsheet"><div class="jinui_mask jinui_mask_animation"></div><div class="jinui_actionsheet_content"><div class="jinui_actionsheet_menu"></div><div class="jinui_actionsheet_cell jinui_actionsheet_cancel">取消</div></div></div>';
        if(opts.title != ''){

            _html = '<div class="jinui_actionsheet"><div class="jinui_mask jinui_mask_animation"></div><div class="jinui_actionsheet_content"><div class="jinui_actionsheet_cell jinui_actionsheet_title"><p>'+ opts.title +'</p></div><div class="jinui_actionsheet_menu"></div><div class="jinui_actionsheet_cell jinui_actionsheet_cancel">取消</div></div></div>';
        }
        var objAction = $(_html).appendTo($(document.body));

        for(var i=0;i<opts.actions.length;i++){
            var classN = opts.actions[i].className ? opts.actions[i].className : '';
            var _cellhtml = '<div class="jinui_actionsheet_cell '+ classN +'">'+ opts.actions[i].text +'</div>';
            var fn = opts.actions[i].handle;

            (function(fn){
                $(_cellhtml).appendTo(objAction.find('.jinui_actionsheet_menu')).bind('click', function(event) {
                    fn.call(this);
                    close();
                });
            })(fn)
            
        }

        

        objAction.find('.jinui_actionsheet_content').addClass('jinui_animation_open');
        objAction.find('.jinui_mask').addClass('jinui_mask_visible').bind('click', function(event) {
            close();
        });

        objAction.find('.jinui_actionsheet_cancel').bind('click', function(event) {
            close();
        });

        var close  = function(){
            $('.jinui_actionsheet').find('.jinui_mask').removeClass('jinui_mask_visible')
            $('.jinui_actionsheet').find('.jinui_actionsheet_content').removeClass('jinui_animation_open').addClass('jinui_animation_close');

            setTimeout(function(){
                $('.jinui_actionsheet').remove();
            },300)
        }

    }

}($);