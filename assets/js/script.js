var input = document.querySelector("#search")
var addBtn = document.querySelector(".addAnime")
var items = document.querySelector(".items")
var itemCount = 0

// initialising vars
var title
var broadcastDay
var broadcastTime
var broadcastTimezone
var status
var rawData
var days
var hours
var minutes
var seconds
var countdown

// for caching
let animeList = []

// do not generate if empty
addBtn.addEventListener("click", function() {
    if (input.value.trim() !== "") {
        addItem();
        input.value = ""
    }
});

input.addEventListener("keypress", function(event) {
    if (event.key === "Enter" && input.value.trim() !== "") {
        addItem();
        input.value = ""
    }
});

// insert into cache
function saveAnimeSelection(animeNames) {
    localStorage.setItem('selectedAnimes', JSON.stringify(animeNames));
}

// retrieve from cache
function getSavedAnimeSelection() {
    const savedAnimes = localStorage.getItem('selectedAnimes');

    return savedAnimes ? JSON.parse(savedAnimes) : [];
}

// when window loads, get all list items stored in cache
window.onload = function() {
    const savedAnimes = getSavedAnimeSelection();
    
    savedAnimes.forEach((anime, index) => {
        setTimeout(() => {
            input.value = anime.input; // Set the input field to the saved user input
            addBtn.click(); // Simulate the button click to add the anime
        }, (index + 1) * 1000); // Delay each action by 1 second
    });

    setTimeout(() => {
        input.value = ""; // Clear the input field after all are loaded
    }, (savedAnimes.length + 1) * 1000);
};

