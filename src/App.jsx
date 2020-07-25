import React, {useState, useEffect, createRef} from 'react';
import Graphin, { Utils } from '@antv/graphin';
import { Toolbar, Legend } from '@antv/graphin-components';
import Timeline, {brush} from './components/Timeline/Timeline';
import FormBar from './components/Form/FormBar';
import * as d3 from 'd3';
import insertCss from 'insert-css';
import {getTime, getRange, onlyUnique, findDegree} from './components/Shared/utils'

import '@antv/graphin/dist/index.css'; 
import '@antv/graphin-components/dist/index.css'; 

import raw from "./data/tecnopolis3_tweets.json"
import "./App.css"

let filteredData = raw.slice(0, 300)
filteredData.forEach(d=>{
  d.source = d.original_user_id
  d.target = d.user_id
})
let degreeData = findDegree(raw)
let tooltipAttrs = {TITLE: 'created_at', DESCRIPTION: 'full_text'}
let graphData = transformDataToGraph(filteredData, degreeData, tooltipAttrs)

insertCss(`
  .g6-tooltip {
    border: 1px solid #e2e2e2;
    border-radius: 4px;
    font-size: 12px;
    color: #545454;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 10px 8px;
    box-shadow: rgb(174, 174, 174) 0px 0px 10px;
    max-width: 200px;
  }
`);

const legendOptions = [
  {
    label: 'Parent Node',
    value: 'parent',
    color: 'navy',
  },
  {
    label: 'Child Node',
    value: 'child',
    color: 'turquoise',
  },
];

