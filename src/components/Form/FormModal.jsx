import React, { useState, useContext } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import FileUpload from './FileUpload';
import { ModalContext } from "../contexts/ModalContext"

const FormModal = (props) => {

  const [state, setState] = useState({ visible: false, data: [] }) // clicked status
  const { modalState, setModal } = useContext(ModalContext)
  const [form] = Form.useForm();

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
    setState({
      data,
      visible: true
    })
  }

  return (
    <>
      <Form.Item>
        <Button type="primary" onClick={showModal}>
          Import data
        </Button>
      </Form.Item
      <Modal
        title="Import Data"
        visible={state.visible}
        onCancel={handleCancel}
        okButtonProps={{form:'myForm', key: 'submit', htmlType: 'submit'}}
      >
        <Form
          id='myForm'
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
          </Form.Item>  
          <Form.Item>
            <span className="ant-form-text">Column Mapping</span>
          </Form.Item>
          <Form.Item name="SOURCE" label="Source">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item name="TARGET" label="Target">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item name="DATE" label="Date">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item>
            <span className="ant-form-text">Styles</span>
          </Form.Item>
          <Form.Item name="EDGE_WIDTH" label="Edge Width">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item name="EDGE_COLOR" label="Edge Color">
            <Input type="textarea" />
          </Form.Item>
          <Form.Item>
            <span className="ant-form-text">Tooltip Content</span>
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