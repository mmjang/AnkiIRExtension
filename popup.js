
/////////////////////////////////
var storage = window.localStorage;
var is_in_dict ={}

//storage.current_deck
//storage.current_model
/////////////////////////////////
var analyse_selection = function(sel)
{
	var html = sel;
	var div = document.createElement("div");
	div.innerHTML = html;
	var sel = div.textContent || div.innerText || "";
	var sel = sel.trim()
	var words = sel.split(" ")
	var word_count = words.length
	for(var i = 0; i < word_count; i++)
	{
		words[i] = words[i].trim()
	}
	return {
		count:word_count,
		word_array : words
	}		
}
/////////////////////////////////
//toast//
toast = function(div, mess, type)
{
	var mess_class = "bg-info"
	if(type == "success")
	{
		mess_class = "bg-success"
	}
	if(type == "danger")
	{
		mess_class = "bg-danger"
	}
	var o = $("<h2>").attr("hidden","hidden").prependTo(div)
	o.text(mess)
	 .addClass(mess_class)
	 .fadeIn()
	 .delay(300)
	 .fadeOut()
}
/////////////
//get word///
var get_selection = new Promise(function(resolve, reject)
	{
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {action: "get_selection"}, function(response) {
				if(response.selection)
				{
					var result = analyse_selection(response.selection)
					resolve(result)
				}
				else
				{
					reject(result)
				}
			});
		});
	}
)
//////////////////////////////
var load_json = new Promise(
	function(resolve, reject)
	{
		$.getJSON("hwd.json",
			resolve
		)
	}
)

//////////////////////////////
function ankiInvoke(action, params, pool, callback) {
        if (true) {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('loadend', () => {
                if (pool !== null) {
                    delete this.asyncPools[pool];
                }

                const resp = xhr.responseText;
                callback(resp ? JSON.parse(resp) : null);
            });

            xhr.open('POST', 'http://127.0.0.1:8765');
            xhr.send(JSON.stringify({action, params}));
        } else {
            callback(null);
        }
}

function updateFields()
{
	//set local storage
	storage.current_deck = $("#sel_deck").val();
	storage.current_model = $("#sel_model").val();
	//
	var fields = $("#fields");
	var current_model = $("#sel_model").val();
	ankiInvoke("modelFieldNames", {"modelName":current_model}, null,
		function(res)
		{
			//clear fields 
			fields.empty();
			var i;
			for(i = 0; i < res.length; i ++)
			{
				var row1 = $("<div>").addClass("row")
				var row2 = $("<div>").addClass("row")
				var col1 = $("<div>").addClass("col-xs-12")
				var col2 = $("<div>").addClass("col-xs-12")
				$("<label>").text(res[i]).appendTo(col1)
				col1.appendTo(row1)
				row1.appendTo(fields)
				$("<textarea>").attr("id", res[i])
							   .addClass("field")
							   .appendTo(col2)
				col2.appendTo(row2)
				row2.appendTo(fields)
			}
			
			$("textarea").htmlarea(
		{
				toolbar:["bold","italic","underline","|","increasefontsize","decreasefontsize",
						"|","p"
				]
			}			
			)
			
			$("iframe").attr("style")
			
			if(storage.selection)
			{
				$("#" + res[0]).text(storage.selection);
			}
		}
	);
}

