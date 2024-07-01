function initializeUnited(united) {
    // Set width and height of svg_united
    //var width = 800;
    //var height = 556;
    var width = 1150;
    var height = 800;
    var height_rect = 200;
    var aspect = width / height;

    // The total sum of deaths reported by united against refugee deaths
    const totalSum = d3.sum(united, d => d.num_death);

    // Map and projection
    var projection = d3.geoMercator()
        .center([4, 35]) // GPS of location to zoom on
        .scale(500) // This is like the zoom
        .translate([width / 2, height / 2]);

    // The svg_united
    var svg_group = d3.select("#united-viz")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMid")
        .call(responsivefy);

    var svg_map = svg_group.append("g")
        .attr("id", "map-group");

    var svg_united = svg_group.append("g")
        .attr("id", "points-group");


    var timelineGroup = svg_group.append("g")
        .attr("id", "timeline-group")
        .attr("transform", `translate(0, ${635})`);

    timelineGroup.append("rect")
        .attr("width", width + 20)
        .attr("height", height_rect)
        .style("fill", "#3f3f3f")
        .style("stroke", "black")
        .style("stroke-width", "2.5px");

    var rad = d3.scaleSqrt().range([1.8, 2.8]);

    // Define the function to zoom
    function zoomed(event, data) {
        const { transform } = event;
        projection.scale(transform.k * 800).translate([transform.x, transform.y]);
        svg_map.selectAll("path").attr("d", d3.geoPath().projection(projection));
        svg_united.selectAll(".circle")
            .attr("cx", d => projection([d.long, d.lat])[0])
            .attr("cy", d => projection([d.long, d.lat])[1])
            .on("mouseover", mouseover) // Necessary?
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
    }

    function responsivefy(svg) {
        container = d3.select(svg.node().parentNode);
        svg.call(resize);
        d3.select(window).on("resize." + container.style("id"), resize);
        function resize() {
            let containerWidth = parseInt(container.style("width"));
            let svgHeight = parseInt(svg.style("height"));
            let svgWidth = parseInt(svg.style("width"));
            svg.attr("width", containerWidth);
            svg.attr("height", Math.round(containerWidth * svgHeight / svgWidth));
        }
    }
    // Define mouseover, mousemove, and mouseleave function
    function mouseover(event, d) {
        d3.select('.hover-info').style("opacity", 1);
    }

    function mousemove(event, d) {
        var date = new Date(d.date_sorted);

        // Get the day, month, and year separately
        var day = date.getDate();
        var month = date.getMonth() + 1; // Months are zero-indexed, so we add 1
        var year = date.getFullYear();

        // Format the date string as DD.MM.YYYY
        var formattedDate = `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year}`;

        var infoContent = `<h2 style="font-family: Montserrat, sans-serif;">${d.name}</h2>`;
        infoContent += `<p style="font-family: Montserrat, sans-serif;"><span style="font-weight: bold;">Number of deaths:</span> ${d.num_death}</p>`;
        infoContent += `<p style="font-family: Montserrat, sans-serif;"><span style="font-weight: bold;">Date found:</span> ${formattedDate}</p>`;
        infoContent += `<p style="font-family: Montserrat, sans-serif;"><span style="font-weight: bold;">Cause of death:</span> ${d.cause_death}</p>`;
        updateInfoPanel(infoContent);
    }

    function mouseleave(event, d) {
        d3.select('.hover-info').style("opacity", 0);
    }

    // Update the Info Panel on the website
    function updateInfoPanel(content) {
        var infoPanel = document.querySelector('.hover-info');
        infoPanel.innerHTML = content;
        updateImage();
    }

    // Array of image paths or URLs
    var imagePaths = [
        './images/opeep/img_1.png',
        './images/opeep/img_2.png',
        './images/opeep/img_3.png',
        './images/opeep/img_4.png',
        './images/opeep/img_5.png',
        './images/opeep/img_6.png',
        './images/opeep/img_7.png',
        './images/opeep/img_8.png',
        './images/opeep/img_9.png',
        './images/opeep/img_10.png',
        './images/opeep/img_11.png',
        './images/opeep/img_12.png',
        './images/opeep/img_13.png',
        // Add paths for all your images here
    ];

    // Index to keep track of the current image
    var currentImageIndex = -1;

    // Function to update the image
    function updateImage() {
        // Get the img element
        var imgElement = document.getElementById('person-image');
        // Update the src attribute with the next image path
        imgElement.src = imagePaths[currentImageIndex];
        // Increment the current image index or reset to 0 if it exceeds the array length
        currentImageIndex = (currentImageIndex + 1) % imagePaths.length;
    }
    document.addEventListener('DOMContentLoaded', updateImage);

    // Calculate the sum of people dying per month
    function sumNrPerMonth(data) {
        var sums = {};

        data.forEach(entry => {
            var date = parseDate(entry.date_sorted);
            var month = date.getMonth() + 1; // JavaScript months are zero-based, so add 1
            var year = date.getFullYear();

            if (!sums[year]) {
                sums[year] = {};
            }
            if (!sums[year][month]) {
                sums[year][month] = 0;
            }

            sums[year][month] += parseInt(entry.num_death);
        });

        return sums;
    }

    // Get the right Dateformat
    function parseDate(dateString) {
        var [day, month, year] = dateString.split('_');
        var parsedYear = parseInt(year) < 93 ? '20' + year : '19' + year;
        return new Date(parsedYear, month - 1, day);
    }

    // Update the Points on the map according to the selected time period
    function updateMapPoints(data) {
        const circles = svg_united.selectAll("circle").data(data, d => d.long + d.lat + d.name + d.num_death);

        // Calculate the partial sum of deaths in order to make the comparison with the total number
        var partialSum = d3.sum(data, d => d.num_death);

        // Remove the text that was there before, in order to be able to create the new text
        d3.select("#partialSumText").remove();
        d3.select("#totalSumText").remove();

        // Add the new text for partial sum
        var partialSumText = svg_united.append("text")
            .attr("id", "partialSumText")
            .attr("x", 1160 - 30)
            .attr("y", 40)
            .attr("text-anchor", "end")
            .attr("class", "text_sum")
            .text("Partial Number of Deaths : " + partialSum);

        // Add the new text for the total sum
        var totalSumText = svg_united.append("text")
            .attr("id", "totalSumText")
            .attr("x", 1160 - 30)
            .attr("y", 20)
            .attr("text-anchor", "end")
            .attr("class", "text_sum")
            .text("Total Number of Deaths : " + totalSum);

        // Update existing points
        circles
            .attr("cx", d => projection([d.long, d.lat])[0])
            .attr("cy", d => projection([d.long, d.lat])[1])
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Enter new points
        circles.enter().append("circle")
            .attr("cx", d => projection([d.long, d.lat])[0])
            .attr("cy", d => projection([d.long, d.lat])[1])
            .attr("r", d => rad(d.num_death))
            .attr("class", "circle")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Remove exiting points
        circles.exit().remove();

        // Initialize zoom element
        var zoom = d3.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", function (event) { zoomed(event, data); });

        //svg_united.call(zoom);
        svg_map.call(zoom);

        // Create a string with the two sums in it
        var sum_deaths = [totalSum, partialSum];

        // Calculate the radius of the circle
        var R = sum_deaths.map(function (d) {
            return Math.sqrt(d / Math.max(...sum_deaths));
        });

        // Append the circles
        var propcircle = svg_united.append("svg")
            .attr("id", "propcircle")
            .append("g")
            .attr("transform", "translate(" + 1050 + "," + 50 + ")");

        // Calculate the max. radius
        var maxRadius = Math.max(...R);

        // Position the second circle
        var lowestY = 40 + maxRadius * 40;

        // Project the second circle
        var circles2 = propcircle.selectAll("circle")
            .data(R)
            .enter()
            .append("circle")
            .attr("cx", 40)
            .attr("cy", function (d, i) {
                return lowestY - d * 40;
            })
            .attr("r", function (d) { return d * 40; })
            .attr("fill", function (d, i) {
                if (i === 0) {
                    return "#3e0000";
                } else {
                    return "#595959";
                }
            })
       //     .style("stroke", "black")
            .style("opacity", .8);

        propcircle.attr("viewBox", "0 0 200 " + R.reduce((acc, cur) => acc + cur * 2 * 100, 0));
    }

    // The function for choosing the different time periods
    function brushCallback(event, data, xScale) {
        var selection = event.selection;

        if (!selection) {
            updateMapPoints([]);
        } else {
            var newDateRange = selection.map(xScale.invert);
            var filteredData = data.filter(function (d) {
                return d.date_sorted >= newDateRange[0] && d.date_sorted <= newDateRange[1];
            });
            console.log(filteredData);
            updateMapPoints(filteredData);
        }
    }

    // Calculate the sum of number of people that died in this month
    function sumNrPerMonth(data) {
        var sums = {};

        data.forEach(entry => {
            var date = parseDate(entry.date_sorted);
            var month = date.getMonth() + 1;
            var year = date.getFullYear();

            var formattedMonth = month < 10 ? '0' + month : month;
            var formattedYear = year;

            var key = `${formattedMonth}.${formattedYear}`;

            if (!sums[key]) {
                sums[key] = 0;
            }

            sums[key] += parseInt(entry.num_death);
        });

        return sums;
    }

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function (data) {
        console.log("World GeoJSON Data:", data);


        // Append the sea (a rectangle covering the entire SVG)
        svg_map.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#3f3f3f"); // Sea color with opacity

        // Append the land features on top of the sea
        svg_map.append("g")
            .selectAll("path")
            .data(data.features)
            .join("path")
            .attr("fill", "#a0a0a0") // Land color
            .attr("d", d3.geoPath().projection(projection))
            .style("stroke", "black")
            .style("opacity", 0.5);
    });


    // Function to create the timeline
    function Timeline(data) {
        var margin = { top: 10, right: 20, bottom: 470, left: 60 },
            width = 1160 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;
        aspect = width / height;

        // Calculate the sum per month 
        var sumPerMonth = sumNrPerMonth(data);

        // Put into date format
        data.forEach(function (d) {
            d.date_sorted = parseDate(d.date_sorted);
        });

        var dates = data.map(d => d.date_sorted);
        var maxDate = d3.max(dates);

        // Create the line Data
        var lineData = Object.keys(sumPerMonth).map(function (key) {
            return { date: key, value: sumPerMonth[key] };
        });

        // Parse date strings into Date objects
        lineData.forEach(function (d) {
            var parts = d.date.split('.');
            d.date = new Date(parseInt(parts[1]), parseInt(parts[0]) - 1);
        });

        // Define x variable
        var x = d3.scaleTime()
            .domain(d3.extent(lineData, function (d) { return d.date; }))
            .rangeRound([0, width]);

        // Define y variable
        var y = d3.scaleLinear()
            .domain([0, d3.max(lineData, function (d) { return d.value; })])
            .range([height, 0]);

        // Define line
        var line = d3.line()
            .x(function (d) { return x(d.date); })
            .y(function (d) { return y(d.value); });

        // Add element of timeline
        var timeline = timelineGroup.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Append line to timeline
        timeline.append("path")
            .datum(lineData)
            .attr("class", "line_tl")
            .attr("d", line);

        // Generate ticks for every 5 years
        var years = d3.timeYear.every(5);

        // Append the line on the bottom, define the ticks
        timeline.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            //.attr("height", height)
            .call(d3.axisBottom(x)
                .ticks(years)
                .tickFormat(d3.timeFormat("%Y"))
                .tickPadding(6))
            .selectAll("text")
            .style("font-family", "Montserrat")
            .style("fill", "#000000");

        timeline.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y)
                .ticks(4))


        timeline.selectAll(".axis--y text")
            .style("font-family", "Montserrat")
            .style("fill", "#000000");

        // Initialize brush element
        var brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("end", function (event) {
                brushCallback(event, data, x);
            });

        // Calculate default start and end dates
        var endDate = maxDate;
        var startDate = new Date(endDate.getFullYear() - 5, endDate.getMonth(), endDate.getDate()); // 5 years ago

        var initialSelection = [x(startDate), x(endDate)];

        // Append the brush element to the timeline
        timeline.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, initialSelection);

        // Customize the brush selection appearance
        d3.select(".brush .selection")
            .attr("fill", "#a0a0a0")        // Set the fill color of the brush selection
            .attr("fill-opacity", 0.35)      // Set the opacity of the fill color
            .attr("stroke", "#000000")        // Set the stroke color of the brush selection
            .attr("stroke-width", 1);       // Set the stroke width of the brush selection

    }


    Timeline(united);

}

// load the data
d3.json("data/united_data.json").then(function (uniteddata) {
    initializeUnited(uniteddata);
});

initializeUnited();
