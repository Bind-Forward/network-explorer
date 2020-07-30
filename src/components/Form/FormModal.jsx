import React, { useState, useContext } from 'react';
import { Button, Modal, Form, Input, Typography } from 'antd';
import FileUpload from './FileUpload';
import { ModalContext } from "../contexts/ModalContext"
import test from "../../data/test.json"

const { Text } = Typography;

const FormModal = (props) => {

  const [state, setState] = useState({ visible: false, data: [] }) // clicked status
  const { setModal } = useContext(ModalContext)
  const [form] = Form.useForm();
  const formRef = React.createRef();

  const showModal = () => {
    setState({
      visible: true,
    });
  };

  const onFinish = values => {
    //console.log({raw: state.data, ...values})
    setModal({raw: state.data, ...values})
    setState({
      ...state,
      visible: false,
    });
  };

  const handleCancel = e => {
    setState({
      ...state,
      visible: false,
    });
  };

  const updateData = (data) => {
    data.forEach((d,i)=>{
      d.index = i
    })
    setState({
      data,
      visible: true
    })
  }

  const onFill = () => {
    formRef.current.setFieldsValue({
      SOURCE: 'original_user_id',
      TARGET: 'user_id',
      DATE: 'created_at',
      EDGE_WIDTH: 'duration',
      EDGE_COLOR: 'distance',
      TOOLTIP_TITLE: 'created_at',
      TOOLTIP_DESCRIPTION: 'full_text'
    });
    test.forEach((d,i)=>{
      d.index = i
    })
    updateData(test)
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
          <Form.Item
            name="title"
            label="Choose a CSV/JSON file"
          >
            <FileUpload updateData={updateData}/>
            <Button type="link" htmlType="button" onClick={onFill}>
              Load sample & Fill form
            </Button>
          </Form.Item>  
          <Form.Item>
            <Text strong underline>Column Mapping</Text>
          </Form.Item>
          <Form.Item name="SOURCE" label="Source" rules={[
            {
              required: true,
              message: 'Please select column for Source',
            },
          ]}>
            <Input type="textarea" />
          </Form.Item>
          <Form.Item name="TARGET" label="Target" rules={[
            {
              required: true,
              message: 'Please select column for Target',
            },
          ]}>
            <Input type="textarea" />
          </Form.Item>
          <Form.Item name="DATE" label="Date">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item>
            <Text strong underline>Styles</Text>
          </Form.Item>
          <Form.Item name="EDGE_WIDTH" label="Edge Width">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item name="EDGE_COLOR" label="Edge Color">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item>
            <Text strong underline>Tooltip Content</Text>
          </Form.Item>
          <Form.Item name="TOOLTIP_TITLE" label="Title">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item name="TOOLTIP_DESCRIPTION" label="Description">
            <Input type="textarea" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );

};

export default FormModal