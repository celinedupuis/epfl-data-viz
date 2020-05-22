let isPhysicalResourceMode = false;
let isBubbleRadiusUniform = true;
let isSubsetSelected = false;
let clickOnRed = false;

class BubbleChart {
    constructor(map_data, svg_element_id) {
        this.svg = d3.select('#' + svg_element_id);

        // Scale to svg coordinate
        const offset = 200;
        const svg_viewbox = this.svg.node().viewBox.animVal;
        this.svg_width = svg_viewbox.width;
        this.svg_height = svg_viewbox.height;
        this.chart_width = this.svg_width - offset;
        this.chart_height = this.svg_height * 1 / 2;

        // Create container
        this.chart_container = this.svg.append('g')
            .attr("transform", "translate(" + offset / 2 + "," + this.chart_height * 0.5 + ")")

        // Scale to svg coordinate
        // x-axis
        const label_padding = 40;
        const x_range = [0, d3.max(map_data, d => d.properties.density)];
        const x_scale = d3.scaleLinear()
            .domain(x_range)
            .range([0, this.chart_width]);
        const x_axis = d3.axisBottom()
            .scale(x_scale);
        this.svg.append("g")
            .call(x_axis)
            .attr("transform", "translate(" + offset / 2 + "," + this.chart_height * 1.5 + ")")
            // y-axis
        this.y_range = [0, d3.max(map_data, d => d.properties.doctors)];
        this.y_scale = d3.scaleLinear()
            .domain(this.y_range)
            .range([this.chart_height, 0]);
        this.y_axis = d3.axisLeft()
            .scale(this.y_scale);
        this.svg.append("g")
            .call(this.y_axis)
            .classed("yaxis", true)
            .attr("transform", "translate(" + offset / 2 + "," + this.chart_height * 0.5 + ")");

        this.threshold = d3.mean(map_data, d => d.properties.gdpPerCapita);

        // Draw the bubbles
        this.chart_container.selectAll("circle")
            .data(map_data)
            .enter()
            .append("circle")
            .attr("r", d => bubble_radius)
            .attr("cx", d => x_scale(d.properties.density))
            .attr("cy", d => this.y_scale(d.properties.doctors))
            .classed("bubble", true)
            .classed('bubble-blue', d => d.properties.gdpPerCapita <= this.threshold)
            .classed('bubble-red', d => d.properties.gdpPerCapita >= this.threshold);

        // Draw the labels
        this.bubble_label_shift = 18;
        this.chart_container.append('g')
            .selectAll('text')
            .data(map_data)
            .enter()
            .append('text')
            .text(d => d.id)
            .attr('x', d => x_scale(d.properties.density) - this.bubble_label_shift)
            .attr('y', d => this.y_scale(d.properties.doctors) - this.bubble_label_shift)
            .classed("label-bubble", true)

        this.chart_container.append('g')
            .selectAll('text')
            .data(map_data)
            .enter()
            .append('text')
            .text(d => d.properties.gdpPerCapitaRow + " CHF")
            .classed("label-gdp", true)
            .style("opacity", 0)
            .attr('x', d => x_scale(d.properties.density) + this.bubble_label_shift)
            .attr('y', d => this.y_scale(d.properties.doctors))

        // Draw legend
        const legend_blue_w = this.chart_width * 4 / 5;
        const legend_blue_h = 180;
        const legend_red_w = this.chart_width * 4 / 5;
        const legend_red_h = legend_blue_h + 30;
        const size_rect = 20;

        // - rect blue
        this.svg.append('g')
            .append("rect")
            .attr("id", "legend-blue")
            .classed('bubble-blue', true)
            .attr("width", size_rect)
            .attr("height", size_rect)
            .attr("x", legend_blue_w)
            .attr("y", legend_blue_h);
        // - rect red
        this.svg.append('g')
            .append("rect")
            .attr("id", "legend-red")
            .classed('bubble-red', true)
            .attr("width", size_rect)
            .attr("height", size_rect)
            .attr("x", legend_red_w)
            .attr("y", legend_red_h);

        // - GDP below or equal to average
        this.svg.append('g')
            .append("text")
            .attr("id", "legend-blue")
            .classed("legend-bubble", true)
            .text("GDP below or equal to average")
            .attr("transform", "translate(" + (legend_blue_w + 1.25 * size_rect) + "," + (legend_blue_h + 0.75 * size_rect) + ")")

        // - GDP above average
        this.svg.append('g')
            .append("text")
            .attr("id", "legend-red")
            .classed("legend-bubble", true)
            .text("GDP above average")
            .attr("transform", "translate(" + (legend_red_w + 1.25 * size_rect) + "," + (legend_red_h + 0.75 * size_rect) + ")")

        // - instruction
        this.svg.append('g')
            .append("text")
            .classed("instruction", true)
            .text("Overlay or click on the legend")
            .attr("transform", "translate(" + (legend_red_w + 1.25 * size_rect) + "," + (legend_red_h + 2 * size_rect) + ")")

        // - instruction
        this.svg.append('g')
            .append("text")
            .classed("instruction", true)
            .text("to select only the red or the blue bubbles")
            .attr("transform", "translate(" + (legend_red_w + 1.25 * size_rect) + "," + (legend_red_h + 2.75 * size_rect) + ")")

        // Draw axis label
        this.svg.append('g')
            .append('text')
            .text("# Doctors")
            .classed("label", true)
            .classed("yaxis-label", true)
            .style("font-size", 20)
            .attr("transform", "translate(" + (legend_blue_w) + "," + (legend_blue_h - label_padding) + ")");
        this.svg.append('g')
            .append('text')
            .text("per 1000 inhabitants")
            .classed("label", true)
            .attr("transform", "translate(" + (legend_blue_w) + "," + (legend_blue_h - 0.5 * label_padding) + ")");
        // - population
        this.svg.append('g')
            .append('text')
            .text("Inhabitants in 1000")
            .classed("label", true)
            .attr("transform", "translate(" + (this.chart_width * 0.95) + "," + (this.chart_height * 1.5 + label_padding) + ")");

        // Interaction Bubble Chart Radius
        d3.selectAll("#btn-radius-w")
            .on("click", function() {
                setUniformRadius();
            })

        function setUniformRadius() {
            isBubbleRadiusUniform = !isBubbleRadiusUniform;
            d3.selectAll(".bubble")
                .transition()
                .duration(duration_transition)
                .attr("r", isBubbleRadiusUniform ? bubble_radius : d => d.properties.gdpPerCapita);
            d3.selectAll(".label-bubble")
                .transition()
                .duration(duration_transition)
                .attr('x', d => isBubbleRadiusUniform ? x_scale(d.properties.density) - bubble_chart.bubble_label_shift : x_scale(d.properties.density) - d.properties.gdpPerCapita - label_padding / 8)
                .attr('y', d => isBubbleRadiusUniform ? (isPhysicalResourceMode ? bubble_chart.y_scale(d.properties.beds) - 1.25 * bubble_radius : bubble_chart.y_scale(d.properties.doctors) - 1.25 * bubble_radius) : (isPhysicalResourceMode ? bubble_chart.y_scale(d.properties.beds) - d.properties.gdpPerCapita - label_padding / 8 : bubble_chart.y_scale(d.properties.doctors) - d.properties.gdpPerCapita - label_padding / 8))
        }

        // Interaction Bubble Chart Legend
        d3.selectAll("#legend-red")
            .on("click", function() {
                isSubsetSelected = !isSubsetSelected;
            })
            .on("mouseover", function() {
                clickOnRed = true;
                selectSubsetBubble();
            })
            .on("mouseout", function() {
                if (!isSubsetSelected) {
                    unselectSubsetBubble();
                }
            })

        d3.selectAll("#legend-blue")
            .on("click", function() {
                isSubsetSelected = !isSubsetSelected;
            })
            .on("mouseover", function() {
                clickOnRed = false;
                selectSubsetBubble();
            })
            .on("mouseout", function() {
                if (!isSubsetSelected) {
                    unselectSubsetBubble();
                }
            })


        function selectSubsetBubble() {
            d3.selectAll("#legend-red")
                .style("font-size", clickOnRed ? font_size_default * 1.25 : font_size_default * 0.5)
            d3.selectAll("#legend-blue")
                .style("font-size", clickOnRed ? font_size_default * 0.5 : font_size_default * 1.25)
            d3.selectAll(".bubble")
                .transition()
                .duration(duration_transition / 2)
                .style('opacity', clickOnRed ? (d => d.properties.gdpPerCapita > bubble_chart.threshold ? opacity_default : 0) : (d => d.properties.gdpPerCapita <= bubble_chart.threshold ? opacity_default : 0));
            d3.selectAll(".label-bubble")
                .transition()
                .duration(duration_transition / 2)
                .style('opacity', clickOnRed ? (d => d.properties.gdpPerCapita > bubble_chart.threshold ? opacity_default : 0) : (d => d.properties.gdpPerCapita <= bubble_chart.threshold ? opacity_default : 0));
        }

        function unselectSubsetBubble() {
            d3.selectAll(".bubble")
                .transition()
                .duration(duration_transition / 2)
                .style('opacity', 1);
            d3.selectAll(".label-bubble")
                .transition()
                .duration(duration_transition / 2)
                .style('opacity', 1);
            d3.selectAll("#legend-red")
                .style("font-size", font_size_default)
            d3.selectAll("#legend-blue")
                .style("font-size", font_size_default)
        }

        // Interaction Bubble Resource Mode
        d3.selectAll("#btn-beds")
            .on("click", function() {
                changeMode(true);
            });

        d3.selectAll("#btn-doctors")
            .on("click", function() {
                changeMode(false);
            })

        function changeMode(physicalResourceMode) {
            isPhysicalResourceMode = physicalResourceMode;
            bubble_chart.y_range = [0, d3.max(map_data, d => isPhysicalResourceMode ? d.properties.beds : d.properties.doctors)];
            bubble_chart.y_scale = d3.scaleLinear()
                .domain(bubble_chart.y_range)
                .range([bubble_chart.chart_height, 0]);
            d3.selectAll(".bubble")
                .transition()
                .duration(duration_transition)
                .attr("cy", d => isPhysicalResourceMode ? bubble_chart.y_scale(d.properties.beds) : bubble_chart.y_scale(d.properties.doctors));
            d3.selectAll('.yaxis-label')
                .text(isPhysicalResourceMode ? "# Beds" : "# Doctors")
            bubble_chart.y_axis = d3.axisLeft()
                .scale(bubble_chart.y_scale);
            d3.selectAll(".yaxis")
                .transition()
                .duration(duration_transition)
                .call(bubble_chart.y_axis)
            d3.selectAll(".label-bubble")
                .transition()
                .duration(duration_transition)
                .attr('y', d => isPhysicalResourceMode ? bubble_chart.y_scale(d.properties.beds) - bubble_chart.bubble_label_shift : bubble_chart.y_scale(d.properties.doctors) - bubble_chart.bubble_label_shift)
            d3.selectAll(".label-gdp")
                .attr('y', d => isPhysicalResourceMode ? bubble_chart.y_scale(d.properties.beds) : bubble_chart.y_scale(d.properties.doctors))
        }
    }
}