const App = () => {
 
  const [filters, setFilters] = useState({device: "All", dates: [], degree: 1}) // form values
  const [highlight, setHighlight] = useState({brushedDates: []}) // dates selected upon brushing
  const [selected, setSelected] = useState([]) // clicked node
  const [data, setData] = useState({sessions: [], graph:{nodes: [], edges:[]}}) // graph is re-rendered each time setData is executed
  const graphinRef = createRef(null);

  // helper function to reset graph to original state and style
  const clearAllStats = (graph) => {

    graph.setAutoPaint(false);
    graph.getNodes().forEach(function(node) {
      graph.clearItemStates(node);
    });
    graph.getEdges().forEach(function(edge) {
      graph.updateItem(edge, {style : {line: {color: 'navy'}}})
      graph.clearItemStates(edge);
    });
    graph.paint();
    graph.setAutoPaint(true);

  };

  // highlight node that is being moused over and its connections, graying out the rest
  const onMouseEnter = (e, graph) => {

    const item = e.item;
    graph.setAutoPaint(false);
    graph.getNodes().forEach(function(node) {
      graph.clearItemStates(node);
      graph.setItemState(node, "highlight.dark", true);
    });
    graph.setItemState(item, "highlight.dark", false);
    graph.setItemState(item, "highlight.light", true);

    graph.getEdges().forEach(function(edge) {
      if (edge.getSource() === item) {
        graph.updateItem(edge, {style : {line: {color: 'navy'}}})
        graph.setItemState(edge.getTarget(), "highlight.dark", false);
        graph.setItemState(edge.getTarget(), "highlight.light", true);
        graph.setItemState(edge, "highlight.light", true);
        edge.toFront();
      } else if (edge.getTarget() === item) {
        graph.updateItem(edge, {style : {line: {color: 'navy'}}})
        graph.setItemState(edge.getSource(), "highlight.dark", false);
        graph.setItemState(edge.getSource(), "highlight.light", true);
        graph.setItemState(edge, "highlight.light", true);
        edge.toFront();
      } else {
        graph.updateItem(edge, {style : {line: {color: 'lightgray'}}})
        graph.setItemState(edge, "highlight.light", false);
      }
    });
    graph.paint();
    graph.setAutoPaint(true);
  }

  // modify graph element style by registering a click/mouseenter/mouseleave event
  useEffect(() => {

    const { graph } = graphinRef.current;

    graph.on("node:mouseenter", (e) => onMouseEnter(e, graph));
    graph.on("node:mouseleave", () => clearAllStats(graph));
    graph.on("canvas:click", () => clearAllStats(graph));
    //graph.on("wheelzoom", () => console.log(graph.getZoom()));

  }, []);

  // modify graph element style through timeline bar chart brushing event
  useEffect(() => {

    const { graph } = graphinRef.current;

    const { nodes, edges } = data.graph // current graph state (taking into account filters, if any)
    let dataNodes = nodes
    let dataEdges = edges

    if(highlight.brushedDates.length > 0){

      // identify list of nodes and edges to highlight based on selected datetime range
      // highlight target device nodes which source device has sessions with + session edges within the filtered time frame
      dataEdges = dataEdges.filter(d=>highlight.brushedDates.indexOf(d.data.date) !== -1)
      let edgeIds = dataEdges.map(d=>d.id)
      let start_edgeIds = dataEdges.map(d=>d.id.split('-')[0])
      let end_edgeIds = dataEdges.map(d=>d.id.split('-')[1])
      dataNodes = dataNodes.filter(d=>start_edgeIds.indexOf(d.id) !== -1 | end_edgeIds.indexOf(d.id) !== -1)
      let nodeIds = dataNodes.map(d=>d.id)

      graph.getNodes().forEach(function(node) {
        graph.clearItemStates(node);
        graph.setItemState(node, "highlight.dark", true);
      });

      nodeIds.forEach(function(node) {
        graph.clearItemStates(node);
        graph.setItemState(node, "highlight.light", true);
      });

      graph.getEdges().forEach(function(edge) {
        graph.clearItemStates(edge);
        graph.updateItem(edge, {style : {line: {color: 'lightgray'}}})
        graph.setItemState(edge, "highlight.dark", true);
      });

      edgeIds.forEach(function(edge) {
        graph.clearItemStates(edge);
        graph.updateItem(edge, {style : {line: {color: 'navy'}}})
        graph.setItemState(edge, "highlight.light", true);
      });

      graph.paint();
      graph.setAutoPaint(true);

    }  

  }, [highlight.brushedDates]);

  // modify graph by showing/hiding connected nodes to clicked node (taking into account filtered time submitted by form, if any)
  useEffect(() => {

    const { graph } = graphinRef.current;

    let newData = filterByDevices([parseInt(selected)], raw, filters.dates) 
    let expandData = transformDataToGraph(newData, degreeData)

    // remove nodes and edges that already exist on graph
    let existingNodeIds = graph.getNodes().map(d=>d._cfg.id)
    let existingEdgeIds = graph.getEdges().map(d=>d._cfg.model.data.index)
    let expandNodes = expandData.nodes.filter(d=>{
      return existingNodeIds.indexOf(d.id) === -1
    })
    let expandEdges = expandData.edges.filter(d=>{
      return existingEdgeIds.indexOf(d.data.index) === -1
    })

    if(expandNodes.length > 0 | expandEdges.length > 0){
      setData({
        ...data,
        graph: {
          nodes: [...data.graph.nodes, ...expandNodes],
          edges: [...data.graph.edges, ...expandEdges],
        },
      });
    }
  
  }, [selected])

  // render new graph based on form values
  useEffect(() => {

    let { device, dates, degree } = filters

    let newData = []
    if(device && device !== 'All'){
      newData = filterByDevices([parseInt(device)], raw, dates) // only render edges one hop away from searched node
      //console.log(newData)
      // use filtered results to find connections for the next hop step
      let nodeIds = []
      let n1s = newData.map(d=>parseInt(d.source))
      let n1t = newData.map(d=>parseInt(d.target))
      nodeIds.push(n1s)
      nodeIds.push(n1t)
      nodeIds.push(parseInt(device))
      if(degree > 1){
        newData = filterByDevices(nodeIds.flat(), raw, dates) // render edges 2 hop away from searched node
        //console.log(newData)
        let n2s = newData.map(d=>parseInt(d.source))
        let n2t = newData.map(d=>parseInt(d.target))
        nodeIds.push(n2s)
        nodeIds.push(n2t)
        if(degree > 2){
         newData = filterByDevices(nodeIds.flat(), raw, dates) // render edges 3 hop away from searched node
         //console.log(newData)          
        }
      }
    } else if(dates.length > 0){
      newData = filterByDate(dates, filteredData) // no concept of 'hops' if no node ID is searched for
    } else {
      newData = filteredData
    }
    let graphData = transformDataToGraph(newData, degreeData, tooltipAttrs)
    setData({sessions: newData, graph: graphData})

  }, [filters]);

  function filterByDate(dates, data) {
    let datesArr = getRange(dates[0], dates[1], 'hours')
    return data.filter(d => datesArr.indexOf(getTime(d.created_at)) !== -1)
  }

  function filterByDevices(devices, data, dates) {
    let newData = data.filter(d=>devices.indexOf(d.source) !== -1 | devices.indexOf(d.target) !== -1)
    if(dates.length > 0){
      newData = filterByDate(dates, newData)
    }  
    return newData
  }

  // set new date range based on brush
  const findElementsToHighlight = (dates) => {
    setHighlight({brushedDates: dates})
  }

  // set new filters based on form values
  const updateGraph = (form) => {
    const { device, dates, degree } = form
    setFilters({
      ...filters, device, degree, dates: dates.length > 0 ? [dates[0], dates[1]] : []
    })
    d3.selectAll('.brush').call(brush.move, null) // remove brush each time form values change

  }

  // modify toolbar
  const renderToolbar = (renderProps, _state) => {

    const { toolbarCfg } = renderProps;

    let toolbarCfgNew = toolbarCfg.slice(0, 4)
    toolbarCfgNew[0].name = 'Full Screen'
    toolbarCfgNew[1].name = 'Zoom In'
    toolbarCfgNew[2].name = 'Zoom Out'
    toolbarCfgNew[3].name = 'Reset'
    toolbarCfgNew[3].action = () => {

      const { graph } = graphinRef.current;
      //clearAllStats(graph)
      //setData({sessions: filteredData, graph: graphData})
      setFilters({device: "All", dates: [], degree: 1})
      d3.selectAll('.brush').call(brush.move, null);

    }
    delete toolbarCfgNew[3].renderTooltip

    return toolbarCfgNew;

  };

  // modify graph element style through clickable legend options
  const handleLegend = (checked, options, LegendProps) => {
    const { apis } = LegendProps;

    const { nodes, edges } = data.graph

    const optionsMap = options.reduce((acc, curr) => {
      acc[curr.value] = curr;
      return acc;
    }, {});

    const filterNodes = nodes.filter(node => {
      return optionsMap[node.data.type].checked;
    });
    const nodeIds = filterNodes.map(c => c.id);

    apis.highlight(nodeIds);

  }

  return (
    <div className="App">
      <FormBar updateGraph={updateGraph} reset={filters.device === 'All'}/>
        <Graphin 
          data={data.graph} 
          layout={{
            name: 'force',
            options: {
              preset: {
                name: 'force',
              },
              centripetalOptions: {
                single: 100,
                center: (node, degree) => {
                  return {
                    x: window.innerWidth,
                    y: window.innerHeight,
                  };
                },
              },
            },
          }}
          options={{
            zoom: 0.4, 
            pan: {
              x: 200,
              y: 100,
            },
            autoPolyEdge: true,
            modes: {
              default: [
                // {
                //   type: 'tooltip',
                //   formatText(model) {
                //     const text = model.data.description;
                //     return text;
                //   },
                // },
                {
                  type: 'edge-tooltip',
                  formatText(model) {
                    const text = `<b>${model.data.content.title}</b><p>${model.data.content.description}</p>`
                    return text;
                  },
                },
              ],
            },
          }}
          ref={graphinRef}
        >
        <Toolbar render={renderToolbar}/>
        <Legend options={legendOptions} onChange={handleLegend} />
      </Graphin>
      <Timeline data={data.sessions} findElementsToHighlight={findElementsToHighlight}/>
    </div>
  );
};

function transformDataToGraph(sessions, degreeData, tooltip_attrs) {

  let nodes = []
  let ids_1 = sessions.map(d=>d.source)
  let ids_2 = sessions.map(d=>d.target)
  let nodeIDs = ids_1.concat(ids_2).filter(onlyUnique)
  nodeIDs.map((d,i) => {
    if(d){
      let degree = degreeData.find(el=>el.key === d.toString()).value
      nodes.push({
        id : d.toString(),
        label: d, 
        data: {id: d, type: degree === 1 ? 'child' : 'parent'},
        style : {nodeSize: 2, icon: 'user', primaryColor: degree === 1 ? 'turquoise' : 'navy'},
      })
    }
  })

  let edges = []
  sessions.map((d,i) => {
    edges.push({
      id : d.source + '-' + d.target + '-' + i,
      source : d.source.toString(),
      target : d.target.toString(),
      data : {index: d.id, date: getTime(d.created_at), content: {title: d[tooltip_attrs.TITLE], description: d[tooltip_attrs.DESCRIPTION]}},
      style : {line: {color: 'navy'}}
    })
  })

  return { nodes, edges }

}

export default App;