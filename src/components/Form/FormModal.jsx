import React, { useState, useContext } from 'react';
import { Row, Col, Button, Modal, Form, Input, Typography, Tooltip, Select, DatePicker, Alert } from 'antd';
import { InfoCircleOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import FileUpload from './FileUpload';
import { ModalContext } from "../contexts/ModalContext"
import { filterDataFromForm, onlyUnique } from '../Shared/utils'
import test from "../../data/test.json"
import test1 from "../../data/sample.json"

const { RangePicker } = DatePicker;
const { Option } = Select;

const { Text } = Typography;

const style = { padding: '0px 4px' };

const FormModal = (props) => {

  const [expand, setExpand] = useState(false);
  const [state, setState] = useState({ visible: false, data: [], warning: false, counter: 0 })
  const { setModal } = useContext(ModalContext)
  const [form] = Form.useForm();
  const formRef = React.createRef();

  const showModal = () => {
    setState({
      ...state,
      visible: true
    });
  };

  const onFinish = values => {
    //console.log({raw: state.data, ...values})
    let newData = []
    let raw = state.data
    raw.forEach((d,i)=>{
      if(d[values.SOURCE] && d[values.TARGET]){
        newData.push({
          index: i,
          source : d[values.SOURCE].toString(),
          target : d[values.TARGET].toString(),
          edgeWidth: d[values.EDGE_WIDTH] ? +d[values.EDGE_WIDTH] : 0,
          edgeColor: d[values.EDGE_COLOR] ? +d[values.EDGE_COLOR] : 0,
          tooltip_title: d[values.TOOLTIP_TITLE] ? d[values.TOOLTIP_TITLE] : "",
          tooltip_description: d[values.TOOLTIP_DESCRIPTION] ? d[values.TOOLTIP_DESCRIPTION] : "",
          epoch: d[values.DATE]
        })
      }
    })

    if(values.ENTITY || values.DATE_RANGE || values.DEGREE){
      const filters = {device: values.ENTITY.toString(), dates: values.DATE_RANGE, degree: values.DEGREE}
      newData  = filterDataFromForm(newData, filters)
    } 

    let ids_1 = newData.map(d=>d)
    let ids_2 = newData.map(d=>d)
    let nodeIDs = ids_1.concat(ids_2).filter(onlyUnique)

    if((nodeIDs.length < 300 && newData.length < 300) | state.counter === 1){
      setModal({
        raw: newData,
        SOURCE: {column: values.SOURCE, present: true},
        TARGET: {column: values.TARGET, present: true},
        EDGE_WIDTH: {column: values.EDGE_WIDTH, present: findAttr(raw, values.EDGE_WIDTH)},
        EDGE_COLOR: {column: values.EDGE_COLOR, present: findAttr(raw, values.EDGE_COLOR)},
        TOOLTIP_TITLE: {column: values.TOOLTIP_TITLE, present: findAttr(raw, values.TOOLTIP_TITLE)},
        TOOLTIP_DESCRIPTION: {column: values.TOOLTIP_DESCRIPTION, present: findAttr(raw, values.TOOLTIP_DESCRIPTION)},
        DATE: {column: values.DATE, present: findAttr(raw, values.DATE)}       
      })
      setState({
        ...state,
        visible: false,
        warning: false,
        counter: 0
      });
    } else {
      setState({
        ...state,
        visible: true,
        warning: true,
        counter: state.counter + 1
      });
    }
  };

  function findAttr(data, col){
    return data.some(item=> item.hasOwnProperty(col))
  }

  const handleCancel = e => {
    setState({
      ...state,
      visible: false,
    });
  };

  const updateData = (data) => {
    setState({
      ...state,
      data,
      visible: true
    })
  }

  const onFill_1 = () => {
    formRef.current.setFieldsValue({
      SOURCE: 'original_user_id',
      TARGET: 'user_id',
      DATE: 'epoch',
      EDGE_WIDTH: 'duration',
      EDGE_COLOR: 'distance',
      TOOLTIP_TITLE: 'created_at',
      TOOLTIP_DESCRIPTION: 'full_text'
    });
    updateData(test)
  };

  const onFill_2 = () => {
    formRef.current.setFieldsValue({
      SOURCE: 'source',
      TARGET: 'target',
      EDGE_WIDTH: 'value'
    });
    test1.forEach((d,i)=>{
      d.index = i
    })
    updateData(test1)
  };

  return (
    <>
      <Form.Item>
        <Button default block onClick={showModal}>
          Import data
        </Button>
      </Form.Item>
      <Modal
        title="Import Data"
        visible={state.visible}
        onCancel={handleCancel}
        okButtonProps={{form:'myForm', key: 'submit', htmlType: 'submit'}}
      >
        <Form
          id='myForm'
          ref={formRef} 
          form={form}
          layout='horizontal'
          name="form_in_modal"
          initialValues={{
            modifier: 'public',
          }}
          onFinish={onFinish}
        >
        { state.warning && 
          <Row>
           <Alert message="Warning" 
             description="There is either more than 300 nodes or edges to load the graph with. You may still proceed with rendering the graph but performance my be compromised." 
             type="warning" 
             showIcon closable />
          </Row>
        }
          <Row>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Choose a CSV/JSON file"
              >
                <FileUpload updateData={updateData}/>
                <Button type="link" htmlType="button" onClick={onFill_1}>
                  Load sample1 (temporal) & Fill form
                </Button>
                <Button type="link" htmlType="button" onClick={onFill_2}>
                  Load sample2 (non-temporal) & Fill form
                </Button>
              </Form.Item> 
            </Col>
          </Row>

          <Form.Item>
            <Text strong underline>Column Mapping</Text>
          </Form.Item>
          <Row>
            <Col span={8}>
              <div style={style}>
                <Form.Item name="SOURCE" label="Source" rules={[
                  {
                    required: true,
                    message: 'Please select column for Source',
                  },
                ]}>
                  <Input type="textarea" />
                </Form.Item>
              </div>
            </Col>
            <Col span={8}>
              <div style={style}>
              <Form.Item name="TARGET" label="Target" rules={[
                {
                  required: true,
                  message: 'Please select column for Target',
                },
              ]}>
                <Input type="textarea" />
              </Form.Item>
              </div>
            </Col>
            <Col span={8}>
              <div style={style}>
                <Form.Item name="DATE" label="Date">
                  <Input type="textarea" suffix={
                    <Tooltip title="Dates have to be in UNIX timestamps">
                      <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                    </Tooltip>
                  }/>
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Form.Item>
            <Text strong underline>Search</Text>
          </Form.Item>
          <Row>
            <Col span={12}>
              <div style={style}>
                <Form.Item name="ENTITY" label="Entity">
                  <Input placeholder="Search for an entity" />
                </Form.Item>
              </div>
            </Col>
            <Col span={12}>
              <div style={style}>
                <Form.Item name="DEGREE" label="Degree">
                  <Select
                    placeholder="All"
                    disabled={form.device === 'All' ? true : false}
                  >  
                    <Option value={1}>1st Degree</Option>
                    <Option value={2}>2nd Degree</Option>
                    <Option value={3}>3rd Degree</Option>
                  </Select>
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <div style={style}>
                <Form.Item name="DATE_RANGE" label="Date Range">
                  <RangePicker 
                    allowClear={false}
                    showTime
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
       
           <a
            style={{
              fontSize: 12,
            }}
            onClick={() => {
              setExpand(!expand);
            }}
          >
            {expand ? <UpOutlined /> : <DownOutlined />} 
            {expand ? " Hide Advanced Styles" : " Show Advanced Styles"}
          </a>

        { expand && 
          <>
          <Form.Item>
            <Text strong underline>Styles</Text>
          </Form.Item>
          <Row>
            <Col span={12}>
              <div style={style}>
                <Form.Item name="EDGE_WIDTH" label="Edge Width">
                  <Input type="textarea" suffix={
                    <Tooltip title="Only continuous values">
                      <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                    </Tooltip>
                  }/>
                </Form.Item>
              </div>
            </Col>
            <Col span={12}>
              <div style={style}>
                <Form.Item name="EDGE_COLOR" label="Edge Color">
                  <Input type="textarea" suffix={
                    <Tooltip title="Only continuous values">
                      <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                    </Tooltip>
                  }/>
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Form.Item>
            <Text strong underline>Tooltip Content</Text>
          </Form.Item>
          <Row>
            <Col span={12}>
              <div style={style}>
                <Form.Item name="TOOLTIP_TITLE" label="Title">
                  <Input type="textarea" />
                </Form.Item>
              </div>
            </Col>
            <Col span={12}>
              <div style={style}>
                <Form.Item name="TOOLTIP_DESCRIPTION" label="Description">
                  <Input type="textarea" />
                </Form.Item>
              </div>
            </Col>
          </Row>
          </>
        }

        </Form>
      </Modal>
    </>
  );

};

export default FormModal