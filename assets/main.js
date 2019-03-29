var config = {
	apiKey: "AIzaSyBs2SdgeglfAgiRIHZBdRKO_NUzbr1RImc",
	authDomain: "roshambo-2x.firebaseapp.com",
	databaseURL: "https://roshambo-2x.firebaseio.com",
	projectId: "roshambo-2x",
	storageBucket: "roshambo-2x.appspot.com",
	messagingSenderId: "216939373121"
};
firebase.initializeApp(config);
var database = firebase.database();

var user1 = null;
var user2 = null;
var user1Name = "";
var user2Name = "";
var youruserName = "";
var user1Choice = "";
var user2Choice = "";
var turn = 1;

// listener
database.ref("/users/").on("value", function (snapshot) {
	// Check for user1
	if (snapshot.child("user1").exists()) {
		user1 = snapshot.val().user1;
		user1Name = user1.name;
		$("#user1").text(user1Name);
		$("#user1score").html("Win: " + user1.win + ", Loss: " + user1.loss + ", Tie: " + user1.tie);
	} else {
		user1 = null;
		user1Name = "";
		$("#user1").text("Waiting for user 1");
		$("#userPanel1").removeClass("userTurn");
		$("#userPanel2").removeClass("userTurn");
		database.ref("/result/").remove();
		$("#result").html("Rock-Paper-Scissors");
		$("#wait").html("");
		$("#user1score").html("Win: 0, Loss: 0, Tie: 0");
	}

	// Check for user2
	if (snapshot.child("user2").exists()) {
		user2 = snapshot.val().user2;
		user2Name = user2.name;
		$("#user2").text(user2Name);
		$("#user2score").html("Win: " + user2.win + ", Loss: " + user2.loss + ", Tie: " + user2.tie);
	} else {
		user2 = null;
		user2Name = "";
		$("#user2").text("Waiting for user 2");
		$("#userPanel1").removeClass("userTurn");
		$("#userPanel2").removeClass("userTurn");
		database.ref("/result/").remove();
		$("#result").html("Rock-Paper-Scissors");
		$("#wait").html("");
		$("#user2score").html("Win: 0, Loss: 0, Tie: 0");
	}

	// Start game
	if (user1 && user2) {
		// 
		$("#userPanel1").addClass("userTurn");

		// Update the center display
		$("#wait").html("Waiting on " + user1Name + " to choose");
	}

	// If both users leave the game, empty the chat session
	if (!user1 && !user2) {
		database.ref("/chat/").remove();
		database.ref("/turn/").remove();
		database.ref("/result/").remove();

		$("#inputBox").empty();
		$("#userPanel1").removeClass("userTurn");
		$("#userPanel2").removeClass("userTurn");
		$("#result").html("Rock-Paper-Scissors");
		$("#wait").html("");
	}
});

// Listener to check for disconnect
database.ref("/users/").on("child_removed", function (snapshot) {
	var msg = snapshot.val().name + " has disconnected!";
	var chatKey = database.ref().child("/chat/").push().key;
	database.ref("/chat/" + chatKey).set(msg);
});

// Listener for new chat messages
database.ref("/chat/").on("child_added", function (snapshot) {
	var chatMsg = snapshot.val();
	var chatEntry = $("<div>").html(chatMsg);

	if (chatMsg.includes("disconnected")) {
		chatEntry.addClass("disconnect");
	} else if (chatMsg.includes("joined")) {
		chatEntry.addClass("joined");
	} else if (chatMsg.startsWith(youruserName)) {
		chatEntry.addClass("chat");
	} else {
		chatEntry.addClass("chat2");
	}

	$("#inputBox").append(chatEntry);
	$("#inputBox").scrollTop($("#inputBox")[0].scrollHeight);
});

// Determine whos turn it is
database.ref("/turn/").on("value", function (snapshot) {
	if (snapshot.val() === 1) {
		turn = 1;

		if (user1 && user2) {
			$("#userPanel1").addClass("userTurn");
			$("#userPanel2").removeClass("userTurn");
			$("#wait").html("Waiting on " + user1Name + " to choose");
		}
	} else if (snapshot.val() === 2) {
		turn = 2;

		if (user1 && user2) {
			$("#userPanel1").removeClass("userTurn");
			$("#userPanel2").addClass("userTurn");
			$("#wait").html("Waiting on " + user2Name + " to choose");
		}
	}
});

