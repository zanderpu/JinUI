/*===========================
calendar
===========================*/
+ function($) {
    "use strict";

    var format = function(d) {
        return d*1 < 10 ? "0"+d*1 : d*1;
    };

    var Calendar = function (params) {
        var c = this;
        params = params || {};
        for (var def in $.fn.calendar.defaults) {
            if (typeof params[def] === 'undefined') {
                params[def] = $.fn.calendar.defaults[def];
            }
        }
        c.params = params;



        // Format date
        function formatDate(date) {
            date = new Date(date);
            var year = date.getFullYear();
            var month = date.getMonth();
            var month1 = month + 1;
            var day = date.getDate();
            var weekDay = date.getDay();
            return c.params.dateFormat
                .replace(/yyyy/g, year)
                .replace(/yy/g, (year + '').substring(2))
                .replace(/mm/g, month1 < 10 ? '0' + month1 : month1)
                .replace(/m/g, month1)
                .replace(/MM/g, c.params.monthNames[month])
                .replace(/M/g, c.params.monthNamesShort[month])
                .replace(/dd/g, day < 10 ? '0' + day : day)
                .replace(/d/g, day)
                .replace(/DD/g, c.params.dayNames[weekDay])
                .replace(/D/g, c.params.dayNamesShort[weekDay]);
        }

        //获取某一个月多少天
        function getMonth(year,month){
            return 32-new Date(year,month,32).getDate();
        }

        //生成月份html
        function monthHTML(year,month){
            $(c.year).html(c.currentYear);
            $(c.month).html(c.params.monthNames[c.currentMonth]);
            $(c.day).html(format(c.currentDay)+'日');


            var totalDay = getMonth(year,month);//当月总天数
            var prevDtotalday = getMonth(month,month-1);//上月总天数

            var firstDayDate = new Date();
            firstDayDate.setFullYear(year,month,1);
            var firstDay = firstDayDate.getDay()===0 ? 6 : firstDayDate.getDay()-1;//当月第一天星期
            
            //插入第一行
            var totalrun=0;
            var alldays = [];
            var i=0;
            var tdnum=1;

            for(i=0;i<firstDay;i++){//上一月
                tdnum = prevDtotalday - firstDay;
                tdnum = tdnum+i+1;
                totalrun = totalrun+1;
                alldays.push('<span class="jinui_calendar_day othermonth">'+ tdnum +'</span>');
            }
            tdnum=1;
            for(i=tdnum-1;i<totalDay;i++){//当前月
                var nowDate = new Date();
                var valueDate = new Date(c.params.value);

                if(c.params.markDays.indexOf(tdnum)>-1){
                    alldays.push('<span class="jinui_calendar_day ">'+ tdnum +'</span><span class="jinui_calendar_badge"></span>');
                }else if(valueDate.getFullYear()==nowDate.getFullYear() && valueDate.getMonth()==month && valueDate.getDate()==tdnum){
                    alldays.push('<span class="jinui_calendar_day active">'+ tdnum +'</span>');
                }else if(c.currentYear==nowDate.getFullYear() && month==nowDate.getMonth() && tdnum==nowDate.getDate()){
                    alldays.push('<span class="jinui_calendar_day today">'+ tdnum +'</span>');
                }else{
                    alldays.push('<span class="jinui_calendar_day">'+ tdnum +'</span>');
                }

                
                
                totalrun = totalrun+1;
                tdnum++;
            }
            tdnum=1;
            for(i=totalrun;i<42;i++){//下一月
                alldays.push('<span class="jinui_calendar_day othermonth">'+ tdnum +'</span>');
                tdnum++;
            }

            var trobj = '<table class="jinui_calendar_table"><tr>';
            for(i=0;i<alldays.length;i++){
                if(i%7 === 0){
                    trobj = i===0 ? '<table class="jinui_calendar_table" width="'+ c.width +'"><tr>' : trobj + '</tr><tr>';
                }
                trobj += '<td>'+alldays[i]+'</td>';
                
            }
            trobj += '</tr></table>';
            return trobj;
            
        }

        //设置日期
        function setDate(date){
            var dateObj = new Date(date);
            var setYear = dateObj.getFullYear();
            var setMonth = dateObj.getMonth();
            var setDay = dateObj.getDate();
            if(setYear != c.currentYear || setMonth != c.currentMonth){
                c.initMonthHtml(date);
            }else{
                if(setDay != c.currentDay){
                    c.currentDay = setDay;
                    $(c.day).html(format(c.currentDay)+'日');
                }
            }
            c.params.currentValue = date;
            
        }

        //添加事件
        c.event = function(){
            var calendarWarp = $(c.container).find('.jinui_calendar_inner');
            $(calendarWarp).css({
                '-webkit-transform': 'translatex(-'+ c.width +'px)',
                'transform':'translatex(-'+ c.width +'px)'
            });

            var startX,left,startTime;
            $(calendarWarp)[0].addEventListener('touchstart',function(event){
                var touch = event.targetTouches[0];
                startX = touch.pageX;
                left = 0;
                startTime = new Date();
                //event.preventDefault();
            }); 
            $(calendarWarp)[0].addEventListener('touchmove',function(event){
                
                var touch = event.targetTouches[0];
                var translatex = 320;
                left = touch.pageX - startX;
                translatex = translatex-left;
                if(Math.abs(left) < 10 && new Date() - startTime < 200){
                    return;
                }
                $(calendarWarp).css({
                    '-webkit-transform': 'translatex(-'+ translatex +'px)',
                    'transform':'translatex(-'+ translatex +'px)'
                });
                event.preventDefault();
            });
            $(calendarWarp)[0].addEventListener('touchend',function(event){

                if(Math.abs(left) > 100){
                    if(left>0){
                        c.currentMonth = c.currentMonth - 1;
                        if(c.currentMonth<0){
                            c.currentYear--;
                            c.currentMonth = 11;
                        }
                        $(monthHTML(c.currentYear,c.currentMonth-1)).prependTo($(c.container).find('.jinui_calendar_inner'));
                        $($(calendarWarp).find('.jinui_calendar_table')[3]).remove();

                    }else{
                        c.currentMonth = c.currentMonth + 1;
                        if(c.currentMonth>11){
                            c.currentYear++;
                            c.currentMonth = 0;
                        }
                        $(monthHTML(c.currentYear,c.currentMonth+1)).appendTo($(c.container).find('.jinui_calendar_inner'));

                        $($(calendarWarp).find('.jinui_calendar_table')[0]).remove();
                    }

                    c.params.currentValue = c.currentYear + '-' + format(c.currentMonth+1) + '-' + format(c.currentDay);
                    c.params.onMonthChange.call(c,formatDate(c.params.currentValue));
                }
                $(calendarWarp).css({
                    '-webkit-transform': 'translatex(-'+ c.width +'px)',
                    'transform':'translatex(-'+ c.width +'px)'
                });
                //event.preventDefault();
            });
    
            $(c.container).find('.jinui_calendar_warp').on('click', '.jinui_calendar_day', function(event) {
                event.preventDefault();
                if($(this).hasClass('othermonth') || $(this).hasClass('disable')){
                    return;
                }
                $(c.container).find('.active').removeClass('active');
                $(this).toggleClass('active');
                setDate(c.currentYear + '-' + format(c.currentMonth+1) + '-' + format($(this).text()));
                c.params.value = c.params.currentValue;
                c.params.onClickDay.call(c,c.params.value);

                if(!c.params.inline){
                    $(c.params.input).val(c.params.value);
                    c.close();
                }
            });



            //上一年
            $(c.container).find('.jinui_calendar_year_prev').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                year--;
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            //下一年
            $(c.container).find('.jinui_calendar_year_next').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                year++;
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            //上一个月
            $(c.container).find('.jinui_calendar_month_prev').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                if(month<2){
                    year--;
                    month = 12;
                }else{
                    month--;
                }
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            //下一个月
            $(c.container).find('.jinui_calendar_month_next').bind('click', function(event) {
                var month = c.currentMonth + 1,year = c.currentYear;
                if(month>11){
                    year++;
                    month = 1;
                }else{
                    month++;
                }
                setDate(year + '-' + format(month) + '-' + format(c.currentDay));
            });

            window.onresize=function(){
                $($(document.body).data('calendar')).each(function(index,el){
                    $(el).calendar('resize');
                });
            };


            if(c.params.inline === false){
                $(c.params.container).bind('click', function(event) {
                    
                });
            }

            //点击遮罩关闭
            $(c.container).find('.jinui_mask').bind('click', function(event) {
                c.close();
            });

            $(c.params.input).bind('click', function(event) {
                c.show();
            });
            
        };

        //初始化html代码
        c.initMonthHtml = function(date){
            date = new Date(date);
            c.currentYear = date.getFullYear();
            c.currentMonth = date.getMonth();
            c.currentDay = date.getDate();

            $(c.year).html(c.currentYear);
            $(c.month).html(c.params.monthNames[c.currentMonth]);
            $(c.day).html(c.currentDay+'日');

            
            $(c.container).find('.jinui_calendar_inner').html('');
            $(monthHTML(c.currentYear,c.currentMonth-1)).appendTo($(c.container).find('.jinui_calendar_inner'));
            $(monthHTML(c.currentYear,c.currentMonth)).appendTo($(c.container).find('.jinui_calendar_inner'));
            $(monthHTML(c.currentYear,c.currentMonth+1)).appendTo($(c.container).find('.jinui_calendar_inner'));

            
        };

        //初始化框架
        c.init = function(){
            var hdHtml;
            if(c.params.inline){//内联
                hdHtml = '<div class="jinui_calendar_hd"><div class="jinui_calendar_yearmonth"><div class="jinui_calendar_year"><span class="jinui_calendar_title jinui_calendar_year_text"></span></div><div class="jinui_calendar_month"><span class="jinui_calendar_title jinui_calendar_month_text"></span></div></div><div class="jinui_calendar_title_day"><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_prev"><i class="jinui_icon jinui_icon_chevron_left"></i></a><span class="jinui_calendar_title jinui_calendar_day_text"></span><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_next"><i class="jinui_icon jinui_icon_chevron_right"></i></a></div></div>';
            }else{
                hdHtml = '<div class="jinui_calendar_hd"><div class="jinui_calendar_year"><a href="javascript:;" class="jinui_calendar_link jinui_calendar_year_prev"><i class="jinui_icon jinui_icon_chevron_left"></i></a><span class="jinui_calendar_title jinui_calendar_year_text"></span><a href="javascript:;" class="jinui_calendar_link jinui_calendar_year_next"><i class="jinui_icon jinui_icon_chevron_right"></i></a></div><div class="jinui_calendar_month"><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_prev"><i class="jinui_icon jinui_icon_chevron_left"></i></a><span class="jinui_calendar_title jinui_calendar_month_text"></span><a href="javascript:;" class="jinui_calendar_link jinui_calendar_month_next"><i class="jinui_icon jinui_icon_chevron_right"></i></a></div></div>';
            }
            var bdHtml = '<div class="jinui_calendar_bd">';
            var dayHtml = '<table class="jinui_calendar_table" width="100%" border="0"><thead><tr>';
            if(c.params.firstDay===0){
                var first = c.params.dayNames[0];
                c.params.dayNames[0] = c.params.dayNames[6];
                c.params.dayNames[6] = first;
            }
            for(var v in c.params.dayNames){
                dayHtml += '<th>'+ c.params.dayNames[v] +'</th>';
            }
            dayHtml += '</tr></thead></table>';

            bdHtml += dayHtml+ '<div class="jinui_calendar_warp"><div class="jinui_calendar_inner"></div></div></div>';

            var classSkin = '';
            switch(c.params.theme){
                case 'info':
                    classSkin = 'jinui_calendar_info';
                    break;
                case 'success':
                    classSkin = 'jinui_calendar_success';
                    break;
                case 'danger':
                    classSkin = 'jinui_calendar_danger';
                    break;
                case 'primary':
                    classSkin = 'jinui_calendar_primary';
                    break;
                case 'warning':
                    classSkin = 'jinui_calendar_warning';
                    break;
                default:
                    classSkin = '';
                    break;
            }
            if(c.params.inline){//内联
                c.container = $('<div class="jinui_calendar jinui_calendar_inline '+ classSkin +'">'+ hdHtml + bdHtml +'</div>').appendTo(c.params.container);
            }else{
                c.container = $('<div class="jinui_calendar '+ classSkin +'"><div class="jinui_mask"></div><div class="jinui_calendar_dialog">'+ hdHtml + bdHtml +'</div></div>').appendTo(document.body);
            }
            
            c.year = $(c.container).find('.jinui_calendar_year_text');
            c.month = $(c.container).find('.jinui_calendar_month_text');
            c.day = $(c.container).find('.jinui_calendar_day_text');

            c.width = $(c.container).find('.jinui_calendar_bd').width();
            $(c.container).find('.jinui_calendar_warp').width(c.width);
            $(c.container).find('.jinui_calendar_inner').width(c.width*3);


            setDate(c.params.currentValue);
            c.event();
        };

        

        c.init();

        c.setDate = function(date){
            setDate(date);
        };

        c.setMarkDays = function(days){
            $('.jinui_calendar_badge').remove();
            if(typeof days == typeof []){
                $($(c.container).find('.jinui_calendar_table')[2]).find('.jinui_calendar_day:not(.othermonth)').each(function(index,el){
                    if(days.indexOf($(el).text()*1)>-1){
                        $('<span class="jinui_calendar_badge"></span>').insertAfter($(el));
                    }
                });
            }else if(typeof days == typeof 0){
                $($(c.container).find('.jinui_calendar_table')[2]).find('.jinui_calendar_day:not(.othermonth)').each(function(index,el){
                    if(days == $(el).text()*1){
                        $('<span class="jinui_calendar_badge"></span>').insertAfter($(el));
                        return false;
                    }
                });
            }
        };

        c.resize = function(){
            c.width = $(c.container).find('.jinui_calendar_bd').width();
            $(c.container).find('.jinui_calendar_warp').width(c.width);
            $(c.container).find('.jinui_calendar_inner').width(c.width*3);

            $(c.container).find('.jinui_calendar_inner').css({
                '-webkit-transform': 'translatex(-'+ c.width +'px)',
                'transform':'translatex(-'+ c.width +'px)'
            });

            c.initMonthHtml(c.params.currentValue);
        };

        c.close = function(){
            $(c.container).find('.jinui_calendar_dialog').removeClass('jinui_animation_open').addClass('jinui_animation_close');
            setTimeout(function(){
                $(c.container).hide();
            },200)
        };

        c.show = function(){
            $(c.container).show();
            c.resize();
            if($(c.params.input).val() !== ''){
                setDate($(c.params.input).val());
            }else{
                setDate(new Date());
            }
            $(c.container).find('.jinui_calendar_dialog').removeClass('jinui_animation_close').addClass('jinui_animation_open');
        };

        c.setDay = function(date){//选中天

        }

        if(!c.params.inline){//内联
            if(c.params.hasDefault){
                $(c.params.input).val(formatDate(c.params.value));
            }
            $(c.params.input).attr('readonly','readonly');
            $(c.container).hide();
        }
        
        c.params.onInit.call(c,formatDate(c.params.currentValue));
        return c;
    };
    
    
    

    $.fn.calendar = function(params, args) {
        params = params || {};
        return this.each(function() {
            var $this = $(this);
            if (!$this[0]) return;
            var p = {};
            if ($this[0].tagName.toUpperCase() === "INPUT") {
                p.input = $this;
            } else {
                p.container = $this;
            }

            var calendar = $this.data("calendar");


            if (!calendar) {
                p.value = params.value || $this.val();
                //默认显示今天
                
                if (!p.value) {
                    var today = new Date();
                    p.currentValue = today.getFullYear() + "-" + format(today.getMonth() + 1) + "-" + format(today.getDate());
                }else{
                    p.hasDefault = true;
                    var temp = p.value.replace(/-/g, "/");
                    p.value = temp.split('/')[0]+ '-' +format(temp.split('/')[1])+ '-' +format(temp.split('/')[2]);
                    console.log(p.value);
                    p.currentValue = p.value;
                }
                if(params.input){
                    params.inline = false;
                }
                calendar = $this.data("calendar", new Calendar($.extend(p, params)));

                //保存所有日历对象
                var allCalendars = $(document.body).data('calendar') ? $(document.body).data('calendar') : [];
                allCalendars.push($this);
                $(document.body).data('calendar',allCalendars);
            }

            if (typeof params === typeof "a") {
                calendar[params].call(calendar, args);
            }
        });
    };


    $.fn.calendar.defaults = {
        monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        monthNamesShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        dayNames: ['一', '二', '三', '四', '五', '六','日'],
        dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        firstDay: 1, //第一天是周日还是周一 0周日 1周一
        inline:false,//内联
        dateFormat: 'yyyy-mm-dd',
        minDate: null,
        maxDate: null,
        theme:'',//主题
        markDays:[],//需要标记的天
        hasDefault:false,//显示默认值
        value:'',//默认值
        onClickDay:function(date){},//点击天
        onMonthChange:function(date){},//月改变
        onInit:function(date){},//初始化成功
        
    };


}($);