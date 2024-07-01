const params = {
    svgElementId: "#swiss-map-container",
    cantonColors: {
        "Zurich": "#f07d00",
        "Bern": "#0069b3",
        "Lucerne": "#b80d7f",
        "Uri": "#ffcc01",
        "Schwyz": "#e40613",
        // Add other cantons here...
    },
    radiusFactor: 50,
};

// Adapt visualization to container width.
function responsivefy(svg) {
    const container = d3.select(svg.node().parentNode);
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

class chartSwitzerland {
    constructor(params) {
        this.width = 945;
        this.height = 480;
        this.svg = d3.select(params.svgElementId)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", "0 0 " + this.width + " " + this.height)
            .attr("preserveAspectRatio", "xMinYMid")
            .call(responsivefy);

        const projection = d3.geoMercator()
            .scale(4000)
            .center([8.2275, 46.8182]) // Centered on Switzerland
            .translate([this.width / 2, this.height / 2]);

        this.tooltip = d3.select(params.svgElementId)
            .append("div")
            .attr("class", "tooltip");

        Promise.all([
            d3.json("path/to/switzerland-geojson.json"), // Replace with actual path to GeoJSON file
            d3.json("data/CH_Ct.json") // Load the data from the JSON file
        ]).then((data) => {
            const switzerland = data[0];
            const statistics = data[1];
            
            const statisticsMap = new Map();
            statistics.forEach(stat => {
                statisticsMap.set(stat.Canton, stat);
            });

            this.map_container = this.svg.append('g');
            this.map_contour = this.svg.append('g');

            this.map_container.append("g")
                .selectAll("path")
                .data(switzerland.features)
                .join("path")
                .attr("fill", "#dcdcdc")
                .attr("d", d3.geoPath().projection(projection))
                .attr("class", function (d, i) { return "map_canton map_canton_index_" + String(i) })
                .style("stroke", "white");

            this.map_contour.append("path")
                .datum({ type: "Sphere" })
                .attr("d", d3.geoPath().projection(projection))
                .attr("id", "contour")
                .style("fill", "none")
                .style("stroke", "#ccc")
                .style("stroke-width", 2);

            let indexHighlightedCanton = -1;
            const dist = function (p1, p2) { return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2); }

            this.svg.on("mouseover", () => { this.tooltip.style("opacity", 1) });
            this.svg.on("mousemove", (event) => {
                let svgBoundingRect = this.svg.node().getBoundingClientRect();
                let svgScalingFactor = this.width / svgBoundingRect.width;
                let relativeMousePos = [svgScalingFactor * (event.x - svgBoundingRect.left), svgScalingFactor * (event.y - svgBoundingRect.top)];
                let centroidsCartesian = switzerland.features.map(d => projection(d3.geoCentroid(d)));
                let indexClosestCanton = 0;
                for (let i = 0; i < centroidsCartesian.length; i++) {
                    if (dist(relativeMousePos, centroidsCartesian[i]) < dist(relativeMousePos, centroidsCartesian[indexClosestCanton])) {
                        indexClosestCanton = i;
                    }
                }

                if (indexHighlightedCanton != indexClosestCanton) {
                    d3.select(".map_canton_index_" + String(indexHighlightedCanton))
                        .transition()
                        .duration(200)
                        .style("stroke", "white")
                        .style("stroke-width", "0.5px");

                    indexHighlightedCanton = indexClosestCanton;
                    let nodeHighlightedCanton = d3.select(".map_canton_index_" + String(indexClosestCanton));
                    nodeHighlightedCanton
                        .raise()
                        .transition()
                        .duration(200)
                        .style("stroke", "black")
                        .style("stroke-width", "1px");

                    const cantonName = switzerland.features[indexHighlightedCanton].properties.name;
                    const stat = statisticsMap.get(cantonName) || {};
                    const tooltipContent = `
                        <b>${cantonName}</b><br>
                        Total persons: ${stat.Total_pers_dans_processus || 'N/A'}<br>
                        Persons in procedure: ${stat["Pers_dans_procedure-total"] || 'N/A'}<br>
                        Admitted provisionally: ${stat["Pers_admis_provis-total"] || 'N/A'}
                    `;
                    this.tooltip.html(tooltipContent);
                }

                this.tooltip
                    .style("left", (event.x - parseInt(d3.select(".tooltip").style("width")) / 2) + "px")
                    .style("top", (event.y + 30) + "px");
            });

            this.svg.on("mouseleave", () => {
                this.tooltip.style("opacity", 0);
                d3.select(".map_canton_index_" + String(indexHighlightedCanton))
                    .transition()
                    .duration(200)
                    .style("stroke", "white")
                    .style("stroke-width", "0.5px");
                indexHighlightedCanton = -1;
            });
        });
    }
}

function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        action();
    }
}

whenDocumentLoaded(() => {
    new chartSwitzerland(params);
});