// Add user to database
$("#addUser").on("click", function (event) {
	event.preventDefault();

	if (($("#userName").val().trim() !== "") && !(user1 && user2)) {
		if (user1 === null) {

			youruserName = $("#userName").val().trim();
			user1 = {
				name: youruserName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};
			database.ref().child("/users/user1").set(user1);


			// user1 goesfirst
			database.ref().child("/turn").set(1);

			// remove user when they leave
			database.ref("/users/user1").onDisconnect().remove();

			// Add user two after user one
		} else if ((user1 !== null) && (user2 === null)) {

			youruserName = $("#userName").val().trim();
			user2 = {
				name: youruserName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};
			database.ref().child("/users/user2").set(user2);

			// remove user when they leave
			database.ref("/users/user2").onDisconnect().remove();
		}

		// Chat notification on join
		var msg = youruserName + " joined!";
		var chatKey = database.ref().child("/chat/").push().key;
		database.ref("/chat/" + chatKey).set(msg);
		$("#userName").val("");
	}
});

// User1's choice
$("#userPanel1").on("click", ".gameOption", function (event) {
	event.preventDefault();

	if (user1 && user2 && (youruserName === user1.name) && (turn === 1)) {
		var choice = $(this).text().trim();
		user1Choice = choice;
		database.ref().child("/users/user1/choice").set(choice);

		// Change to user 2 turn
		turn = 2;
		database.ref().child("/turn").set(2);
	}
});

// User2's choice
$("#userPanel2").on("click", ".gameOption", function (event) {
	event.preventDefault();

	if (user1 && user2 && (youruserName === user2.name) && (turn === 2)) {
		var choice = $(this).text().trim();
		user2Choice = choice;
		database.ref().child("/users/user2/choice").set(choice);

		// Check results
		score();
	}
});

// Rock Paper scissors logic
function score() {
	if (user1.choice === "Rock") {
		if (user2.choice === "Rock") {
			// Tie

			database.ref().child("/result/").set("Tie game!");
			database.ref().child("/users/user1/tie").set(user1.tie + 1);
			database.ref().child("/users/user2/tie").set(user2.tie + 1);
		} else if (user2.choice === "Paper") {
			// user2 wins

			database.ref().child("/result/").set("Paper wins!");
			database.ref().child("/users/user1/loss").set(user1.loss + 1);
			database.ref().child("/users/user2/win").set(user2.win + 1);
		} else { // scissors
			// user1 wins

			database.ref().child("/result/").set("Rock wins!");
			database.ref().child("/users/user1/win").set(user1.win + 1);
			database.ref().child("/users/user2/loss").set(user2.loss + 1);
		}

	} else if (user1.choice === "Scissors") {
		if (user2.choice === "Rock") {
			// user2 wins

			database.ref().child("/result/").set("Rock wins!");
			database.ref().child("/users/user1/loss").set(user1.loss + 1);
			database.ref().child("/users/user2/win").set(user2.win + 1);
		} else if (user2.choice === "Paper") {
			// user1 wins

			database.ref().child("/result/").set("Scissors win!");
			database.ref().child("/users/user1/win").set(user1.win + 1);
			database.ref().child("/users/user2/loss").set(user2.loss + 1);
		} else {
			// Tie

			database.ref().child("/result/").set("Tie game!");
			database.ref().child("/users/user1/tie").set(user1.tie + 1);
			database.ref().child("/users/user2/tie").set(user2.tie + 1);
		}

	} else if (user1.choice === "Paper") {
		if (user2.choice === "Rock") {
			// user1 wins

			database.ref().child("/result/").set("Paper wins!");
			database.ref().child("/users/user1/win").set(user1.win + 1);
			database.ref().child("/users/user2/loss").set(user2.loss + 1);
		} else if (user2.choice === "Paper") {
			// Tie

			database.ref().child("/result/").set("Tie game!");
			database.ref().child("/users/user1/tie").set(user1.tie + 1);
			database.ref().child("/users/user2/tie").set(user2.tie + 1);
		} else { // Scissors
			// user2 wins

			database.ref().child("/result/").set("Scissors win!");
			database.ref().child("/users/user1/loss").set(user1.loss + 1);
			database.ref().child("/users/user2/win").set(user2.win + 1);
		}
	}


	// Back to user1 turn
	turn = 1;
	database.ref().child("/turn").set(1);
}

// game results
database.ref("/result/").on("value", function (snapshot) {
	$("#result").html(snapshot.val());
});

// Add chat
$("#inputButton").on("click", function (event) {
	event.preventDefault();

	if ((youruserName !== "") && ($("#input").val().trim() !== "")) {
		var msg = youruserName + ": " + $("#input").val().trim();
		$("#input").val("");
		var chatKey = database.ref().child("/chat/").push().key;
		database.ref("/chat/" + chatKey).set(msg);
	}
});