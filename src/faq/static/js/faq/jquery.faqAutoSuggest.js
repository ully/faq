 /*
 * AutoSuggest
 * Copyright 2009-2010 Drew Wilson
 * www.drewwilson.com
 * code.drewwilson.com/entry/autosuggest-jquery-plugin
 *
 * Version 1.4   -   Updated: Mar. 23, 2010
 *
 * This Plug-In will auto-complete or auto-suggest completed search queries
 * for you as you type. You can add multiple selections and remove them on
 * the fly. It supports keybord navigation (UP + DOWN + RETURN), as well
 * as multiple AutoSuggest fields on the same page.
 *
 * Inspied by the Autocomplete plugin by: J�rn Zaefferer
 * and the Facelist plugin by: Ian Tearle (iantearle.com)
 *
 * This AutoSuggest jQuery plug-in is dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function($){
	$.fn.autoSuggest = function(data, options) {
		var defaults = { 
			asHtmlID: false,
			startText: "搜索FAQ...",
			emptyText: "没找到你想要的？点这里",
			preFill: {},
			limitText: "No More Selections Are Allowed",
			selectedItemProp: "value", //name of object property
			selectedValuesProp: "value", //name of object property
			searchObjProps: "value", //comma separated list of object property names
			queryParam: "q",
			retrieveLimit: 5, //number for 'limit' param on ajax request
			extraParams: "",
			matchCase: false,
			minChars: 1,
			keyDelay: 500,
			resultsHighlight: true,
			neverSubmit: false,
			selectionLimit: false,
			showResultList: true,
			jsonp:false,
		  	start: function(){},
		  	selectionClick: function(elem){},
		  	selectionAdded: function(elem){},
		  	selectionRemoved: function(elem){ elem.remove(); },
		  	formatList: false, //callback function
		  	beforeRetrieve: function(string){ return string; },
		  	retrieveComplete: function(data){return data.items; },
		  	resultClick: function(data){},
		  	resultsComplete: feedback,
		  	ispulltopq:false,
		  	pulldata:null,
		  	requrl:null,
		  	feedbackMsg:"抱歉，请补充完整你遇到的问题，我们的支持人员会尽快答复你，只要注意查收邮件就行啦：）\n如果有补充，请在这里输入！"
	  	};  
	 	var opts = $.extend(defaults, options);	 	
		var d_type = "object";
		var d_count = 0;
		if(typeof data == "string") {
			d_type = "string";
			var req_string = data;
			opts.requrl=data;
		} else {
			var org_data = data;
			for (k in data) if (data.hasOwnProperty(k)) d_count++;
		}
		if((d_type == "object" && d_count > 0) || d_type == "string"){
			return this.each(function(x){
				if(!opts.asHtmlID){
					x = x+""+Math.floor(Math.random()*100); //this ensures there will be unique IDs on the page if autoSuggest() is called multiple times
					var x_id = "as-input-"+x;
				} else {
					x = opts.asHtmlID;
					var x_id = x;
				}
				opts.start.call(this);
				var input = $(this);
				var input_focus = false;
				if(opts.ispulltopq){
					$.ajax({
			             url:req_string.replace('/jsonpsearch','/gettopq')+"?limit=1"+opts.extraParams,
			             dataType:"jsonp",
			             type:"get",
			             jsonp:"jsonpcallback",
			             success:function(data){
			            	 if(data.items.length!=0){
			            	 opts.pulldata = data;
			            	 input.attr("autocomplete","off").addClass("as-input").attr("id",x_id).val(data.items[0].question);
			            	 input.focus();
			            	 }else{
			            		 opts.ispulltopq = false;
			            		 input.attr("autocomplete","off").addClass("as-input").attr("id",x_id).val(opts.startText); 
			            	 }
			             },
			             error:function(err) {
			            	 opts.ispulltopq = false;
			            	 input.attr("autocomplete","off").addClass("as-input").attr("id",x_id).val(opts.startText);
			             }
			        });
				} else {
					input.attr("autocomplete","off").addClass("as-input").attr("id",x_id).val(opts.startText);
				}
			
				
				// Setup basic elements and render them to the DOM
				input.wrap('<ul class="as-selections" id="as-selections-'+x+'"></ul>').wrap('<li class="as-original" id="as-original-'+x+'"></li>');
				var selections_holder = $("#as-selections-"+x);
				var org_li = $("#as-original-"+x);				
				var results_holder = $('<div class="as-results" id="as-results-'+x+'"></div>').hide();
				var results_ul =  $('<ul class="as-list"></ul>');
				var values_input = $('<input type="hidden" class="as-values" name="as_values_'+x+'" id="as-values-'+x+'" />');
				var prefill_value = "";
				if(typeof opts.preFill == "string"){
					var vals = opts.preFill.split(",");					
					for(var i=0; i < vals.length; i++){
						var v_data = {};
						v_data[opts.selectedValuesProp] = vals[i];
						if(vals[i] != ""){
							add_selected_item(v_data, "000"+i);	
						}		
					}
					prefill_value = opts.preFill;
				} else {
					prefill_value = "";
					var prefill_count = 0;
					for (k in opts.preFill) if (opts.preFill.hasOwnProperty(k)) prefill_count++;
					if(prefill_count > 0){
						for(var i=0; i < prefill_count; i++){
							var new_v = opts.preFill[i][opts.selectedValuesProp];
							if(new_v == undefined){ new_v = ""; }
							prefill_value = prefill_value+new_v+",";
							if(new_v != ""){
								add_selected_item(opts.preFill[i], "000"+i);	
							}		
						}
					}
				}
				if(prefill_value != ""){
					input.val("");
					var lastChar = prefill_value.substring(prefill_value.length-1);
					if(lastChar != ","){ prefill_value = prefill_value+","; }
					values_input.val(","+prefill_value);
					$("li.as-selection-item", selections_holder).addClass("blur").removeClass("selected");
				}
				input.after(values_input);
				selections_holder.click(function(){
					input_focus = true;
					input.focus();
				}).mousedown(function(){ input_focus = false; }).after(results_holder);	

				var timeout = null;
				var prev = "";
				var totalSelections = 0;
				var tab_press = false;
				// Handle input field events
				input.focus(function(){			
					if($(this).val() == opts.startText && values_input.val() == ""){
						$(this).val("");
					} else if(input_focus){
						$("li.as-selection-item", selections_holder).removeClass("blur");
						if($(this).val() != ""){
							results_ul.css("width",selections_holder.outerWidth());
							results_holder.show();
						}
					}
					$("li", results_ul).removeClass("active");
					input_focus = true;
					return true;
				}).mouseover(function(){
					input.select();  
				}).blur(function(){
					if($(this).val() == "" && values_input.val() == "" && prefill_value == ""){
						$(this).val(opts.startText);
					} else if(input_focus){
						$("li.as-selection-item", selections_holder).addClass("blur").removeClass("selected");
						results_holder.hide();
					}				
				}).keydown(function(e) {

					// track last key pressed
					lastKeyPressCode = e.keyCode;
					first_focus = false;
					switch(e.keyCode) {
						case 38: // up
							e.preventDefault();
							moveSelection("up");
							break;
						case 40: // down
							e.preventDefault();
							moveSelection("down");
							break;
						case 8:  // delete
							if(input.val() == ""){							
								var last = values_input.val().split(",");
								last = last[last.length - 2];
								selections_holder.children().not(org_li.prev()).removeClass("selected");
								if(org_li.prev().hasClass("selected")){
									values_input.val(values_input.val().replace(","+last+",",","));
									opts.selectionRemoved.call(this, org_li.prev());
								} else {
									opts.selectionClick.call(this, org_li.prev());
									org_li.prev().addClass("selected");		
								}
							}
							if(input.val().length == 1){
								results_holder.hide();
								 prev = "";
							}
							if($(":visible",results_holder).length > 0){
								if (timeout){ clearTimeout(timeout); }
								timeout = setTimeout(function(){ keyChange(); }, opts.keyDelay);
							}
							break;
						case 9: case 188:  // tab or comma
							tab_press = true;
							var i_input = input.val().replace(/(,)/g, "");
							if(i_input != "" && values_input.val().search(","+i_input+",") < 0 && i_input.length >= opts.minChars){	
								e.preventDefault();
								var n_data = {};
								n_data[opts.selectedItemProp] = i_input;
								n_data[opts.selectedValuesProp] = i_input;																				
								var lis = $("li", selections_holder).length;
								add_selected_item(n_data, "00"+(lis+1));
								input.val("");
							}
						case 13: // return
							tab_press = false;
							var active = $("li.active:first", results_holder);
							if(active.length > 0){
								active.click();
								results_holder.hide();
							}
							if(opts.neverSubmit || active.length > 0){
								e.preventDefault();
							}
							
							if(opts.ispulltopq && opts.pulldata != null && opts.pulldata.items.length !=0) {
								data = opts.pulldata.items[0];
								if(data.answertype=="URL") {
									window.open(data.answer)
								}else{
									var helper = new faq.widgets.Dialog({id:"faq_helper",title:"help",content:data.answer,target:$("body")});
									helper.show();
								}
							} else {
								if(active.length==0) {
									showFeedBackDialog(input.val(),opts);
								}
							}
							break;
						default:
							if(opts.showResultList){
								if(opts.selectionLimit && $("li.as-selection-item", selections_holder).length >= opts.selectionLimit){
									results_ul.html('<li class="as-message">'+opts.limitText+'</li>');
									results_holder.show();
								} else {
									if (timeout){ clearTimeout(timeout); }
									timeout = setTimeout(function(){ keyChange(); }, opts.keyDelay);
								}
							}
							break;
					}
				
				}).bind("input", function() { //leonliu add
					if (timeout){ clearTimeout(timeout); }
					timeout = setTimeout(function(){ keyChange(); }, opts.keyDelay);
				});
				
				function keyChange() {
					// ignore if the following keys are pressed: [del] [shift] [capslock]
					opts.ispulltopq =false;
					if( lastKeyPressCode == 46 || (lastKeyPressCode > 8 && lastKeyPressCode < 32) ){ return results_holder.hide(); }
					var string = input.val().replace(/[\\]+|[\/]+/g,"");
					if (string == prev) return;
					prev = string;
					if (string.length >= opts.minChars) {
						selections_holder.addClass("loading");
						if(d_type == "string"){
							var limit = "";
							if(opts.retrieveLimit){
								limit = "&limit="+encodeURIComponent(opts.retrieveLimit);
							}
							if(opts.beforeRetrieve){
								string = opts.beforeRetrieve.call(this, string);
							}
							if(opts.jsonp){
								$.ajax({
						             url:req_string+"?"+opts.queryParam+"="+encodeURIComponent(string)+limit+opts.extraParams,
						             dataType:"jsonp",
						             type:"get",
						             jsonp:"jsonpcallback",
						             success:function(data){
										d_count = 0;
										var new_data = opts.retrieveComplete.call(this, data);
										for (k in new_data) if (new_data.hasOwnProperty(k)) d_count++;
										processData(new_data, string,data.keywords); 
						             },
						             error:function(err) {
						             }
						        });
							}else{
								$.getJSON(req_string+"?"+opts.queryParam+"="+encodeURIComponent(string)+limit+opts.extraParams, function(data){ 
									d_count = 0;
									var new_data = opts.retrieveComplete.call(this, data);
									for (k in new_data) if (new_data.hasOwnProperty(k)) d_count++;
									processData(new_data, string,data.keywords); 
								});
							}
						} else {
							if(opts.beforeRetrieve){
								string = opts.beforeRetrieve.call(this, string);
							}
							processData(org_data, string,null);
						}
					} else {
						selections_holder.removeClass("loading");
						results_holder.hide();
					}
				}
				var num_count = 0;
				function processData(data, query,keywords){
					if (!opts.matchCase){ query = query.toLowerCase(); }
					var matchCount = 0;
					results_holder.html(results_ul.html("")).hide();
					for(var i=0;i<d_count;i++){				
						var num = i;
						num_count++;
						var forward = false;
						if(opts.searchObjProps == "value") {
							var str = data[num].value;
						} else {	
							var str = "";
							var names = opts.searchObjProps.split(",");
							for(var y=0;y<names.length;y++){
								var name = $.trim(names[y]);
								str = str+data[num][name]+" ";
							}
						}
						if(str){
							if (!opts.matchCase){ str = str.toLowerCase(); }				
							if(str.search(query) != -1 && values_input.val().search(","+data[num][opts.selectedValuesProp]+",") == -1){
								forward = true;
							}	
							forward = true;
						}
						if(forward){
							var formatted = $('<li class="as-result-item" id="as-result-item-'+num+'"></li>').bind("click mousedown",function(){
									var raw_data = $(this).data("data");
									var number = raw_data.num;
									if($("#as-selection-"+number, selections_holder).length <= 0 && !tab_press){
										var data = raw_data.attributes;
										input.val("").focus();
										prev = "";
										add_selected_item(data, number);
										opts.resultClick.call(this, raw_data);
										results_holder.hide();
									}
									tab_press = false;
									input_focus = false;
								}).mouseover(function(){
									$("li", results_ul).removeClass("active");
									$(this).addClass("active");
								}).data("data",{attributes: data[num], num: num_count});
							var this_data = $.extend({},data[num]);
							if(keywords!=null && keywords.length>0) {
							for(var ti=0 ;ti<keywords.length;ti++) {
								if (!opts.matchCase){ 
									var regx = new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + keywords[ti] + ")(?![^<>]*>)(?![^&;]+;)", "gi");
								} else {
									var regx = new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + keywords[ti] + ")(?![^<>]*>)(?![^&;]+;)", "g");
								}
								
								if(opts.resultsHighlight){
									this_data[opts.selectedItemProp] = this_data[opts.selectedItemProp].replace(regx,"<em>$1</em>");
								}
							}
							}else{
								var regx = new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + query + ")(?![^<>]*>)(?![^&;]+;)", "gi");
								if(opts.resultsHighlight){
									this_data[opts.selectedItemProp] = this_data[opts.selectedItemProp].replace(regx,"<em>$1</em>");
								}
							}
							if(!opts.formatList){
								formatted = formatted.html(this_data[opts.selectedItemProp]);
							} else {
								formatted = opts.formatList.call(this, this_data, formatted);	
							}
							results_ul.append(formatted);
							delete this_data;
							matchCount++;
							if(opts.retrieveLimit && opts.retrieveLimit == matchCount ){ break; }
						}
					}
					selections_holder.removeClass("loading");
//					if(matchCount <= 0){
//						results_ul.html('<li class="as-message">'+opts.emptyText+'</li>');
//					}
					results_ul.append('<li class="as-message">'+opts.emptyText+'</li>')
					results_ul.css("width", selections_holder.outerWidth());
					results_holder.show();
					$(".as-message").mousedown(function(){
						input_focus = false;
					}).mouseover(function(){
						$("li", results_ul).removeClass("active");
						$(this).addClass("active");
					})
					opts.resultsComplete.call(this,query,opts,results_holder);
				}
				
				function add_selected_item(data, num){
					$.ajax({
			            url:opts.requrl.replace('/jsonpsearch','/qhint')+"?"+opts.extraParams,
			            dataType:"jsonp",
			            type:"GET",
			            data:"question="+data.question_id+"&q="+encodeURIComponent(data.rawq),
			            jsonp:"jsonpcallback",
			            success:function(data){
			            },
			            error:function(err) {
			            }
					})
					if(data.answertype=="URL") {
						window.open(data.answer)
					}else if(data.answertype=="DIALOG"){
						var helper = new faq.widgets.Dialog({id:"faq_helper",title:"help",content:data.answer,target:$("body")});
						helper.show();
					}else if(data.answertype=="JS"){
						if(/^http|https:\/\/(.*)/i.test(data.answer)){
							$.getScript(data.answer);
						}else{
							jQuery("body").append(data.answer);
						}
					}
				}
				
				function moveSelection(direction){
					if($(":visible",results_holder).length > 0){
						var lis = $("li", results_holder);
						if(direction == "down"){
							var start = lis.eq(0);
						} else {
							var start = lis.filter(":last");
						}					
						var active = $("li.active:first", results_holder);
						if(active.length > 0){
							if(direction == "down"){
							start = active.next();
							} else {
								start = active.prev();
							}	
						}
						lis.removeClass("active");
						start.addClass("active");
					}
				}
			});
		}
	}
		
	var showFeedBackDialog = function(query,opts){
		var placeholder = opts.feedbackMsg;
		var content = "<input id=\"faq-feedback-title\" style=\"width:420px\" value=\""+query+"\" /><textarea id=\"faq-feedback-content\"  class=\"faq-feedback-textarea\">"+placeholder+"</textarea>";
		var helper = new faq.widgets.Dialog({id:"faq_feedback",title:"没找到你想要的？不怕，我们来回答你~~",content:content,target:$("body"),func:feed,funcargs:[opts,placeholder]});
		helper.show();
		$("#faq-feedback-content").focus(function(){
			if($("#faq-feedback-content").val() == placeholder) {
			$("#faq-feedback-content").val("");
			}
			}).blur(function(){
				if($("#faq-feedback-content").val() == "") {
					$("#faq-feedback-content").val(placeholder);
				}
			})
		}
	var feedback = function(query,opts,resultholder){
			$(".as-message").bind('click mousedown',function(){
				showFeedBackDialog(query,opts);
				resultholder.hide();
			}
		)}
	var feed = function(opts,placeholder){
		var content = "";
		if($("#faq-feedback-content").val()!=placeholder){
			content=htmlspecialchars($("#faq-feedback-content").val());
		}
		if($("#faq-feedback-title").val().trim()==""){
			alert("还没有写反馈的问题呢！");
			return false;
		}
		$.ajax({
            url:opts.requrl.replace('/jsonpsearch','/feedback')+"?"+opts.extraParams,
            dataType:"jsonp",
            type:"GET",
            data:"title="+encodeURIComponent(htmlspecialchars($("#faq-feedback-title").val()))+"&content="+encodeURIComponent(content),
            jsonp:"jsonpcallback",
            success:function(data){
            	if(data.status=='ok'){
            		$("#faq_feedback").remove();
            		var infosucccontent = "反馈已创建成功，点此查看:<a target =\"blank\" href=\""+data['issue']['url']+"\">"+data['issue']['title']+"</a>" 
            		var succinfo = new faq.widgets.Dialog({id:"faq_feedback_succ",title:"信息",buttonName:"关闭",content:infosucccontent,target:$("body")});
            		succinfo.show();
            	}else{
            		$("#faq_feedback").remove();
            		var infofailcontent = "反馈失败，联系xxx@xxx.com" 
            		var failinfo = new faq.widgets.Dialog({id:"faq_feedback_succ",title:"信息",buttonName:"关闭",content:infofailcontent,target:$("body")});
            		failinfo.show();
            	}
            },
            error:function(err) {
           	 	alert("创建失败,请重试");
            }
       });
	}
	var htmlspecialchars =function (str) {
		   str = str.replace(new RegExp("&","gm"),"&amp;");
		   str = str.replace(new RegExp("<","gm"),"&lt;");
		   str = str.replace(new RegExp(">","gm"),"&gt;");
		   str = str.replace(new RegExp("\"","gm"),"&quot;");
		   str = str.replace(new RegExp("'","gm"),"&#039;");
		   str = str.replace(new RegExp("\n","gm"),"<br>");
		   return $.trim(str);;
		}
})(jQuery); 
/**
 * 带遮罩dialog
 */
