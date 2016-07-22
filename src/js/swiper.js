/*===========================
swiper
===========================*/
+ function($) {
    "use strict";

    var Swiper=function(params){
        var s = this;
        params = params || {};
        s.params = $.extend({},$.fn.swiper.defaults, params);
        s.index = 0;

        //console.log(s.params);

        function initHtml(){//初始化html
            s.containerHTML = $(s.params.container).find('.jinui_swiper_container');
            var _slideHTML = $(s.params.container).find('.jinui_swiper_slide');

            if(s.params.pagination){
                var _paginationhtml = s.params.pageposition != '' ? '<div class="jinui_swiper_pagination jinui_swiper_'+ s.params.pageposition +'">' : '<div class="jinui_swiper_pagination">';
                for(var i=0;i<_slideHTML.length;i++){
                    _paginationhtml += '<div class="jinui_swiper_page"></div>';
                }
                _paginationhtml += '</div>';

               s.pagHTML = $(_paginationhtml).appendTo($(s.params.container));
            }

            s.maxIndex = $(s.params.container).find('.jinui_swiper_slide').length-1;
            if(s.params.loop){
                var firstslide = $($(s.params.container).find('.jinui_swiper_slide')[0]).clone();
                var lastslide = $($(s.params.container).find('.jinui_swiper_slide').last()).clone();
                $(firstslide).appendTo($(s.params.container).find('.jinui_swiper_container'));
                $(lastslide).prependTo($(s.params.container).find('.jinui_swiper_container'));
                s.maxIndex = $(s.params.container).find('.jinui_swiper_slide').length-3;
            }

        }

        //水平滑动
        function initEvent(){
            if(!s.params.slide){
                return;
            }
            var startX,left;
            $(s.containerHTML).bind('touchstart', function(event) {
                var touch = event.targetTouches[0];
                startX = touch.pageX;
                left = 0;
            });
            $(s.containerHTML).bind('touchmove', function(event) {
                clearInterval(autoInterval);
                var $this = $(this);
                var touch = event.targetTouches[0];
                left = touch.pageX - startX;
                setSwiperLeftTop($this, (s.translatex + left),'0ms');

                event.preventDefault();
            });
            $(s.containerHTML).bind('touchend', function(event) {
                var $this = $(this),goIndex;
                if(left> 80 || left > (s.slideDistance/2)){//右滑
                    left = s.slideDistance;
                    goIndex = s.index-1;
                }else if(left < -80 || (left<0 && Math.abs(left) > (s.slideDistance/2))){//左滑
                    left = s.slideDistance*-1;
                    goIndex = s.index+1;
                }else{
                    left = 0;
                    goIndex = s.index;
                }

                go(goIndex);
                //是否继续循环滚动
                if(s.params.loop && s.params.auto){
                    startAuto();
                }
            });
        }

        //垂直滑动
        function initEventVertical(){
            if(!s.params.slide){
                return;
            }
            var startY,top;
            $(s.containerHTML).bind('touchstart', function(event) {
                var touch = event.targetTouches[0];
                startY = touch.pageY;
                top = 0;
            });
            $(s.containerHTML).bind('touchmove', function(event) {
                clearInterval(autoInterval);
                var $this = $(this);
                var touch = event.targetTouches[0];
                top = touch.pageY - startY;

                setSwiperLeftTop($this, (s.translatex + top),'0ms');

                event.preventDefault();
            });
            $(s.containerHTML).bind('touchend', function(event) {
                var $this = $(this),goIndex;
                if(top> 80 || top > (s.slideDistance/2)){//右滑
                    top = s.slideDistance;
                    goIndex = s.index-1;
                }else if(top < -80 || (top<0 && Math.abs(top) > (s.slideDistance/2))){//左滑
                    top = s.slideDistance*-1;
                    goIndex = s.index+1;
                }else{
                    top = 0;
                    goIndex = s.index;
                }

                go(goIndex);
                //是否继续循环滚动
                if(s.params.loop && s.params.auto){
                    startAuto();
                }
            });
        }

        function resize(){
            var itemLength = $(s.params.container).find('.jinui_swiper_slide').length;
            if(s.params.orientation==='horizontal'){//横向
                s.slideDistance = $(s.params.container).width();
                $(s.params.container).find('.jinui_swiper_slide').css({
                    'float':'left'
                });
                $(s.containerHTML).width(itemLength*s.slideDistance);
                $(s.params.container).find('.jinui_swiper_slide').width(s.slideDistance);
            }else if(s.params.orientation==='vertical'){//垂直
                s.slideDistance = $(s.params.container).find('.jinui_swiper_slide').height();
                $(s.containerHTML).height(itemLength*s.slideDistance);
                $(s.params.container).height(s.slideDistance);
            }

            resizePage();
            go(s.index);
        }

        //设置分页显示位置
        function resizePage(){
            if(s.params.pagination && s.params.pageposition.indexOf('center')>0){

                if(s.params.pageposition.indexOf('left')<0 && s.params.pageposition.indexOf('right')<0){
                    s.pagHTML.css({
                        'margin-left':s.pagHTML.width()/2*-1
                    });
                }else{
                    s.pagHTML.css({
                        'margin-top':s.pagHTML.height()/2*-1
                    });
                } 
                
            }
        }

        function go(i){

            var goIndex = i;
            

            if(s.params.loop){
                s.translatex = (goIndex*s.slideDistance+s.slideDistance)*-1;
                setSwiperLeftTop($(s.containerHTML), s.translatex,'300ms');

                if(goIndex>s.maxIndex){
                    goIndex = 0;
                    setTimeout(function(){
                        s.translatex = s.slideDistance*-1;
                        setSwiperLeftTop($(s.containerHTML), s.translatex,'0ms');
                    },300);
                }

                if(goIndex<0){
                    goIndex = s.maxIndex;
                    setTimeout(function(){
                        s.translatex = s.slideDistance*-1*(s.maxIndex+1);
                        setSwiperLeftTop($(s.containerHTML), s.translatex,'0ms');
                    },300);
                }

            }else{

                goIndex = goIndex>s.maxIndex ? s.maxIndex : goIndex;
                goIndex = goIndex<0 ? 0 : goIndex;
                s.translatex = (goIndex*s.slideDistance)*-1;

                setSwiperLeftTop($(s.containerHTML), s.translatex,'300ms');
            }

            if(s.params.pagination){//选中当前页
                $(s.params.container).find('.jinui_swiper_pagination .active').removeClass('active');
                $($(s.params.container).find('.jinui_swiper_page')[goIndex]).addClass('active');
            }

            if(s.index != goIndex){
                s.params.onChange.call(s,goIndex);
                s.params.onEnter.call(s,goIndex);
                s.params.onLeave.call(s,s.index);
            }
            s.index = goIndex;


        }

        /**
         * 滚动
         * @param {[type]} obj  [description]
         * @param {[type]} left [description]
         * @param {[type]} time [description]
         */
        function setSwiperLeftTop(obj,distance,time){
            if(s.params.orientation==='horizontal'){//横向
                $(obj).css({
                    '-webkit-transform': 'translateX('+ distance +'px)',
                    'transform':'translateX('+ distance +'px)',
                    'transition-duration':time
                });
            }else if(s.params.orientation==='vertical'){//垂直
                $(obj).css({
                    '-webkit-transform': 'translateY('+ distance +'px)',
                    'transform':'translateY('+ distance +'px)',
                    'transition-duration':time
                });
            }
        }


        var autoInterval;
        function startAuto(){
            autoInterval = setInterval(function(){
                go(s.index+1);
            },s.params.autotime);
        }

        //跳转到某项
        s.go = function(index){
            go(index);
        };

        window.onresize = function(){
            resize();
        };


        initHtml();
        if(s.params.orientation==='horizontal'){//横向
            initEvent();
        }else if(s.params.orientation==='vertical'){//垂直
            initEventVertical();
        }

        resize();
        //go(0);

        if(s.params.loop && s.params.auto){
            startAuto();
        }
    };



    $.fn.swiper = function(params, args) {
        params = params || {};
        if(typeof params == typeof 'str'){
            var swiper = $(this).data('swiper');
            return swiper[params].call(swiper, args) || $(this);
        }
        return this.each(function() {
            var $this = $(this);
            if (!$this[0]) return;

            var swiper = $this.data('swiper');
            if(swiper){
                swiper[params].call(swiper, args);
            }else{
                params.container = this;
                $this.data('swiper',new Swiper(params));
            }            
        });
    };


    $.fn.swiper.defaults = {
        loop:true,//是否循环滚动
        slide:true,//是否允许手动滑动
        auto:true,//自动滚动
        autotime:4000,//自动滚动时间间隔
        orientation:'horizontal',//滑动方向 横向 horizontal  垂直 vertical 垂直方向的时候一定要设置jinui_swiper_slide高度
        pagination:true,//是否显示页码标记
        pageposition:'bottomcenter',//当前页标记位置left、center、right、top、bottom
        onChange:function(index){},//slide改变
        onEnter:function(index){},//进入slide
        onLeave:function(index){},//离开slide
    };

}($);