
/////////////////////////////////
var storage = window.localStorage;

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
					reject()
				}
			});
		});
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
				var row = $("<div>").addClass("form-group");
				$("<label>").text(res[i]).appendTo(row);
				$("<textarea>").attr("id", res[i]).addClass("form-control").appendTo(row);
				row.appendTo(fields);
			}
			
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
		
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
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
		});
		
	}
	

)