$(document).ready(
	function(){
		//get decks
		ankiInvoke("deckNames",{},null,
			function(res)
			{
				console.log(res);
				var sel_deck = $("#sel_deck");
				sel_deck.empty();
				for(i = 0; i < res.length; i ++)
				{
					$("<option>").text(res[i]).attr("value", res[i]).appendTo(sel_deck);
				}
				
				if(storage.current_deck)
				{
					sel_deck.val(storage.current_deck);
				}
				//updateFields();
			}
		)
		
		//get models
		ankiInvoke("modelNames",{},null,
			function(res)
			{
				console.log(res);
				var sel_model = $("#sel_model");
				sel_model.empty();
				for(i = 0; i < res.length; i ++)
				{
					$("<option>").text(res[i]).attr("value", res[i]).appendTo(sel_model);
				}
				
				if(storage.current_model)
				{
					sel_model.val(storage.current_model);
				}
				updateFields();
			}
		)
		//link action
		$("#sel_model").change(updateFields);
		$("#sel_deck").change(updateFields);
		
		//test definition fill up
		if(false)
		{
			ankiInvoke("queryWord",{"word":storage.selection},null,
				function(res){
					$("#definition").html(res.definition)
				}
			)
		}
		
/* 		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {action: "get_selection"}, function(response) {
				storage.selection = response.selection;
				if(storage.selection)
				{
					ankiInvoke("queryWord",{"word":storage.selection},null,
					function(res){
					$("#definition").html(res.definition)
					}
					)
				}		
			});
		}); */
		
		load_json.then(
			function(res)
			{
				var input = document.getElementById("hwd")
				//init is_in_dict
				res["hwd"].forEach(
					function(word)
					{
						is_in_dict[word] = true
					}
				)
				//init awesomplete
				var awesomplete = new Awesomplete(
					input,
					{
						list:res["hwd"],
						autoFirst:true,
						filter: function(text, input){
							return text.toLowerCase().startsWith(input.toLowerCase())
						}
					}
				)
				
				//add trigger
				window.addEventListener("awesomplete-selectcomplete",
					function(e)
					{
						console.log("e",e)
						ankiInvoke("queryWord", {"word":e.text.value},null,
							function(res)
							{
								$("#definition").html(res.definition)
							}
						)
					}
				)
				
				//get selection
				get_selection.then(
					/////////////读取到选择的单词
					function(sel)
					{
						console.log("get_selection", sel)
						if(sel.count && (sel.count == 1 || sel.count == 2 || sel.count == 3))
						{
							$("#hwd").val(sel.word_array[0].toLowerCase()).focus()
							if(is_in_dict[sel.word_array[0].toLowerCase()])
							{
								$("#search").trigger("click")
							}
							else
							{
								awesomplete.evaluate()
							}
							
						}
					}
					,
					/////////////没有读取到选择部分
					function()
					{
						$("#hwd").focus()
					}
				)
			}
		)
		$("#search").click(
			function()
			{
				var word = $("#hwd").val()
				console.log(word);
				if(!is_in_dict[word])
				{
					return
				}
				ankiInvoke("queryWord",{"word":word},null,
					function(res){
					console.log(res)
					$("#definition").html(res.definition)
					}
					)
			}
		)
		
		$("#btn_add").click(
			function(o)
			{
				var flds = {}
				var media_data = {}
				var fields_textarea = $(".field")
				if(!fields_textarea)
				{
					return
				}
				fields_textarea.each
				(
					function(i,o)
					{
						var obj = $(o)
						field_name = obj.attr("id")
						media_data[field_name] = []
						var container = $("<div>")
						var content = $(obj.val())
						content.appendTo(container)
						container.find("a>img")
							   .parent()
							   .each(
									function(i,o)
									{
									var a_media = $(o)
									media_data[field_name].push(a_media.attr("href").slice(7))
									a_media.text("[" + a_media.attr("href") + "]")
									a_media.attr("href","")
									}
									)
						
						flds[field_name] = container.html()
					}
				)
				
				var note_data =
				{
					"deckName":storage.current_deck,
					"modelName":storage.current_model,
					"fields" : flds,
					"tags":[]
				}
				console.log(media_data)
				ankiInvoke("addMedia",{"mediaData":media_data},null,
					function(response)
					{
						console.log(response)
						if(response.success)
						{
							//////////////////置换媒体文件名/////////////////////////////
							toast($("#div_mess"),"Media file added!!!","success")
							var keys_fld = Object.keys(response.data)
							for(var i = 0; i < keys_fld.length; i ++)
							{
								var fild_media = response.data[keys_fld[i]]
								var media_replace_list_keys = Object.keys(fild_media)
								for(var kk = 0; kk < media_replace_list_keys.length; kk ++)
								{
									origin_name = media_replace_list_keys[kk]
									anki_name = fild_media[origin_name]
									flds[keys_fld[i]] = flds[keys_fld[i]].replace(new RegExp(origin_name,"g"), anki_name)
									console.log(
										flds[keys_fld[i]],
										origin_name,
										anki_name
									)
								}
								flds[keys_fld[i]] = flds[keys_fld[i]].replace(new RegExp("sound:/","g"),"sound:")
							}
							////////////////////////////////////////////////////////////////////
							ankiInvoke("addNote", {"note":note_data},null,
								function(res)
								{
								console.log("res",res)
								if(res)
								{
								//make a toast
									toast($("#div_mess"),"Card Added","success")
								}
								else
								{
									toast($("#div_mess"), "Failed", "danger")			
								}
								}
							)
						}
					}
				)
				
				
			}
		)
		
	}
	

)