(function() {
/**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
 if (window.hasRun) {
    return;
  }
  window.hasRun = true;

	function init() {
		console.log("Running again")
		/*
		//Transform to new storage place
		browser.storage.local.get("hn_banned").then((item)=>{
			//if(item==null) {
				console.log("Changing storage place")
				browser.storage.sync.get("hn_banned").then((item)=>{
					browser.storage.local.set({"hn_banned_v1":item.hn_banned})
				})
			//} else {
			//	console.log("Nothing to do")
			//}
		})
*/
		chrome.storage.local.get("hn_banned_v1", function(value) {
			var users = value.hn_banned_v1 || {};

			function banUser(username) {
				users[username] = {
					username: username,
					blocked: true,
					timestamp: Date.now()
				};
				chrome.storage.local.set({"hn_banned_v1": users});
			}

			function unbanUser(username) {
				delete users[username];
				chrome.storage.local.set({"hn_banned_v1": users});
			}

			function listener(changes, namespace) {
				chrome.storage.onChanged.removeListener(listener);
				init();
			}

			chrome.storage.onChanged.addListener(listener);

			function handleItem(item) {
				var username = item.querySelector("a").text;
				var contents = item.querySelector(".comment span");

				var seperator = item.querySelector(".hn_bl_seperator");

				if (seperator !== null) {
					seperator.remove();
					seperator = null;
				}

				seperator = document.createElement("span");
				seperator.innerHTML = " | ";
				seperator.className = "hn_bl_seperator";

				var actor = document.createElement('a');
				actor.href = "#";

				item.querySelector(".comhead").appendChild(seperator);
				seperator.appendChild(actor);

				var blockedMessage = item.querySelector(".blocked");

				if (blockedMessage !== null) {
					blockedMessage.remove();
				}

				if (users[username] !== undefined) {
					contents.style.display = "none";

					actor.innerHTML = "unblock";
					actor.onclick = function() {
						unbanUser(username);
						return false;
					};

					var banned = document.createElement('span');
					banned.innerHTML = "[blocked]";
					banned.className = "blocked";

					item.querySelector(".comment").appendChild(banned);
				} else {
					contents.style.display = "block";

					actor.innerHTML = "block";
					actor.onclick = function() {
						banUser(username);
						return false;
					};
				}
			}

			var comments = document.querySelectorAll(".default");

			for (var i = 0; i < comments.length; ++i) {
				handleItem(comments[i]);
			}
		});
	}

	init();
})();
