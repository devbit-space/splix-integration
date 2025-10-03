const serverSelectEl = /** @type {HTMLSelectElement} */ (document.getElementById("serverSelect"));
export async function initServerSelection() {
	let endPoint;
	if (!IS_DEV_BUILD) {
		endPoint = "https://splix.io/gameservers";
	} else {
		const url = new URL(location.href);
		url.pathname = "/servermanager/gameservers";
		endPoint = url.href;
	}

	console.log("Attempting to fetch servers from:", endPoint);
	try {
		const response = await fetch(endPoint);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		/** @type {import("../../serverManager/src/ServerManager.js").ServersJson} */
		const servers = await response.json();
		console.log("Successfully loaded servers:", servers);

	while (serverSelectEl.firstChild) {
		serverSelectEl.firstChild.remove();
	}

	const officialGroup = document.createElement("optgroup");
	officialGroup.label = "Official";
	const unofficialGroup = document.createElement("optgroup");
	unofficialGroup.label = "Unofficial";

	/** @type {HTMLOptionElement[]} */
	const officialEndpoints = [];
	/** @type {HTMLOptionElement?} */
	let selectedEndpoint = null;
	const lastSelectedEndpoint = localStorage.getItem("lastSelectedEndpoint");
	const serverEndpoints = new Set(servers.servers.map((server) => server.endpoint));

	for (const server of servers.servers) {
		const optionEl = document.createElement("option");
		optionEl.value = server.endpoint;
		let textContent = server.displayName;
		if (server.playerCount > 0) {
			textContent += ` - ${server.playerCount}`;
		}
		optionEl.textContent = textContent;

		if (server.official) {
			officialEndpoints.push(optionEl);
			officialGroup.appendChild(optionEl);
		} else {
			unofficialGroup.appendChild(optionEl);
		}
		if (lastSelectedEndpoint && serverEndpoints.has(lastSelectedEndpoint)) {
			if (lastSelectedEndpoint === server.endpoint) {
				selectedEndpoint = optionEl;
			}
		} else if (server.recommended) {
			selectedEndpoint = optionEl;
		}
	}

	if (location.hash.indexOf("#ip=") == 0) {
		const optionEl = document.createElement("option");
		optionEl.value = location.hash.substring(4);
		optionEl.textContent = "From url";
		unofficialGroup.appendChild(optionEl);
		selectedEndpoint = optionEl;
	}

	if (!selectedEndpoint) {
		selectedEndpoint = officialEndpoints[0] || null;
	}

	if (officialGroup.childElementCount > 0) serverSelectEl.appendChild(officialGroup);
	if (unofficialGroup.childElementCount > 0) serverSelectEl.appendChild(unofficialGroup);

	serverSelectEl.selectedIndex = selectedEndpoint.index;

	serverSelectEl.disabled = false;
	const joinButton = document.getElementById("joinButton");
	if (joinButton) joinButton.disabled = false;
	} catch (error) {
		console.error("Failed to load server list:", error);
		console.log("Using fallback server option");
		// Fallback: add a default server option
		while (serverSelectEl.firstChild) {
			serverSelectEl.firstChild.remove();
		}
		const defaultOption = document.createElement("option");
		defaultOption.value = "ws://localhost:8080/gameserver";
		defaultOption.textContent = "Default Server";
		serverSelectEl.appendChild(defaultOption);
		serverSelectEl.disabled = false;
		const joinButton = document.getElementById("joinButton");
		if (joinButton) joinButton.disabled = false;
		console.log("Fallback server option added, join button enabled");
	}
}

export function getSelectedServer() {
	const server = serverSelectEl.value;
	console.log("Selected server:", server);
	return server;
}
