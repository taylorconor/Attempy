function initMenu(){
	$('#diagram rect').on('click', function() {
		$('rect').css("fill","lightblue");
		var thisRect = $(this);
		thisRect.css('fill',"red");
		$('#selected').html(thisRect.attr("id"));
	});

	$('#diagram').click(function(event) { 
	    if(!$(event.target).closest('#diagram rect').length && !$(event.target).is('#diagram rect')) {
	        $('#diagram rect').css("fill","lightblue");
	        $('#selected').html("-1");
	    }        
	});

	$('#selected').bind("DOMSubtreeModified", function() {
		
	});
}