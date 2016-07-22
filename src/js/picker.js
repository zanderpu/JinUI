/*===========================
picker
===========================*/
+ function($) {
    "use strict";

    var Picker = function(params){
        var p = this;
        params = params || {};
        p.params = $.extend({},$.fn.picker.defaults, params);

        $(p.params.container).bind('click', function(event) {
            event.stopPropagation();
            p.open();
        }).attr('readonly',true);

        function initHtml(){//初始化html
            

            var _html = '<div class="jinui_picker jinui_animation_open"><div class="jinui_picker_container"><div class="jinui_picker_hd"><h1 class="jinui_picker_title">'+ p.params.title +'</h1><a href="javascript:;" class="jinui_picker_btn">确定</a></div><div class="jinui_picker_bd"><div class="jinui_picker_cols"></div><div class="jinui_picker_highlight"></div></div></div></div>';
            p.pickerHTML = $(_html).appendTo(document.body);
            p.pickerColsHTML = p.pickerHTML.find('.jinui_picker_cols');

            $(p.pickerHTML).data('picker',p);

            var _colshtml = '';
            for(var i in p.params.cols){
                _colshtml += '<div class="jinui_picker_col"><div class="jinui_picker_items">';
                for(var j in p.params.cols[i]){
                    var _val = p.params.cols[i][j].value ? p.params.cols[i][j].value : p.params.cols[i][j].text;
                    var _colhtml = '<div class="jinui_picker_item" data-picker-value="'+ _val +'">'+ p.params.cols[i][j].text +'</div>';
                    _colshtml += _colhtml;
                }
                _colshtml += '</div></div>';
            }
            
            p.pickerColsHTML.html(_colshtml);
            setValue();
            initEvent();
        }

        function initEvent(){//初始化事件


            $(p.pickerHTML).bind('touchmove', function(event) {
                event.preventDefault();
            });
            $(p.pickerHTML).bind('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
            });

            var startY,moveY,translatey,nowSelected;
            $('.jinui_picker_items').bind('touchstart', function(event) {
                var $this = $(this);
                var touch = event.targetTouches[0];
                startY = touch.pageY;
                moveY = 0;
                translatey = $this.attr('translatey') ? $this.attr('translatey')*1 : 102;
            });
            $('.jinui_picker_items').bind('touchmove', function(event) {
                var $this = $(this);
                var touch = event.targetTouches[0];
                moveY = touch.pageY - startY;
                
                var top = translatey + moveY;

                $this.css({
                    '-webkit-transform': 'translateY('+ top +'px)',
                    'transform':'translateY('+ top +'px)',
                    'transition-duration':'0ms'
                });

                var _top = translatey + Math.round(moveY/34)*34;

                nowSelected = _top>102 ? 0 : Math.abs(Math.round((_top-102)/34));//判断是否超过顶部
                var bottom = 136-$this.find('.jinui_picker_item').length*34;
                nowSelected = _top < bottom ? $this.find('.jinui_picker_item').length-1 : nowSelected;//判断是否超过底部

                $this.find('.jinui_picker_selected').removeClass('jinui_picker_selected');
                $($this.find('.jinui_picker_item')[nowSelected]).addClass('jinui_picker_selected');

                //console.log($($this.find('.jinui_picker_item')[nowSelected]).attr('data-picker-value'));
                //console.log($($this.find('.jinui_picker_item')[nowSelected]).html());

                changeVal();
            });

            $('.jinui_picker_items').bind('touchend', function(event) {
                var $this = $(this);
                translatey = translatey + Math.round(moveY/34)*34;
                translatey = translatey>102 ? 102 : translatey;

                var bottom = 136-$this.find('.jinui_picker_item').length*34;//获取最底部距离
                translatey = translatey < bottom ? bottom : translatey;//判断是否超过最底部

                $this.css({
                    '-webkit-transform': 'translatey('+ translatey +'px)',
                    'transform':'translatey('+ translatey +'px)',
                    'transition-duration':''
                });
                $this.attr('translatey',translatey);
            });

            $(document.body).bind('click', function(event) {
                p.close();
            });

            $(p.pickerHTML).find('.jinui_picker_btn').bind('click', function(event) {
                p.close();
            });

            return p;
        }

        function setValue(value){
            var val = value || $(p.params.container).val().split(' ');

            $(p.pickerHTML).find('.jinui_picker_selected').removeClass('jinui_picker_selected');

            $(p.pickerHTML).find('.jinui_picker_col').each(function(i, el) {
                $(el).find('.jinui_picker_item').each(function(j, elem) {
                    var _this = $(elem);
                    if(val[i]){
                        if(_this.html() == val[i]){
                            var top=102-j*34;
                            _this.addClass('jinui_picker_selected');

                            $(el).find('.jinui_picker_items').css({
                                '-webkit-transform': 'translateY('+ top +'px)',
                                'transform':'translateY('+ top +'px)',
                                'transition-duration':'0ms'
                            }).attr('translatey',top);

                            return false;
                        }
                    }else{
                        j===0 ? _this.addClass('jinui_picker_selected') : '';
                    }
                });
                
            });

            $(p.params.container).val(getValue().texts.join(' '));
            
        }

        function getValue(){
            var vals = [],texts=[],result=[],cols=[];
            $(p.pickerHTML).find('.jinui_picker_selected').each(function(index, el) {
                var text = $(el).text();
                var value = $(el).attr('data-picker-value');

                texts.push(text);
                vals.push(value);

                result.push({
                    text:text,
                    value:value
                });

                $(p.params.cols[index]).each(function(j, el) {
                    if(el.text == text){
                        cols.push(p.params.cols[index][j]);
                        return false;
                    }
                });
            });

            return {
                texts:texts,
                vals:vals,
                result:result,
                cols:cols
            };
        }

        var oldValue='';
        function changeVal(){
            $(p.params.container).val(getValue().texts.join(' '));
            if(oldValue != getValue().vals.join(' ')){
                p.params.onChange(p,getValue().texts.join(' '),getValue().vals.join(' '));
                oldValue = getValue().vals.join(' ');
            }
            event.preventDefault();
        }



        p.open = function(){
            if(!p.pickerHTML){
                $('.jinui_picker').length>0 ? $('.jinui_picker').data('picker').close() : '';
                initHtml();
            }
        };

        p.close = function(){
            p.params.onClose.call(p,getValue().result);
            $(p.pickerHTML).removeClass('jinui_animation_open').addClass('jinui_animation_close');
            setTimeout(function(){
                $(p.pickerHTML).remove();
                p.pickerHTML = null;
            },300);
        };

        //获取值
        p.getValue = function(){
            return getValue().cols;
        };

        //设置值
        p.setValue = function(value){
            if(value){
                $(p.params.container).val(value);
            }
        };

        p.updateCols = function(){
            console.log(p.params.cols);

            for(var i in p.params.cols){
                var _colshtml = '';
                var nowObj = $(p.pickerHTML).find('.jinui_picker_items')[i];
                for(var j in p.params.cols[i]){
                    var _val = p.params.cols[i][j].value ? p.params.cols[i][j].value : p.params.cols[i][j].text;
                    var _colhtml = '<div class="jinui_picker_item" data-picker-value="'+ _val +'">'+ p.params.cols[i][j].text +'</div>';
                    _colshtml += _colhtml;
                }
                $(nowObj).html(_colshtml);
            }
            setValue();

        };


        
    };

    $.fn.picker = function(params, args) {
        params = params || {};
        if(typeof params == typeof 'str'){
            var picker = $(this).data('picker');
            return picker[params].call(picker, args) || $(this);
        }
        return this.each(function() {
            var $this = $(this);
            if (!$this[0]) return;

            var picker = $this.data('picker');
            if(picker){
                picker[params].call(picker, args);
            }else{
                params.container = this;
                $this.data('picker',new Picker(params));
            }
            
        });
    };


    $.fn.picker.defaults = {
        title:'',
        cols:[],
        onChange:function(){},
        onClose:function(){}
    };


}($);