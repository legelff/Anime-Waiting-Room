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

const animeList = []

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

function saveAnimeSelection(animeNames) {
    localStorage.setItem('selectedAnimes', JSON.stringify(animeNames));
}

function getSavedAnimeSelection() {
    const savedAnimes = localStorage.getItem('selectedAnimes');
    return savedAnimes ? JSON.parse(savedAnimes) : [];
}

function addItem() {
    const animeName = input.value.trim();
    
    // Avoid adding duplicate anime names
    if (!animeList.some(anime => anime.input.toLowerCase() === animeName.toLowerCase())) {
        animeList.push({ 
            input: animeName, 
            title: "" // Placeholder for the API title
        }); // Add user input with empty title placeholder

        saveAnimeSelection(animeList); // Save updated list to localStorage

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

                // Update animeList with the fetched title
                const animeIndex = animeList.findIndex(anime => anime.input.toLowerCase() === animeName.toLowerCase());
                if (animeIndex !== -1) {
                    animeList[animeIndex].title = title;
                    saveAnimeSelection(animeList); // Save updated list to localStorage
                }

                broadcastDay = data.data[0].broadcast.day
                broadcastTime = data.data[0].broadcast.time
                broadcastTimezone = data.data[0].broadcast.timezone
                rawData = data
                status = data.data[0].status

                // check status
                if (status == "Currently Airing") {
                    // Get the current date and time in Tokyo's timezone
                    const nowInTokyo = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
                    const nowInBrussels = new Date().toLocaleString('en-US', { timeZone: 'Europe/Brussels' })

                    // Create a new date object for now
                    const nowDate = new Date(nowInTokyo);

                    // Find the next Monday's date
                    // let nextMonday = new Date(nowDate);
                    // nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
                    // console.log("nextMonday: " + nextMonday)

                    // Function to find the next occurrence of the specified day
                    function getNextDayOfWeek(date, dayOfWeek) {
                        const nextDay = new Date(date);
                        // console.log("next day before: " + nextDay)
                        nextDay.setDate(date.getDate() + (dayOfWeek + 7 - date.getDay()) % 7);
                        // console.log("next day after: " + nextDay)
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


                    // console.log("next broadcast day: "+ nextBroadcastDay)
                    // Set the broadcast time
                    const [broadcastHour, broadcastMinute] = broadcastTime.split(':');
                    nextBroadcastDay.setHours(broadcastHour);
                    nextBroadcastDay.setMinutes(broadcastMinute);
                    nextBroadcastDay.setSeconds(0);

                    isoNextBroadcastDay = nextBroadcastDay.toISOString()

                    // JST time string
                    const jstTime = isoNextBroadcastDay;

                    // Create a Date object from the JST time string
                    const jstDate = new Date(jstTime);

                    // // Convert to CEST timezone (JST is 7 hours ahead of CEST)
                    // const cestTime = new Date(jstDate.getTime() - (7 * 60 * 60 * 1000));

                    // // Format the date in CEST timezone
                    // const formattedDate = cestTime.toLocaleString('en-US', { timeZone: 'Europe/Paris' }) + " CEST";

                    // Convert to GMT timezone (JST is 9 hours ahead of GMT)
                    const gmtTime = new Date(jstDate.getTime() - (7 * 60 * 60 * 1000));

                    // Format the date in GMT timezone
                    const formattedDate = gmtTime.toLocaleString('en-US', { timeZone: 'GMT' }) + " GMT";

                    // Calculate the difference between now and nextMonday in milliseconds
                    const differenceMs = nextBroadcastDay - nowDate;
                    // console.log(nextBroadcastDay)
                    // console.log(nowDate)

                    // Convert milliseconds to seconds
                    const differenceSeconds = Math.floor(differenceMs / 1000);

                    // Calculate days, hours, minutes, and seconds
                    days = Math.floor(differenceSeconds / (60 * 60 * 24));
                    hours = Math.floor((differenceSeconds % (60 * 60 * 24)) / (60 * 60));
                    minutes = Math.floor((differenceSeconds % (60 * 60)) / 60);
                    seconds = differenceSeconds % 60;

                    countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`

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
                        // Create the title element and set its text content
                        const titleElement = document.createElement('h2');
                        titleElement.textContent = title;

                        // Append the title element to the name div
                        nameDiv.appendChild(titleElement);
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
                    if (title.includes("Blue Lock Season 2")) {
                        // Create a new <a> element
                        const linkElement = document.createElement("a");
                        linkElement.href = "https://hianime.to/watch/blue-lock-season-2-19318";
                        linkElement.target = "_blank";
                        watchnowButton.disabled = false
                        watchnowButton.classList.remove("disabled")
                    
                        // Append the <a> element to the newItem
                        newItem.appendChild(linkElement);
                    
                        // Append the button to the <a> element
                        linkElement.appendChild(watchnowButton);

                        newItem.appendChild(removeButton);
                    }

                    else if (title.includes("As a Reincarnated Aristocrat, I'll Use My Appraisal Skill to Rise in the World Season 2")) {
                        // Create a new <a> element
                        const linkElement = document.createElement("a");
                        linkElement.href = "https://hianime.to/watch/as-a-reincarnated-aristocrat-ill-use-my-appraisal-skill-to-rise-in-the-world-season-2-19329";
                        linkElement.target = "_blank";
                        watchnowButton.disabled = false
                        watchnowButton.classList.remove("disabled")
                    
                        // Append the <a> element to the newItem
                        newItem.appendChild(linkElement);
                    
                        // Append the button to the <a> element
                        linkElement.appendChild(watchnowButton);

                        newItem.appendChild(removeButton);
                    }

                    else if (title.includes("Dan Da Dan")) {
                        // Create a new <a> element
                        const linkElement = document.createElement("a");
                        linkElement.href = "https://hianime.to/watch/dandadan-19319?ep=128656";
                        linkElement.target = "_blank";
                        watchnowButton.disabled = false
                        watchnowButton.classList.remove("disabled")
                    
                        // Append the <a> element to the newItem
                        newItem.appendChild(linkElement);
                    
                        // Append the button to the <a> element
                        linkElement.appendChild(watchnowButton);

                        newItem.appendChild(removeButton);
                    }

                    else if (title.includes("Re:ZERO")) {
                        // Create a new <a> element
                        const linkElement = document.createElement("a");
                        linkElement.href = "https://hianime.to/watch/rezero-starting-life-in-another-world-season-3-19301";
                        linkElement.target = "_blank";
                        watchnowButton.disabled = false
                        watchnowButton.classList.remove("disabled")
                    
                        // Append the <a> element to the newItem
                        newItem.appendChild(linkElement);
                    
                        // Append the button to the <a> element
                        linkElement.appendChild(watchnowButton);

                        newItem.appendChild(removeButton);
                    }

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

                    // Create the title element and set its text content
                    const titleElement = document.createElement('h2');
                    titleElement.textContent = title;

                    // Append the title element to the name div
                    nameDiv.appendChild(titleElement);

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
            } else {
                console.log("No anime found with the provided query parameters.");
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

var addSelection = document.querySelector(".addMySelection")

addSelection.addEventListener("click", function() {
    const inputValues = ["Blue Lock 2nd Season", "As a Reincarnated Aristocrat, I'll Use My Appraisal Skill to Rise in the World Season 2", "dandadan", "re:zero"];
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

function scrapeData(title) {
    const formattedTitle = title;

    // Webscrape from the URL
    fetch(`https://gogoanime3.co/search.html?keyword=${formattedTitle}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.text();
        })
        .then(data => {
            // Parse the HTML response and extract the desired information
            const parser = new DOMParser();
            const htmlDocument = parser.parseFromString(data, 'text/html');
            // Find the first <ul> tag with class "items"
            const itemsUl = htmlDocument.querySelector('ul.items');
            if (itemsUl) {
                // Find the first <a> tag within the <ul> tag
                const firstATag = itemsUl.querySelector('a');
                if (firstATag) {
                    // Get the href attribute of the first <a> tag
                    const link = "https://gogoanime3.co" + firstATag.getAttribute('href');
                    // console.log(link);

                    fetch(link)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error("Network response was not ok");
                            }
                            return response.text();
                        })
                        .then(data => {
                            const parser = new DOMParser();
                            const htmlDocument = parser.parseFromString(data, 'text/html');
                            const episodeDiv = htmlDocument.querySelector("div.anime_video_body")
                            const episodeRange = episodeDiv.querySelector("a")
                            const lastEpisode = episodeRange.getAttribute("ep_end")
                            // console.log(parseInt(lastEpisode) +1)
                            const animeNameLink = link.split("/")[4]
                            const epLink = "https://gogoanime3.co/" + animeNameLink + `-episode-${parseInt(lastEpisode)}`
                            // console.log(epLink)
                            
                            const intervalId = setInterval(function() {
                                fetch(epLink)
                                    .then(response => {
                                        if (response.status !== 404) {
                                            clearInterval(intervalId);
                                            const button = document.querySelector(".watchnow");
                                            button.disabled = false
                                            if (button) {
                                                const link = document.createElement('a');
                                                link.href = epLink;
                                                link.target = "_blank";
                                                link.appendChild(button.cloneNode(true));
                                                button.parentNode.replaceChild(link, button);
                                            }
                                        }
                                        if (!response.ok && response.status !== 404) {
                                            throw new Error("Network response was not ok");
                                        }
                                        return response.text();
                                    })
                                    .then(data => {
                                        // const parser = new DOMParser();
                                        // const htmlDocument = parser.parseFromString(data, 'text/html');
                                        // const entryTitle = htmlDocument.querySelector('h1.entry-title');
                                        // if (entryTitle) {
                                        //     clearInterval(intervalId);
                                        //     const button = document.querySelector(".button");
                                        //     if (button) {
                                        //         button.disabled = false;
                                        //     }
                                        // }
                                    })
                                    .catch(error => {
                                        console.error("Error fetching data from gogoanime:", error);
                                    });
                            }, 10000);
                        })
                        .catch(error => {
                            console.error("Error fetching data from gogoanime:", error);
                        })
                } else {
                    console.log("No <a> tag found inside the <ul> tag with class 'items'.");
                }
            } else {
                console.log("No <ul> tag found with class 'items'.");
            }
        })
        .catch(error => {
            console.error("Error fetching data from gogoanime:", error);
        });
}