import React, { useRef, useEffect, useContext } from 'react';
import * as d3 from 'd3';
import moment from 'moment';
import {getTime, getRange} from '../Shared/utils'
import { ModalContext } from "../contexts/ModalContext"

//let systemOffset = new Date().getTimezoneOffset()/60 // detects the system timezone of client
//let systemOffset = 0
//let hoursOffset = 0 // adjusts the timezone to Singapore Standard Time (GMT +8)

export const brush = d3.brushX()

const Timeline = (props) => {

  const { modalState } = useContext(ModalContext)
  const { data, findElementsToHighlight} = props
  let { DATE } = modalState

  const inputEl = useRef(null);

  // set the dimensions and margins of the graph
  const margin = {top: 20, right: 20, bottom: 50, left: 60},
      width = window.innerWidth - 40 - margin.left - margin.right,
      height = window.innerWidth > 1440 ? 160 : 150 - margin.top - margin.bottom;

  // set the ranges
  let x = d3.scaleTime()
            .range([0, width])

  let y = d3.scaleLinear()
            .range([height, 0]);
     
  brush.extent([[0, 0], [width, height]])

  useEffect(() => {

    let svg = d3.select(inputEl.current).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr('class', 'timeline')
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

    // text label for the x axis
    svg.append("text")             
        .attr("transform",
              "translate(" + (width/2) + " ," + 
                             (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text("Date");

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total Edges");      

    svg.append("g")
        .attr("class", "brush")
        //.call(brush.on("end", brushended));

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr('class', 'x-axis')

    // add the y Axis
    svg.append("g")
        .attr('class', 'y-axis')

  }, [])

  useEffect(() => {

    update_timeline(data)

  }, [data])

  function brushended() {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    var d0 = d3.event.selection.map(x.invert),
        d1 = d0.map(d3.timeHour.round);

    // If empty when rounded, use floor & ceil instead.
    if (d1[0] >= d1[1]) {
      d1[0] = d3.timeHour.floor(d0[0]);
      d1[1] = d3.timeHour.offset(d1[0]);
    }

    d3.select(this).transition().call(d3.event.target.move, d1.map(x));

    let range = getRange(d1[0], d1[1], 'hours')
    findElementsToHighlight(range)

  }

  function update_timeline(data) {

    data.forEach(function(d) {
      d.date = getTime(d[DATE])
      d.epoch = moment(d[DATE]).toDate()
    })

    let MAX = d3.max(data, d=>d.epoch)
    MAX = moment(MAX).add(1, "hours")
    let MIN = moment(MAX).subtract(3, "days")
    const scaleTime =d3.scaleTime().domain([MIN, MAX])
    const hours = scaleTime.ticks(d3.timeHour.every(1))
    const hours_formatted = hours.map(d => getTime(d))

    let dataSum = d3.nest()
      .key(d=>d.date)
      .rollup(leaves => leaves.length)
      .entries(data)

    let timelineData = []
    hours_formatted.forEach(d => {
      let hour_data = dataSum.find(el=>el.key === d)
      timelineData.push({
        date : moment(d, "MMM DD hha").toDate(),
        value : hour_data ? hour_data.value : 0
      })
    })

    // timelineData.forEach(d => {
    //   let epoch = d.date.setHours(d.date.getHours() + systemOffset + hoursOffset) // adjusts UTC timezone to desired timezone, taking into account the system timezone
    //   d.date = moment(epoch).toDate()
    // })

    // Scale the range of the data in the domains
    let datetimes = timelineData.map(function(d) { return d.date })
    x.domain(d3.extent(timelineData, d=>d.date));
    y.domain([0, d3.max(timelineData, function(d) { return d.value })]);

    // append the rectangles for the bar chart
    let svg = d3.select(inputEl.current).select(".timeline")
    let bars = svg.selectAll(".bar").data(timelineData, d=>d.id)

    bars.exit().remove()

    let barsEnter = bars.enter().append("rect")

    barsEnter
        .attr("class", "bar")
        .attr('id', d => d.date)
        .attr("x", function(d) { 
          return x(d.date); 
        })
        .attr("width", width/datetimes.length)
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return height - y(d.value); })
        .attr('fill', 'black')

    bars = bars.merge(barsEnter)

    bars.transition().duration(350)
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })

    d3.select('.x-axis')
      .call(d3.axisBottom(x)
          .ticks(d3.timeHour.every(6))
          .tickFormat(d3.timeFormat("%b %d %I%p"))
          .tickPadding(0)
      );

    d3.select('.y-axis')
      .call(d3.axisLeft(y)
        .ticks(5)
      );
   
    d3.select('.brush')
      .call(brush.on("end", brushended));
  }

  return (
    <div id="tweets-timeline" ref={inputEl}>
    </div>
  );
};

export default Timeline;