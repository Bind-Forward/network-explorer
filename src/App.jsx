import React, {useState, useEffect, createRef, useContext} from 'react';
import Graphin from '@antv/graphin';
import { Toolbar } from '@antv/graphin-components';
import * as d3 from 'd3';
import insertCss from 'insert-css';

import Timeline, {brush} from './components/Timeline/Timeline';
import FormBar from './components/Form/FormBar';
import LandingPage from './components/Shared/LandingPage'
import Legend from './components/Shared/Legend'
import LegendSVG from './components/Shared/LegendSVG'
import { findDegree, filterDataFromForm, filterByDevices, onlyUnique, getTime } from './components/Shared/utils'
import { ModalContext } from "./components/contexts/ModalContext"
import { Spin } from 'antd';

import '@antv/graphin/dist/index.css'; 
import '@antv/graphin-components/dist/index.css'; 

import "./App.css"

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
    text-align: left;
  }
`);

const App = () => { 
  
  const { modalState } = useContext(ModalContext)
  const [filters, setFilters] = useState({dates: modalState.DATE_RANGE, entity: modalState.ENTITY, degree: modalState.DEGREE, reset: false}) // form values
  const [highlight, setHighlight] = useState({brushedDates: []}) // dates selected upon brushing
  const [selected, setSelected] = useState([]) // clicked node
  const [loading, setLoading] = useState(false)

  const [data, setData] = useState({
    filteredData: [],
    graphData:{nodes: [], edges:[]}, 
    degreeData: [], 
    accessors: {widthAccessor: () => 1, strokeAccessor: () => 'dimgray'},
    legendOptions: {node_color: [], edge_color: []}
  }) // graph is re-rendered each time setData is executed

  const graphinRef = createRef(null);
  //const [graph, setGraph] = useState(graphinRef.current)

  let { raw, DATE, NODE_COLOR, NODE_RADIUS, EDGE_COLOR, EDGE_WIDTH, EDGE_TOOLTIP_TITLE, EDGE_TOOLTIP_DESCRIPTION } = modalState
  const { nodes, edges } = raw
  const { filteredData, graphData, degreeData, accessors, legendOptions } = data
  const { widthAccessor, strokeAccessor } = accessors

  // helper function to reset graph to original state and style
  const clearAllStats = (graph, accessors) => {

    const {widthAccessor, strokeAccessor} = accessors
    graph.setAutoPaint(false);
    graph.getNodes().forEach(function(node) {
      graph.clearItemStates(node);
    });
    graph.getEdges().forEach(function(edge) {
      let D = edge._cfg.model.data
      graph.updateItem(edge, {style : {line: { color: strokeAccessor(D.content.edgeColor['value']), width: widthAccessor(D.content.edgeWidth['value']) }}})
      graph.clearItemStates(edge);
    });
    graph.paint();
    graph.setAutoPaint(true);

  };

  // highlight node that is being moused over and its connections, graying out the rest
  const onMouseEnter = (e, graph, accessors, brushedDates) => {

    if(brushedDates.length === 0){
      const {widthAccessor, strokeAccessor} = accessors
      const item = e.item;

      graph.setAutoPaint(false);
      graph.getNodes().forEach(function(node) {
        graph.clearItemStates(node);
        graph.setItemState(node, "highlight.dark", true);
      });
      graph.setItemState(item, "highlight.dark", false);
      graph.setItemState(item, "highlight.light", true);

      graph.getEdges().forEach(function(edge) {
        let D = edge._cfg.model.data
        graph.updateItem(edge, {style : {line: { color: strokeAccessor(D.content.edgeColor['value']), width: widthAccessor(D.content.edgeWidth['value']) }}})
        if (edge.getSource() === item) {
          graph.setItemState(edge.getTarget(), "highlight.dark", false);
          graph.setItemState(edge.getTarget(), "highlight.light", true);
          graph.setItemState(edge, "highlight.light", true);
          edge.toFront();
        } else if (edge.getTarget() === item) {
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

  }

  // render graph after data upload
  useEffect(() => {

    if(edges.length > 0){
      //console.log('initial upload')
      let widthAccessor, strokeAccessor, radiusAccessor, colorAccessor 
      let edge_width_DataArr = edges.map(d=>d.edgeWidth)
      let edge_color_DataArr = edges.map(d=>d.edgeColor)
      let node_radius_DataArr = nodes.map(d=>d.nodeRadius)
      let node_color_DataArr = nodes.map(d=>d.nodeColor)

      if(EDGE_WIDTH.present && !edge_width_DataArr.some(isNaN)){
        let widthScale = d3.scaleLinear()
          .domain([0, d3.max(edges, d=>d.edgeWidth)])
          .range([1, 7])

        widthAccessor = (d) => widthScale(d)

      } else {
        widthAccessor = (d) => 1
      }

      let legend_edge_color = []
      if(EDGE_COLOR.present && !edge_color_DataArr.some(isNaN)){
        let arr = [0, d3.max(edges, d=>d.edgeColor)]
        let strokeScale = d3.scaleLinear()
          .domain(arr)
          .range(["WhiteSmoke", "black"])

        const start = 0, stop = d3.max(edges, d=>d.edgeColor), step = 10;
        const array = [];
        for (let i = 0, n = Math.ceil((stop - start) / step); i < n; ++i) {
          array.push(start + i * step);
        }

        array.forEach((d,i) => {
           legend_edge_color.push({
             label: d,
             value: d,
             color: strokeScale(d)
           })
        })

        strokeAccessor = (d) => strokeScale(d)
      } else {
        strokeAccessor = (d) => 'dimgray'
      }

      if(NODE_RADIUS.present && !node_radius_DataArr.some(isNaN)){
        let radiusScale = d3.scaleLinear()
          .domain([0, d3.max(nodes, d=>d.nodeRadius)])
          .range([1, 70])

        radiusAccessor = (d) => radiusScale(d)
        
      } else {
        radiusAccessor = (d) => 2
      }

      let colorScale = d3.scaleOrdinal()
      if(NODE_COLOR.present){
        let categories = nodes.map(d=>d.nodeColor).filter(onlyUnique)

        // sort categories by decreasing value count so that primary colors get displayed first
        let categoriesStats = d3.nest()
          .key(d => d.nodeColor)
          .rollup()
          .entries(nodes)
        let sortBy = categoriesStats.map(d=>d.key)

        categories = categories.sort((a,b) => sortBy.indexOf(a) - sortBy.indexOf(b))

        colorScale
          .domain(categories)
          .range(["#0800FF", "#C900C8", "#5FE81B", "#FD3800", "#F04BB0"])

        colorAccessor = (d) => colorScale(d)
      } else {

        colorScale
          .domain(['parent', 'child'])
          .range(["#0800FF", "#C900C8"])

        colorAccessor = (d) => colorScale(d)
      }

      let legend_node_color = []
      colorScale.domain().forEach((d,i) => {
         legend_node_color.push({
           label: d,
           value: d,
           color: colorScale(d)
         })
      })

      let legendOptions = {node_color: legend_node_color, edge_color: legend_edge_color, node_color_label: NODE_COLOR.column, edge_color_label: EDGE_COLOR.column,}
      let accessors = {widthAccessor, strokeAccessor, radiusAccessor, colorAccessor}
      let degreeData = findDegree(edges)
      let graphData = transformDataToGraph(raw, degreeData, accessors)
      setData({...data, filteredData: edges, graphData, degreeData, accessors, legendOptions}) // graph loads on initial render
      setFilters({dates: modalState.DATE_RANGE, entity: modalState.ENTITY, degree: modalState.DEGREE, reset: false})

      // modify graph element style by registering a click/mouseenter/mouseleave event
      //const { graph } = graphinRef.current;
      //graph.on('beforelayout', function() {
        //setLoading(true)
      //});
      // graph.on('afterlayout', function() {
      //   setLoading(false)
      // });

      // setGraph(graph)

      // graph.on("node:mouseenter", (e) => onMouseEnter(e, graph, accessors, highlight.brushedDates));
      // graph.on("node:mouseleave", () => clearAllStats(graph, accessors));
      // graph.on("canvas:click", () => clearAllStats(graph, accessors));
      // graph.on("node:click", (e) => setSelected(e.item._cfg.id));
      // //graph.on("wheelzoom", () => console.log(graph.getZoom()));
      // return () => {
      //   graph.off("node:mouseenter", (e) => onMouseEnter(e, graph, accessors, highlight.brushedDates));
      //   graph.off("node:mouseleave", () => clearAllStats(graph, accessors));
      //   graph.off("canvas:click", () => clearAllStats(graph, accessors));
      //   graph.off("node:click", (e) => setSelected(e.item._cfg.id));
      // };
    }

    //let delay = (edges.length >= 300 | nodes.length >= 300) ? 10000 : 2000
    //setTimeout(function(){
      //setLoading(false)
    //}, delay)

  }, [modalState]);

  // modify graph element style through timeline bar chart brushing event
  useEffect(() => {

    const { nodes, edges } = graphData // current graph state (taking into account filters, if any)
    let dataNodes = nodes
    let dataEdges = edges

    if(highlight.brushedDates.length > 0){

      const { graph } = graphinRef.current;
      //graph.on("node:mouseenter", null);

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
        let D = dataEdges.find(d=>d.id === edge).data
        graph.updateItem(edge, {style : {line: { color: strokeAccessor(D.content.edgeColor['value']), width: widthAccessor(D.content.edgeWidth['value']) }}})
        graph.setItemState(edge, "highlight.light", true);
      });

      graph.paint();
      graph.setAutoPaint(true);

    }  

  }, [highlight.brushedDates]);

  // modify graph by showing/hiding connected nodes to clicked node (taking into account filtered time submitted by form, if any)
  useEffect(() => {

    const { graph } = graphinRef.current;

    let newData = filterByDevices([selected], edges, filters.dates) 
    let expandData = transformDataToGraph({nodes, edges:newData}, degreeData, accessors)

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
        graphData: {
          nodes: [...data.graphData.nodes, ...expandNodes],
          edges: [...data.graphData.edges, ...expandEdges],
        },
      });
    }
  
  }, [selected])

  // render new graph based on form values
  useEffect(() => {
    const { graph } = graphinRef.current
    const { entity, dates, degree, reset } = filters

    if(entity !== 'All' | dates.length > 0 | degree !== 'All' | reset){ // stop graph rerendering on initial load with default form settings
      //console.log('new form submit')
      let newData = filterDataFromForm(edges, filters)
      let graphData = transformDataToGraph({nodes, edges:newData}, degreeData, accessors)
      setData({...data, filteredData: newData, graphData})
      clearAllStats(graph, accessors)
    }
    
  }, [filters]);

  // set new date range based on brush
  const findElementsToHighlight = (dates) => {
    setHighlight({brushedDates: dates})
  }

  // set new filters based on form values
  const updateGraph = (form) => {

    const { entity, dates, degree } = form
    setFilters({
      ...filters, entity, degree, dates: dates.length > 0 ? [dates[0], dates[1]] : [], reset: false
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

      setFilters({dates: [], entity: "All", degree: "All", reset: true})
      d3.selectAll('.brush').call(brush.move, null);

    }
    delete toolbarCfgNew[3].renderTooltip

    return toolbarCfgNew;

  };

  // modify graph element style through clickable legend options
  const handleLegend = (checked, options, LegendProps) => {

    //graph.on("node:mouseenter", null);

    const { apis } = LegendProps;

    const { nodes } = graphData

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

  function transformDataToGraph(data, degreeData, accessors) {

    const {widthAccessor, strokeAccessor, radiusAccessor, colorAccessor} = accessors

    let ids_1 = data.edges.map(d=>d.source)
    let ids_2 = data.edges.map(d=>d.target)
    let nodeIDs = ids_1.concat(ids_2).filter(onlyUnique)

    // only filter for entities present in edges
    let nodes = []

    if(data.nodes.length > 0){
      let filteredNodes = data.nodes.filter(d=>nodeIDs.indexOf(d.id) !== -1)
      filteredNodes.forEach((d,i) => {
        if(d){
          let degree = degreeData.find(el=>el.key === d.id.toString()).value
          let type =  degree === 1 ? 'child' : 'parent'
          nodes.push({
            id : d.id.toString(),
            label: d.id, 
            data: {
              type: NODE_COLOR.present ? d.nodeColor : type
            },
            //style : {node: {radius: radiusAccessor(d.nodeRadius), fill: NODE_COLOR.present ? colorAccessor(d.nodeColor) : colorAccessor(type)}},
            style : {nodeSize: radiusAccessor(d.nodeRadius), primaryColor: NODE_COLOR.present ? colorAccessor(d.nodeColor) : colorAccessor(type)},
          })
        }
      })
    } else {
      nodeIDs.forEach((d,i) => {
        if(d){
          let degree = degreeData.find(el=>el.key === d.toString()).value
          let type =  degree === 1 ? 'child' : 'parent'
          nodes.push({
            id : d.toString(),
            label: d, 
            data: {
              type: type
            },
            style : {nodeSize: radiusAccessor(d.nodeRadius), primaryColor: colorAccessor(type)},
          })
        }
      })     
    }

    let edges = []
    data.edges.forEach((d,i) => {
      edges.push({
        id : d.source + '-' + d.target + '-' + i,
        source : d.source.toString(),
        target : d.target.toString(),
        data : {
          index: d.index, 
          date: getTime(d.epoch), 
          content: {
            title: EDGE_TOOLTIP_TITLE.present ? d.tooltip_title : d.index, 
            description: {label: EDGE_TOOLTIP_DESCRIPTION.present ? EDGE_TOOLTIP_DESCRIPTION.column : null, value: d.tooltip_description},
            edgeColor: {label: EDGE_COLOR.present ? EDGE_COLOR.column : null, value: d.edgeColor},
            edgeWidth: {label: EDGE_WIDTH.present ? EDGE_WIDTH.column : null, value: d.edgeWidth}
          }
        },
        style : {line: {width: widthAccessor(d.edgeWidth), color: strokeAccessor(d.edgeColor)}}
      })
    })

    return { nodes, edges }

  }

  return (
    <div className="App">
      { edges.length === 0 &&  <LandingPage/> }
      <div className="LoadingPage" style={{visibility: loading ? 'visible': 'hidden'}}>
        <Spin size="large" />
      </div>     
      { edges.length > 0 &&  <FormBar updateGraph={updateGraph} reset={filters.reset}/> }
        <Graphin 
          data={graphData} 
          layout={{
            name: 'force',
            options: {
              preset: {
                name: 'force'
              },
              MaxIterations: 1200,
              tickInterval: 0.03,
              minEnergyThreshold: 0.02
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
                {
                  type: 'edge-tooltip',
                  formatText(model) {
                    let content = model.data.content
                    let text = `<h3>${content.title}</h3>`
                    if(content.edgeColor.label){
                      text += `<p><span class='label'>${content.edgeColor.label}: </span>${content.edgeColor.value}</p>`
                    }
                    if(content.edgeWidth.label){
                      text += `<p><span class='label'>${content.edgeWidth.label}: </span>${content.edgeWidth.value}</p>`
                    }   
                    if(content.description.label){
                      text += `<p>${content.description.value}</p>`
                    }   
                    return text;
                  }
                },
              ],
            },
          }}
          ref={graphinRef}
        >
        { edges.length > 0 && <Toolbar render={renderToolbar}/> }
        { edges.length > 0 && <Legend options={legendOptions.node_color} onChange={handleLegend} label={legendOptions.node_color_label}/> }
        { (edges.length > 0 && legendOptions.edge_color.length > 0) && <LegendSVG data={legendOptions.edge_color} label={legendOptions.edge_color_label}/> }
      </Graphin>
      { (edges.length > 0 && DATE.present) && <Timeline data={filteredData} findElementsToHighlight={findElementsToHighlight}/> }
    </div>
  );

};


export default App;