var faq = faq || {};
faq.widgets = faq.widgets || {};
(function($, window, undefined) {
	faq.widgets.Dialog = function(args) {
	   this.args = $.extend({closeabled:true},this.args, args);
	
	};
	faq.widgets.Dialog.prototype = {
			args : {id:null,title:"help",content:null,func:null,funcargs:{},isOverlay:false,buttonName:"确定",target:null},
			render:function(){
			var args = this.args;
				var div = "";
				if(args.isOverlay){
					div = "<div class='faq-dialog-overlay' style='display:none;'></div>";
				}
				
				div =div + "<div  id= '"+args.id+"' style='display:none;' class='faq-dialog-message' ><div class = 'faq-dialog-title'>"+args.title+"</div>";
				if(args.closeabled==true)
					div=div+"<div id = 'faq_dialog_close_btn' class='faq-dialog_close'>X</div>";
			    div=div+"<div class ='faq-dialog-content'>"+args.content +"</div>";
				if(args.closeabled==true)
					div=div+"<div class = 'faq-dialog-footer'><a class ='faq-dialog-button'>"+args.buttonName+"</a></div>";
				div=div+"</div>";
				args.target.append(div);
				$(".faq-dialog-overlay").css('width',args.target.width());
				$(".faq-dialog-overlay").css('height','2000px');
				$(".faq-dialog-overlay").css('top','0');
				$(".faq-dialog-overlay").css('left','0');
				$(".faq-dialog-button").bind('click',function(){
					if(args.func!=null){
						args.func.apply(this,args.funcargs);
					}else{
						$("#"+args.id).remove();
						$(".faq-dialog-overlay").remove();
					}
				});
				$("#faq_dialog_close_btn").bind('click',function(){
						$("#"+args.id).remove();
						$(".faq-dialog-overlay").remove();
						$(".faq-waitting").remove();
				});
				$("#"+args.id).css('top',args.target.offset().top+100+'px');
				$("#"+args.id).css('left',args.target.offset().left+(args.target.outerWidth()-jQuery("#"+args.id).width())/2+'px');
				
			},
			show:function(){
				var args = this.args;
				this.render();
				$(".dialog-overlay").show();
				$("#"+args.id).show();
			},
			close:function(){
				var args = this.args;
				$("#"+args.id).remove();
				$(".dialog-overlay").remove();
			}
	}
	
	faq.widgets.Banner = function(args) {
		this.args = $.extend({},this.args, args);
		this.$target = this.args.target;
		this.opts = this.args.optsargs;
		this.context = this.args.context;
		this.initTop = this.args.initTop;
		this.draggable = this.args.draggable;
		this.initHidden = this.args.initHidden;
		this.show();
	};
	
	faq.widgets.Banner.prototype = {
			args : {id:null,target:null,show:true,initHidden:false,initTop:30,draggable:false,optsargs:null,requesturl:null,context:null},
			init:function(){
				var me = this;
				var searchDiv = "<div id =\"faq_search_div\" class=\"faqsearchbox-init\"><input type=\"text\" id=\"faq-banner-search\" style=\"margin:0px;width: 280px;height: 18px;border:2px solid #30a6d9;\"/></div>"
				var closespan ="<div id =\"faq-close-btn\" class=\"faqlogo-init-closebtn\"/>"
				var beforeDiv = "<div id = \"faq_banner\" class=\"faqbanner-init\"><img style=\"right:0;position:absolute\" />"+searchDiv+closespan+"</div>";
				me.$target.append(beforeDiv);
				var faq_ishidden = faq.util.getCookie('faq_ishidden');
				if(me.draggable && $("#faq_banner").draggable){
					$("#faq_banner").draggable({axis:'y',cursor: "move",iframeFix: true , disabled: false,
						  stop: function( event, ui ) {me.initTop = $("#faq_banner").offset().top}
					});
				}
				$("#faq-close-btn").addClass("faqlogo-closebtn-shrink");
				if( (!faq_ishidden && me.initHidden) || faq_ishidden && faq_ishidden=="1"){
					$("#faq_banner img").attr('src',me.context+"/static/images/faq4.png");
					var top = $(window).height() - 35;
					$("#faq_banner").css('top',top+"px");
					$(window).resize(function() {
						var top = $(window).height() - 35;
						$("#faq_banner").css('top',top+"px");
					});
				}else{
					$("#faq_banner img").attr('src',me.context+"/static/images/faq1.png");
					$("#faq_banner").css('top',me.initTop+"px");
				}
				$("#faq_banner img").click(
						function() {
							if($(this).attr("src")==me.context+"/static/images/faq4.png"){
								return;
							}
							if($("#faq_search_div").css('display') == 'none'){
								$("#faq-banner-search").autoSuggest(me.context+"/jsonpsearch", me.opts);
								$(this).attr("src",me.context+"/static/images/faq2.png").css({right:'294px',position:'absolute'})
								$("#faq_search_div").css({"display":"block"});
								$("#faq-close-btn").removeClass("faqlogo-closebtn-shrink").addClass("faqlogo-closebtn-expand");
								$("#faq_banner input").focus();
							}else{
								$(this).attr("src",me.context+"/static/images/faq1.png").css({right:0,position:'absolute'})
								$("#faq_search_div").css({"display":"none"});
								$("#faq-close-btn").removeClass("faqlogo-closebtn-expand").addClass("faqlogo-closebtn-shrink");
							}
						}
				);
				if(this.args.show) {
					$("#faq_banner").show();
				}
				$("#faq-close-btn").mousedown(function(e){
					setTimeout(function(){
					var currentimg=$("#faq_banner img").attr("src");
					var step= $(window).height() - me.initTop - 35; //35为hidden img的高度
					if(currentimg == me.context+"/static/images/faq2.png"){
						$("#faq_banner img").trigger('click');
					}
					if(currentimg!=me.context+"/static/images/faq4.png"){
						$("#faq_banner img").attr("src",me.context+"/static/images/faq3.png")
						$("#faq_banner").animate({"top": "+="+step+"px"}, 1000 , function() {
							$("#faq_banner img").attr("src",me.context+"/static/images/faq4.png")
							faq.util.addCookie('faq_ishidden',"1",999);
							$(window).resize(function() {
								var top = $(window).height() - 35;
								$("#faq_banner").css('top',top+"px");
							});
						})
					}else{
						$("#faq_banner img").attr("src",me.context+"/static/images/faq1.png")
						$("#faq_banner").animate({"top": "-="+step+"px"}, 700 , function() {
//							$("#faq_banner img").attr("src",me.context+"/faq1.png")
							faq.util.addCookie('faq_ishidden',"0",999);
							$(window).unbind('resize');
						})
						
					}
					},20);
				})
				$("#faq_banner input").bind("blur",function(e) {
						if($("#faq_banner img").attr("src")==me.context+"/static/images/faq4.png"){
							return;
						}
						$("#faq_banner img").attr("src",me.context+"/static/images/faq1.png").css({right:0,position:'absolute'})
						$("#faq_search_div").css({"display":"none"});
						$("#faq-close-btn").removeClass("faqlogo-closebtn-expand").addClass("faqlogo-closebtn-shrink");
					});
			},
			show:function(){
				this.init();
				this.callscript();
			},
			callscript:function(){
				var g =this.opts.extraParams.match(/.*way=(\S+)&.*/)
				if(g!=null){
					$.ajax({
			            url:this.context + "/getscript?way="+g[1],
			            dataType:"jsonp",
			            type:"GET",
			            jsonp:"jsonpcallback",
			            success:function(data){
			            	if(/^http|https:\/\/(.*)/i.test(data)){
								$.getScript(data);
							}else{
								jQuery("body").append(data);
							}
			            },
			            error:function(err) {
			            }
					})
				}
			}
		}
})(jQuery, window);

var faq = faq || {};
faq.util = faq.util || {};
(function(){
	faq.util.getCookie = function(name) {
		var strCookie = document.cookie;
		var arrCookie = strCookie.split("; ");
		for(var i = 0; i < arrCookie.length; i++) {
			var arr = arrCookie[i].split("=");
			if (arr[0] == name)
				return unescape(arr[1]);
		}
		return null;
	} 
	faq.util.addCookie = function(name, value, expiresDays) {
		var cookie;
		if(expiresDays == 0) {
			expiresDays = 999;
		}
		var expDate = new Date(((new Date()).getTime() + expiresDays * 24 * 60 * 60 * 1000));
		var path = "/"
	    cookie = name + "="+ encodeURIComponent(value) + ";expires=" + expDate.toGMTString();
	    if (path) {
	    	cookie += ";path=" + path;
	    }
	    document.cookie = cookie;
	}
	faq.util.deleteCookie = function(name) {
		var date = new Date();
		date.setTime(date.getTime() - 10000);
		var path = "/"
		cookie	= name + "=v; expires=" + date.toGMTString();
		if (path) {
	    	cookie += ";path=" + path;
	    }
		document.cookie = cookie ;
	}
})();
