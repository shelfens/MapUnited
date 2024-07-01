const paramsUnited = {
    svgElementId: "#united-viz",
}


class chartUnited {
    constructor(params) {
        console.log(params)
        // --------------------------------------
        // The width and height here give rather the ratio
        // and not the final width and height, they are
        // resized using the resize function to the container
        this.width = 945;
        this.height = 480;
        // Build svg
        this.svg = d3.select(params.svgElementId)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", "0 0 " + this.width + " " + this.height)
            .attr("perserveAspectRatio", "xMinYMid") // Or xMidYMin?
        // Adapt the visualization to container width and make responsive
        //.call(responsivefy);
        // --------------------------------------
        // Define the projection type
        const projection = d3.geoMercator() // Altertives: geoEckert4(), geoRobinson()
            .scale(500) // This is like the zoom
            .translate([this.width / 2, this.height / 2])
            .center([4, 35]); // GPS of location to zoom on

        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then((data) => {
            console.log(data)
            // Define map container
            this.map_container = this.svg.append('g');
            // Add countries
            this.map_container.append("g")
                .selectAll("path")
                .data(data.features)
                .join("path")
                .attr("fill", "#74a892") // Change color of the Map
                .style("opacity", 1) // Change opacity of the country fill
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "black") // Linecolor
                .style("opacity", .55) // Opacity of map, total
        })

        
    }
}



// --------------------------------------
// Ensures that visualization loads faster, before images and CSS finished
// Code from 2024 EPFL COM-480 course, exercise session 8 on maps. 
// Code by Kirell Benzi, Krzysztof Lis, Volodymyr Miz
function whenDocumentLoaded(action) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", action);
    } else {
        // `DOMContentLoaded` already fired
        action();
    }
}
whenDocumentLoaded(() => {
    plot_object = new chartUnited(paramsUnited); // console-inspectable global plot_object
});