// add inputted anime item to cache and display
function addItem() {
    const animeName = input.value.trim();
    
    // Avoid adding duplicate anime names
    if (!animeList.some(anime => anime.input.toLowerCase() === animeName.toLowerCase())) {
        // animeList.push({ 
        //     input: animeName, 
        //     title: "" // Placeholder for the API title
        // }); // Add user input with empty title placeholder

        // saveAnimeSelection(animeList); // Save updated list to localStorage

        // keeping track of item index
        itemCount++

        // making connection and inputting API elements
        var apiUrl = "https://api.jikan.moe/v4/anime";
        var queryParams = {
            "q": animeName,
            "limit": 1,
            "order_by": "end_date",
            "type": "tv"
        };
        var queryString = new URLSearchParams(queryParams).toString();
        var url = `${apiUrl}?${queryString}`;
        fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            // check if data is not empty
            if (data.data && data.data.length > 0) {
                // set vars needed
                title = data.data[0].title_english;

                // // Update animeList with the fetched title
                // const animeIndex = animeList.findIndex(anime => anime.input.toLowerCase() === animeName.toLowerCase());
                // if (animeIndex !== -1) {
                //     animeList[animeIndex].title = title;
                //     saveAnimeSelection(animeList); // Save updated list to localStorage
                // }

                animeList.push({ 
                    input: animeName, 
                    title: title // Placeholder for the API title
                }); // Add user input with empty title placeholder

                saveAnimeSelection(animeList);

                // set vars needed to calculate countdown
                broadcastDay = data.data[0].broadcast.day
                broadcastTime = data.data[0].broadcast.time
                broadcastTimezone = data.data[0].broadcast.timezone
                status = data.data[0].status
                mal_id = data.data[0].mal_id

                // check status
                if (status == "Currently Airing") {
                    // start debugging
                    // Get the current time in Tokyo timezone
                    const nowDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
                    //console.log("Current time in Tokyo (nowDate):", nowDate);

                    // Function to find the next occurrence of the specified day
                    function getNextDayOfWeek(date, dayOfWeek) {
                        const nextDay = new Date(date);
                        nextDay.setDate(date.getDate() + (dayOfWeek + 7 - date.getDay()) % 7);
                        return nextDay;
                    }

                    // Initialize nextBroadcastDay variable
                    let nextBroadcastDay;

                    // Switch statement to find the next occurrence of the specified broadcast day
                    switch (broadcastDay.toLowerCase()) {
                        case "sundays":
                            nextBroadcastDay = getNextDayOfWeek(nowDate, 0);
                            break;
                        case "mondays":
                            nextBroadcastDay = getNextDayOfWeek(nowDate, 1);
                            break;
                        case "tuesdays":
                            nextBroadcastDay = getNextDayOfWeek(nowDate, 2);
                            break;
                        case "wednesdays":
                            nextBroadcastDay = getNextDayOfWeek(nowDate, 3);
                            break;
                        case "thursdays":
                            nextBroadcastDay = getNextDayOfWeek(nowDate, 4);
                            break;
                        case "fridays":
                            nextBroadcastDay = getNextDayOfWeek(nowDate, 5);
                            break;
                        case "saturdays":
                            nextBroadcastDay = getNextDayOfWeek(nowDate, 6);
                            break;
                        default:
                            console.error("Invalid broadcast day specified.");
                            break;
                    }

                    // Set the broadcast time
                    const [broadcastHour, broadcastMinute] = broadcastTime.split(':');
                    nextBroadcastDay.setHours(broadcastHour);
                    nextBroadcastDay.setMinutes(broadcastMinute);
                    nextBroadcastDay.setSeconds(0);

                    //console.log("Next Broadcast Day (JST):", nextBroadcastDay);

                    // Parse the time into a Date object
                    const [thours, tminutes] = broadcastTime.split(":").map(Number);
                    const date = new Date();

                    // Set the time in JST (UTC+9)
                    date.setUTCHours(thours - 9, tminutes, 0, 0); // Subtract 9 hours to get UTC time

                    // Extract day, month, and year from nextBroadcastDay
                    const month = nextBroadcastDay.getMonth() + 1; // getMonth() returns 0-based, so add 1
                    const day = nextBroadcastDay.getDate();
                    const year = nextBroadcastDay.getFullYear();

                    // Format the date as mm/dd/yyyy - hh:mm [timezone]
                    const localTime = new Intl.DateTimeFormat('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hourCycle: 'h23', // 24-hour format
                        timeZoneName: 'short',
                    }).format(date);

                    // Combine the extracted values to create the final formatted date
                    const formattedDate = `${month.toString().padStart(2, '0')}/` + // Format month to 2 digits
                        `${day.toString().padStart(2, '0')}/` + // Format day to 2 digits
                        `${year} - ${localTime}`;
                    //console.log("Formatted Date (GMT):", formattedDate);

                    // Calculate the difference between now and nextBroadcastDay in milliseconds
                    const differenceMs = nextBroadcastDay - nowDate;

                    // Convert milliseconds to seconds
                    const differenceSeconds = Math.floor(differenceMs / 1000);

                    // Calculate days, hours, minutes, and seconds for the countdown
                    const days = Math.floor(differenceSeconds / (60 * 60 * 24));
                    const hours = Math.floor((differenceSeconds % (60 * 60 * 24)) / (60 * 60));
                    const minutes = Math.floor((differenceSeconds % (60 * 60)) / 60);
                    const seconds = differenceSeconds % 60;

                    const countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                    // end debugging

                    // Create a new item element
                    const newItem = document.createElement('div');
                    newItem.classList.add('item', `item${itemCount}`);

                    // Create the main-info div
                    const mainInfoDiv = document.createElement('div');
                    mainInfoDiv.classList.add('main-info');

                    // Create the name div
                    const nameDiv = document.createElement('div');
                    nameDiv.classList.add('name');

                    // if (title.includes("Mushoku Tensei: Jobless Reincarnation Season 2 Part 2")) {
                    //     // Create the title element and set its text content
                    //     const titleElement = document.createElement('h2');
                    //     const linkElement = document.createElement("a");
                    //     linkElement.href = "https://aniwave.to/watch/mushoku-tensei-jobless-reincarnation-season-2.2o9ql/"
                    //     linkElement.target = "_blank"
                    //     linkElement.classList.add("underlineEffect")
                    //     linkElement.textContent = title;

                    //     titleElement.appendChild(linkElement)

                    //     // Append the title element to the name div
                    //     nameDiv.appendChild(titleElement);
                    // }

                    // else if (title.includes("That Time I Got Reincarnated as a Slime Season 3")) {
                    //     // Create the title element and set its text content
                    //     const titleElement = document.createElement('h2');
                    //     const linkElement = document.createElement("a");
                    //     linkElement.href = "https://aniwave.to/watch/tensei-shitara-slime-datta-ken-3rd-season.n3kwk/"
                    //     linkElement.target = "_blank"
                    //     linkElement.classList.add("underlineEffect")
                    //     linkElement.textContent = title;

                    //     titleElement.appendChild(linkElement)

                    //     // Append the title element to the name div
                    //     nameDiv.appendChild(titleElement);
                    // }

                    // else if (title.includes("KonoSuba: God's Blessing on This Wonderful World! 3")) {
                    //     // Create the title element and set its text content
                    //     const titleElement = document.createElement('h2');
                    //     const linkElement = document.createElement("a");
                    //     linkElement.href = "https://aniwave.to/watch/kono-subarashii-sekai-ni-shukufuku-wo-3.prj3j/"
                    //     linkElement.target = "_blank"
                    //     linkElement.classList.add("underlineEffect")
                    //     linkElement.textContent = title;

                    //     titleElement.appendChild(linkElement)

                    //     // Append the title element to the name div
                    //     nameDiv.appendChild(titleElement);
                    // }

                    // else if (title.includes("Chillin' in Another World with Level 2 Super Cheat Powers")) {
                    //     // Create the title element and set its text content
                    //     const titleElement = document.createElement('h2');
                    //     const linkElement = document.createElement("a");
                    //     linkElement.href = "https://aniwave.to/watch/lv2-kara-cheat-datta-moto-yuusha-kouho-no-mattari-isekai-life.kwmmw/"
                    //     linkElement.target = "_blank"
                    //     linkElement.classList.add("underlineEffect")
                    //     linkElement.textContent = title;

                    //     titleElement.appendChild(linkElement)

                    //     // Append the title element to the name div
                    //     nameDiv.appendChild(titleElement);
                    // }

                    // else {
                        const titleElement = document.createElement('h2');
                        titleElement.textContent = title;
                        titleElement.classList.add('underlineEffect');

                        // Create an <a> element and set the link using mal_id
                        const linkElement = document.createElement('a');
                        linkElement.href = `https://myanimelist.net/anime/${mal_id}`; // Replace 'mal_id' with your variable
                        linkElement.target = '_blank'; // Optional: opens the link in a new tab

                        // Append the title element to the <a> tag
                        linkElement.appendChild(titleElement);

                        // Append the <a> tag to the name div
                        nameDiv.appendChild(linkElement);
                    // }

                    // Create the releasedate div
                    const releasedateDiv = document.createElement('div');
                    releasedateDiv.classList.add('releasedate');

                    // Create the p element for formattedDate and set its text content
                    const formattedDateElement = document.createElement('p');
                    formattedDateElement.textContent = formattedDate;

                    // Append the formattedDate element to the releasedate div
                    releasedateDiv.appendChild(formattedDateElement);

                    // Append the name and releasedate divs to the main-info div
                    mainInfoDiv.appendChild(nameDiv);
                    mainInfoDiv.appendChild(releasedateDiv);

                    // Create the timer div
                    const timerDiv = document.createElement('div');
                    timerDiv.classList.add('timer');

                    // Create the h2 element for countdown and set its text content
                    const countdownElement = document.createElement('h2');
                    countdownElement.textContent = countdown;

                    // Append the countdown element to the timer div
                    timerDiv.appendChild(countdownElement);

                    // Create the watchnow button
                    const watchnowButton = document.createElement('button');
                    watchnowButton.classList.add('watchnow', 'disabled');
                    watchnowButton.disabled = true;

                    // Create the h2 element for watch now text
                    const watchNowTextElement = document.createElement('h2');
                    watchNowTextElement.textContent = 'Watch Now!';

                    // Create the SVG element for watch now icon
                    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svgElement.setAttribute('viewBox', '0 0 1920 1920');
                    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
                    svgElement.setAttribute('style', "margin-left:5px; width: 1em; height: 1em; vertical-align: middle; fill: currentcolor; --darkreader-inline-fill: currentcolor;")
                    svgElement.setAttribute('data-darkreader-inline-fill', "")

                    // Create the path element for the icon
                    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    pathElement.setAttribute('d', 'M1226.667 267c88.213 0 160 71.787 160 160v426.667H1280v-160H106.667v800C106.667 1523 130.56 1547 160 1547h1066.667c29.44 0 53.333-24 53.333-53.333v-213.334h106.667v213.334c0 88.213-71.787 160-160 160H160c-88.213 0-160-71.787-160-160V427c0-88.213 71.787-160 160-160Zm357.706 442.293 320 320c20.8 20.8 20.8 54.614 0 75.414l-320 320-75.413-75.414 228.907-228.906H906.613V1013.72h831.254L1508.96 784.707l75.413-75.414Zm-357.706-335.626H160c-29.44 0-53.333 24-53.333 53.333v160H1280V427c0-29.333-23.893-53.333-53.333-53.333Z');
                    pathElement.setAttribute('fill-rule', 'evenodd');

                    // Append the path element to the SVG element
                    svgElement.appendChild(pathElement);

                    // Append the SVG element to the watchnow button
                    watchNowTextElement.appendChild(svgElement);

                    // Append the watch now text to the watchnow button
                    watchnowButton.appendChild(watchNowTextElement);

                    // Create the remove button
                    const removeButton = document.createElement('button');
                    removeButton.classList.add('remove');
                    removeButton.textContent = 'x';

                    // Append the main-info, timer, watchnow button, and remove button to the item element
                    newItem.appendChild(mainInfoDiv);
                    newItem.appendChild(timerDiv);
                    newItem.appendChild(watchnowButton);

                    // adding links to watch now
                    if (title.includes("Unnamed Memory Season 2")) {
                        // Create a new <a> element
                        const linkElement = document.createElement("a");
                        linkElement.href = "https://hianime.to/watch/unnamed-memory-season-2-19440";
                        linkElement.target = "_blank";
                        watchnowButton.disabled = false
                        watchnowButton.classList.remove("disabled")
                    
                        // Append the <a> element to the newItem
                        newItem.appendChild(linkElement);
                    
                        // Append the button to the <a> element
                        linkElement.appendChild(watchnowButton);

                        newItem.appendChild(removeButton);
                    }

                    // else if (title.includes("As a Reincarnated Aristocrat, I'll Use My Appraisal Skill to Rise in the World Season 2")) {
                    //     // Create a new <a> element
                    //     const linkElement = document.createElement("a");
                    //     linkElement.href = "https://hianime.to/watch/as-a-reincarnated-aristocrat-ill-use-my-appraisal-skill-to-rise-in-the-world-season-2-19329";
                    //     linkElement.target = "_blank";
                    //     watchnowButton.disabled = false
                    //     watchnowButton.classList.remove("disabled")
                    
                    //     // Append the <a> element to the newItem
                    //     newItem.appendChild(linkElement);
                    
                    //     // Append the button to the <a> element
                    //     linkElement.appendChild(watchnowButton);

                    //     newItem.appendChild(removeButton);
                    // }

                    // else if (title.includes("Dan Da Dan")) {
                    //     // Create a new <a> element
                    //     const linkElement = document.createElement("a");
                    //     linkElement.href = "https://hianime.to/watch/dandadan-19319?ep=128656";
                    //     linkElement.target = "_blank";
                    //     watchnowButton.disabled = false
                    //     watchnowButton.classList.remove("disabled")
                    
                    //     // Append the <a> element to the newItem
                    //     newItem.appendChild(linkElement);
                    
                    //     // Append the button to the <a> element
                    //     linkElement.appendChild(watchnowButton);

                    //     newItem.appendChild(removeButton);
                    // }

                    // else if (title.includes("Re:ZERO")) {
                    //     // Create a new <a> element
                    //     const linkElement = document.createElement("a");
                    //     linkElement.href = "https://hianime.to/watch/rezero-starting-life-in-another-world-season-3-19301";
                    //     linkElement.target = "_blank";
                    //     watchnowButton.disabled = false
                    //     watchnowButton.classList.remove("disabled")
                    
                    //     // Append the <a> element to the newItem
                    //     newItem.appendChild(linkElement);
                    
                    //     // Append the button to the <a> element
                    //     linkElement.appendChild(watchnowButton);

                    //     newItem.appendChild(removeButton);
                    // }

                    else {
                        // Title processing into link
                        const baseLink = "https://hianime.to/search?keyword=";
                        const linkToAnime = baseLink + title.toLowerCase().replace(/ /g, "+") + "&status=2&sort=default";

                        watchnowButton.textContent = "Loading...";

                        // CORS bypass (for development only)
                        const proxyUrl = "https://api.allorigins.win/get?url=";

                        // Web scrape from the URL
                        fetch(proxyUrl + encodeURIComponent(linkToAnime))
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error("Network response was not ok");
                                }
                                return response.json();
                            })
                            .then(data => {
                                const parser = new DOMParser();
                                const htmlDocument = parser.parseFromString(data.contents, 'text/html');  // data.contents contains the fetched HTML

                                // Attempt to find the first 'a' tag with the class 'film-poster-ahref'
                                const linkElement = htmlDocument.querySelector('a.film-poster-ahref');

                                if (linkElement) {
                                    const linkToWatch = "https://hianime.to" + linkElement.getAttribute('href');  // Construct the full URL

                                    // Create a new <a> element
                                    const newLinkElement = document.createElement("a");
                                    newLinkElement.href = linkToWatch;
                                    newLinkElement.target = "_blank";
                                    watchnowButton.innerHTML = `
                                        <h2>Watch Now!<svg viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" style="margin-left:5px; width: 1em; height: 1em; vertical-align: middle; fill: currentcolor;">
                                            <path d="M1226.667 267c88.213 0 160 71.787 160 160v426.667H1280v-160H106.667v800C106.667 1523 130.56 1547 160 1547h1066.667c29.44 0 53.333-24 53.333-53.333v-213.334h106.667v213.334c0 88.213-71.787 160-160 160H160c-88.213 0-160-71.787-160-160V427c0-88.213 71.787-160 160-160Zm357.706 442.293 320 320c20.8 20.8 20.8 54.614 0 75.414l-320 320-75.413-75.414 228.907-228.906H906.613V1013.72h831.254L1508.96 784.707l75.413-75.414Zm-357.706-335.626H160c-29.44 0-53.333 24-53.333 53.333v160H1280V427c0-29.333-23.893-53.333-53.333-53.333Z" fill-rule="evenodd"></path>
                                        </svg></h2>
                                    `;
                                    watchnowButton.disabled = false;
                                    watchnowButton.classList.remove("disabled")

                                    // Append the <a> element to the newItem
                                    newItem.appendChild(newLinkElement);

                                    // Append the button to the <a> element
                                    newLinkElement.appendChild(watchnowButton);

                                    newItem.appendChild(removeButton);
                                } else {
                                    // const newLinkElement = document.createElement("a");
                                    // watchnowButton.innerHTML = `
                                    //     <h2>Watch Now!<svg viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" style="margin-left:5px; width: 1em; height: 1em; vertical-align: middle; fill: currentcolor;">
                                    //         <path d="M1226.667 267c88.213 0 160 71.787 160 160v426.667H1280v-160H106.667v800C106.667 1523 130.56 1547 160 1547h1066.667c29.44 0 53.333-24 53.333-53.333v-213.334h106.667v213.334c0 88.213-71.787 160-160 160H160c-88.213 0-160-71.787-160-160V427c0-88.213 71.787-160 160-160Zm357.706 442.293 320 320c20.8 20.8 20.8 54.614 0 75.414l-320 320-75.413-75.414 228.907-228.906H906.613V1013.72h831.254L1508.96 784.707l75.413-75.414Zm-357.706-335.626H160c-29.44 0-53.333 24-53.333 53.333v160H1280V427c0-29.333-23.893-53.333-53.333-53.333Z" fill-rule="evenodd"></path>
                                    //     </svg></h2>
                                    // `;

                                    // // Append the <a> element to the newItem
                                    // newItem.appendChild(newLinkElement);

                                    // // Append the button to the <a> element
                                    // newLinkElement.appendChild(watchnowButton);

                                    // newItem.appendChild(removeButton);
                                    console.error("Error: Could not find the 'a.film-poster-ahref' element in the HTML.");
                                }
                            })
                            .catch(error => {
                                console.error("Error fetching data from hianime:", error);
                                watchnowButton.textContent = "Error! Try again";

                                // Append the button to the newItem
                                newItem.appendChild(watchnowButton);
                                newItem.appendChild(removeButton);
                            });
                    }

                    // Append the item element to the .items container
                    const items = document.querySelector('.items');
                    items.appendChild(newItem);

                    if(differenceMs > 0) {
                        // Start countdown
                        startCountdown(timerDiv, nextBroadcastDay, title);
                    }
                    
                    else {
                        timerDiv.textContent = "0d 0h 0m 0s"
                    }

                    removeButton.addEventListener("click", function() {
                        var listItem = this.parentNode;
                        // Get the anime title from the displayed name (h2 text)
                        const currentAnimeName = this.parentNode.querySelector(".name").textContent.trim();

                        // Clean up animeList: remove any entries where title is null
                        animeList = animeList.filter(anime => anime.title !== null);

                        // Save cleaned-up list back to localStorage
                        saveAnimeSelection(animeList);
                        
                        // Find the index of the anime in the animeList based on the title
                        const index = animeList.findIndex(anime => anime.title.toLowerCase() === currentAnimeName.toLowerCase());

                        // If found, remove the anime from the list
                        if (index !== -1) {
                            animeList.splice(index, 1);
                            saveAnimeSelection(animeList);
                        }
                        
                        listItem.classList.add('fade-out');

                        setTimeout(() => {
                            listItem.remove();
                        }, 500);
                    })
                }

                else if (status == "Finished Airing") {
                    // Create a new item element
                    const newItem = document.createElement('div');
                    newItem.classList.add('item', `item${itemCount}`);

                    // Create the main-info div
                    const mainInfoDiv = document.createElement('div');
                    mainInfoDiv.classList.add('main-info');

                    // Create the name div
                    const nameDiv = document.createElement('div');
                    nameDiv.classList.add('name');

                    // Create an <a> element and set its href attribute using mal_id
                    const linkElementMAL = document.createElement('a');
                    linkElementMAL.href = `https://myanimelist.net/anime/${mal_id}`; // Replace 'mal_id' with your variable
                    linkElementMAL.target = '_blank'; // Optional: opens the link in a new tab

                    // Create the title element and set its text content
                    const titleElement = document.createElement('h2');
                    titleElement.classList.add('underlineEffect');
                    titleElement.textContent = title;

                    // Append the title element to the <a> tag
                    linkElementMAL.appendChild(titleElement);

                    // Append the <a> tag to the name div
                    nameDiv.appendChild(linkElementMAL);

                    // Create the releasedate div
                    const releasedateDiv = document.createElement('div');
                    releasedateDiv.classList.add('releasedate');

                    // Finished airing
                    const formattedDateElement = document.createElement('p');
                    formattedDateElement.textContent = status;

                    // Append the formattedDate element to the releasedate div
                    releasedateDiv.appendChild(formattedDateElement);

                    // Append the name and releasedate divs to the main-info div
                    mainInfoDiv.appendChild(nameDiv);
                    mainInfoDiv.appendChild(releasedateDiv);

                    // Create the timer div
                    const timerDiv = document.createElement('div');
                    timerDiv.classList.add('timer');

                    // Create the h2 element for countdown and set its text content
                    // const countdownElement = document.createElement('h2');
                    timerDiv.textContent = "0d 0h 0m 0s";

                    // // Append the countdown element to the timer div
                    // timerDiv.appendChild(countdownElement);

                    // create an a element empty because styling is so cooked, this is the easy way out fr
                    const linkElement = document.createElement('a');

                    // Create the watchnow button
                    const watchnowButton = document.createElement('button');
                    watchnowButton.classList.add('watchnow', 'disabled');
                    watchnowButton.disabled = true;

                    // Create the h2 element for watch now text
                    const watchNowTextElement = document.createElement('h2');
                    watchNowTextElement.textContent = 'Unavailable';

                    // Create the SVG element for watch now icon
                    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svgElement.setAttribute('viewBox', '0 0 1920 1920');
                    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
                    svgElement.setAttribute('style', "margin-left:5px; width: 1em; height: 1em; vertical-align: middle; fill: currentcolor; --darkreader-inline-fill: currentcolor;")
                    svgElement.setAttribute('data-darkreader-inline-fill', "")

                    // Create the path element for the icon
                    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    pathElement.setAttribute('d', 'M1226.667 267c88.213 0 160 71.787 160 160v426.667H1280v-160H106.667v800C106.667 1523 130.56 1547 160 1547h1066.667c29.44 0 53.333-24 53.333-53.333v-213.334h106.667v213.334c0 88.213-71.787 160-160 160H160c-88.213 0-160-71.787-160-160V427c0-88.213 71.787-160 160-160Zm357.706 442.293 320 320c20.8 20.8 20.8 54.614 0 75.414l-320 320-75.413-75.414 228.907-228.906H906.613V1013.72h831.254L1508.96 784.707l75.413-75.414Zm-357.706-335.626H160c-29.44 0-53.333 24-53.333 53.333v160H1280V427c0-29.333-23.893-53.333-53.333-53.333Z');
                    pathElement.setAttribute('fill-rule', 'evenodd');

                    // Append the path element to the SVG element
                    // svgElement.appendChild(pathElement);

                    // Append the SVG element to the watchnow button
                    // watchNowTextElement.appendChild(svgElement);

                    // Append the watch now text to the watchnow button
                    watchnowButton.appendChild(watchNowTextElement);

                    // append watchnowbutton to linkelement
                    linkElement.appendChild(watchnowButton);

                    // Create the remove button
                    const removeButton = document.createElement('button');
                    removeButton.classList.add('remove');
                    removeButton.textContent = 'x';

                    // Append the main-info, timer, watchnow button, and remove button to the item element
                    newItem.appendChild(mainInfoDiv);
                    newItem.appendChild(timerDiv);
                    newItem.appendChild(linkElement);
                    newItem.appendChild(removeButton);

                    // Append the item element to the .items container
                    const items = document.querySelector('.items');
                    items.appendChild(newItem);

                    removeButton.addEventListener("click", function() {
                        var listItem = this.parentNode;
                        // Get the anime title from the displayed name (h2 text)
                        const currentAnimeName = this.parentNode.querySelector(".name").textContent.trim();

                        // Clean up animeList: remove any entries where title is null
                        animeList = animeList.filter(anime => anime.title !== null);

                        // Save cleaned-up list back to localStorage
                        saveAnimeSelection(animeList);
                        
                        // Find the index of the anime in the animeList based on the title
                        const index = animeList.findIndex(anime => anime.title.toLowerCase() === currentAnimeName.toLowerCase());

                        // If found, remove the anime from the list
                        if (index !== -1) {
                            animeList.splice(index, 1);
                            saveAnimeSelection(animeList);
                        }
                        
                        listItem.classList.add('fade-out');

                        setTimeout(() => {
                            listItem.remove();
                        }, 500);
                    })
                }

                else if (status == "Not yet aired") {
                    // Create a new item element
                    console.log(data)
                    const newItem = document.createElement('div');
                    newItem.classList.add('item', `item${itemCount}`);

                    // Create the main-info div
                    const mainInfoDiv = document.createElement('div');
                    mainInfoDiv.classList.add('main-info');

                    // Create the name div
                    const nameDiv = document.createElement('div');
                    nameDiv.classList.add('name');

                    // Create an <a> element and set its href attribute using mal_id
                    const linkElementMAL = document.createElement('a');
                    linkElementMAL.href = `https://myanimelist.net/anime/${mal_id}`; // Replace 'mal_id' with your variable
                    linkElementMAL.target = '_blank'; // Optional: opens the link in a new tab

                    // Create the title element and set its text content
                    const titleElement = document.createElement('h2');
                    titleElement.classList.add('underlineEffect');
                    titleElement.textContent = title;

                    // Append the title element to the <a> tag
                    linkElementMAL.appendChild(titleElement);

                    // Append the <a> tag to the name div
                    nameDiv.appendChild(linkElementMAL);

                    // Create the releasedate div
                    const releasedateDiv = document.createElement('div');
                    releasedateDiv.classList.add('releasedate');

                    // Finished airing
                    const formattedDateElement = document.createElement('p');
                    formattedDateElement.textContent = "To be announced";

                    // Append the formattedDate element to the releasedate div
                    releasedateDiv.appendChild(formattedDateElement);

                    // Append the name and releasedate divs to the main-info div
                    mainInfoDiv.appendChild(nameDiv);
                    mainInfoDiv.appendChild(releasedateDiv);

                    // Create the timer div
                    const timerDiv = document.createElement('div');
                    timerDiv.classList.add('timer');

                    // Create the h2 element for countdown and set its text content
                    // const countdownElement = document.createElement('h2');
                    timerDiv.textContent = "0d 0h 0m 0s";

                    // // Append the countdown element to the timer div
                    // timerDiv.appendChild(countdownElement);

                    // create an a element empty because styling is so cooked, this is the easy way out fr
                    const linkElement = document.createElement('a');

                    // Create the watchnow button
                    const watchnowButton = document.createElement('button');
                    watchnowButton.classList.add('watchnow', 'disabled');
                    watchnowButton.disabled = true;

                    // Create the h2 element for watch now text
                    const watchNowTextElement = document.createElement('h2');
                    watchNowTextElement.textContent = 'Unavailable';

                    // Create the SVG element for watch now icon
                    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svgElement.setAttribute('viewBox', '0 0 1920 1920');
                    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
                    svgElement.setAttribute('style', "margin-left:5px; width: 1em; height: 1em; vertical-align: middle; fill: currentcolor; --darkreader-inline-fill: currentcolor;")
                    svgElement.setAttribute('data-darkreader-inline-fill', "")

                    // Create the path element for the icon
                    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    pathElement.setAttribute('d', 'M1226.667 267c88.213 0 160 71.787 160 160v426.667H1280v-160H106.667v800C106.667 1523 130.56 1547 160 1547h1066.667c29.44 0 53.333-24 53.333-53.333v-213.334h106.667v213.334c0 88.213-71.787 160-160 160H160c-88.213 0-160-71.787-160-160V427c0-88.213 71.787-160 160-160Zm357.706 442.293 320 320c20.8 20.8 20.8 54.614 0 75.414l-320 320-75.413-75.414 228.907-228.906H906.613V1013.72h831.254L1508.96 784.707l75.413-75.414Zm-357.706-335.626H160c-29.44 0-53.333 24-53.333 53.333v160H1280V427c0-29.333-23.893-53.333-53.333-53.333Z');
                    pathElement.setAttribute('fill-rule', 'evenodd');

                    // Append the path element to the SVG element
                    // svgElement.appendChild(pathElement);

                    // Append the SVG element to the watchnow button
                    // watchNowTextElement.appendChild(svgElement);

                    // Append the watch now text to the watchnow button
                    watchnowButton.appendChild(watchNowTextElement);

                    // append watchnowbutton to linkelement
                    linkElement.appendChild(watchnowButton);

                    // Create the remove button
                    const removeButton = document.createElement('button');
                    removeButton.classList.add('remove');
                    removeButton.textContent = 'x';

                    // Append the main-info, timer, watchnow button, and remove button to the item element
                    newItem.appendChild(mainInfoDiv);
                    newItem.appendChild(timerDiv);
                    newItem.appendChild(linkElement);
                    newItem.appendChild(removeButton);

                    // Append the item element to the .items container
                    const items = document.querySelector('.items');
                    items.appendChild(newItem);

                    removeButton.addEventListener("click", function() {
                        var listItem = this.parentNode;
                        // Get the anime title from the displayed name (h2 text)
                        const currentAnimeName = this.parentNode.querySelector(".name").textContent.trim();

                        // Clean up animeList: remove any entries where title is null
                        animeList = animeList.filter(anime => anime.title !== null);

                        // Save cleaned-up list back to localStorage
                        saveAnimeSelection(animeList);
                        
                        // Find the index of the anime in the animeList based on the title
                        const index = animeList.findIndex(anime => anime.title.toLowerCase() === currentAnimeName.toLowerCase());

                        // If found, remove the anime from the list
                        if (index !== -1) {
                            animeList.splice(index, 1);
                            saveAnimeSelection(animeList);
                        }
                        
                        listItem.classList.add('fade-out');

                        setTimeout(() => {
                            listItem.remove();
                        }, 500);
                    })
                }
            } 
            else {
                console.log(`No anime found named ${animeName}.`);

                document.querySelector(".addAnime").innerHTML = "x";
                document.querySelector(".addAnime").classList.add("unableToAdd");

                setTimeout(() => {
                    document.querySelector(".addAnime").innerHTML = "+";
                    document.querySelector(".addAnime").classList.remove("unableToAdd");
                }, 2000);
            }
        })
        .catch(error => {
            console.error("Error fetching anime data:", error);
        });
    }
}

function startCountdown(timerElement, targetDate, title) {
    const now = new Date();
    const nowInLocalTimezone = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const differenceMs = targetDate - nowInLocalTimezone;

    const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((differenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((differenceMs % (1000 * 60)) / 1000);

    timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const countdownInterval = setInterval(() => {
        const now = new Date();
        const nowInLocalTimezone = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        const differenceMs = targetDate - nowInLocalTimezone;

        const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((differenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((differenceMs % (1000 * 60)) / 1000);

        timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

// aryan's selection
var addSelection = document.querySelector(".addMySelection")

addSelection.addEventListener("click", function() {
    const inputValues = ["unnamed memory season 2"];
    inputValues.forEach((value, index) => {
        setTimeout(() => {
            input.value = value;
            addBtn.click();
        }, (index + 1) * 1000);
    });

    setTimeout(() => {
        input.value = ""; // Clear the input field
    }, (inputValues.length + 1) * 1000);
});