import * as d3 from 'd3';
import moment from 'moment';

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

export function getTime(datetime) {
  return moment(datetime).format("MMM DD hha")
}

export function getRange(startDate, endDate, type) {
   
  let fromDate = moment(startDate)
  let toDate = moment(endDate)
  let diff = toDate.diff(fromDate, type)
  let range = []
  for (let i = 0; i < diff; i++) {
    range.push(moment(startDate).add(i, type)) // based on desired timezone, subtract the hours that are ahead of the UTC timezone.
  }
  range = range.map(d=>getTime(d))
  return range
}

export function findDegree(links) {

  const linksTarget_nested = d3.nest()
    .key(function (d) {
      return d.target
    })
    .rollup(function (leaves) {
      return leaves.length
    })
    .entries(links)

  const linksSource_nested = d3.nest()
    .key(function (d) {
      return d.source
    })
    .rollup(function (leaves) {
      return leaves.length
    })
    .entries(links)

  const linksNested = []
  linksTarget_nested.forEach(function (d, i) {
    linksNested.push({ key: d.key, value: d.value })
  })
  linksSource_nested.forEach(function (d, i) {
    linksNested.push({ key: d.key, value: d.value })
  })

  const linkAllNodes = d3.nest()
    .key(function (d) {
      return d.key
    })
    .rollup(function (leaves) {
      return d3.sum(leaves, (d) => d.value)
    })
    .entries(linksNested)

  return linkAllNodes
}